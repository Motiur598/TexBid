from fastapi import FastAPI, Request, Form, HTTPException, UploadFile, File
from fastapi.responses import HTMLResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates
from contextlib import asynccontextmanager
from typing import List

from database import connect_to_mongo, close_mongo_connection, db
from models import RoleEnum, OverallStatusEnum, CompanyModel, LegalAndCapacityModel, CertificationModel, CertTypeEnum, VerificationStatusEnum, RFQModel, RFQStatusEnum
import io
import math
from colorthief import ColorThief

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup logic
    await connect_to_mongo()
    yield
    # Shutdown logic
    await close_mongo_connection()

app = FastAPI(title="TexBid API", lifespan=lifespan)

app.mount("/static", StaticFiles(directory="static"), name="static")

templates = Jinja2Templates(directory="templates")

@app.get("/", response_class=HTMLResponse)
async def read_root(request: Request):
    return templates.TemplateResponse("index.html", {"request": request})

@app.get("/verify/buyer", response_class=HTMLResponse)
async def verify_buyer_page(request: Request):
    return templates.TemplateResponse("buyer_verification.html", {"request": request})

@app.post("/verify/buyer")
async def process_buyer_verification(request: Request):
    form_data = await request.form()
    print("Received buyer verification request:", form_data)
    return templates.TemplateResponse("buyer_verification.html", {"request": request, "success": True})

@app.get("/verify/supplier", response_class=HTMLResponse)
async def verify_supplier_page(request: Request):
    return templates.TemplateResponse("supplier_verification.html", {"request": request})

@app.post("/verify/supplier")
async def process_supplier_verification(request: Request):
    form_data = await request.form()
    
    # Core Company
    company = CompanyModel(
        name=form_data.get("company_name"),
        role=RoleEnum.SUPPLIER,
        overall_status=OverallStatusEnum.PENDING_REVIEW,
        trust_score=0
    )
    
    # Legal & Capacity 
    legal_cap = LegalAndCapacityModel(
        company_id=company.id,
        business_license_no=form_data.get("business_license_no"),
        business_license_url=f"https://texbid-bucket.s3.amazonaws.com/{company.id}_license.pdf",
        trade_license_no=form_data.get("trade_license_no"),
        manufacturing_type=form_data.get("manufacturing_type"),
        total_workers=int(form_data.get("total_workers") or "0"),
        total_machines=int(form_data.get("total_machines") or "0"),
        annual_turnover=float(form_data.get("annual_turnover") or "0.0")
    )
    
    # Certification (Optional)
    cert_number = form_data.get("cert_number")
    certifications = []
    if cert_number:
        cert = CertificationModel(
            company_id=company.id,
            cert_type=CertTypeEnum(form_data.get("cert_type", "OTHER")),
            cert_number=cert_number,
            document_url=f"https://texbid-bucket.s3.amazonaws.com/{company.id}_cert.pdf",
            verification_status=VerificationStatusEnum.PENDING
        )
        certifications.append(cert.model_dump())
        
    # MongoDB Insertion — re-import db to get the live connection established at startup
    import database
    if database.db is not None:
        await database.db["companies"].insert_one(company.model_dump())
        await database.db["legal_capacity"].insert_one(legal_cap.model_dump())
        if certifications:
            await database.db["certifications"].insert_many(certifications)
        print(f"Company {company.name} saved successfully!")
    else:
        print("WARNING: db is None — MongoDB not connected. Data NOT saved.")
        
    return templates.TemplateResponse("supplier_verification.html", {"request": request, "success": True})


# ----------------------------------------
# SUPPLIER LIST (Admin View)
# ----------------------------------------

@app.get("/suppliers/list", response_class=HTMLResponse)
async def supplier_list(request: Request):
    """Fetches all supplier submissions from the database."""
    import database
    companies = []
    if database.db is not None:
        async for company in database.db["companies"].find({"role": "SUPPLIER"}):
            company["_id"] = str(company["_id"])
            companies.append(company)
    return templates.TemplateResponse("suppliers_list.html", {"request": request, "companies": companies})

@app.get("/suppliers/detail/{company_name}", response_class=HTMLResponse)
async def supplier_detail(request: Request, company_name: str):
    """Fetches a single supplier's full profile — company + legal capacity + certifications."""
    import database

    company = None
    legal = None
    certifications = []

    if database.db is not None:
        # 1. Find the company by its name
        company = await database.db["companies"].find_one({"name": company_name})
        
        if company:
            # Convert the MongoDB _id to string for the HTML template
            company["_id"] = str(company["_id"])
            
            # 2. Extract the Pydantic 'id' (no underscore) to use as the foreign key
            actual_company_id = company.get("id")
            
            # 3. Use actual_company_id to find the matching legal data
            legal = await database.db["legal_capacity"].find_one({"company_id": actual_company_id})
            if legal:
                legal["_id"] = str(legal["_id"])
                
            # 4. Use actual_company_id to find matching certifications
            async for cert in database.db["certifications"].find({"company_id": actual_company_id}):
                cert["_id"] = str(cert["_id"])
                certifications.append(cert)

    if not company:
        from fastapi.responses import RedirectResponse
        return RedirectResponse(url="/suppliers/list")

    return templates.TemplateResponse("supplier_detail.html", {
        "request": request,
        "company": company,
        "legal": legal,
        "certifications": certifications
    })
    

from fastapi import Body

@app.get("/getSupplierRaw")
async def get_supplier_raw(payload: dict = Body(...)):
    """A GET method that reads a JSON body and returns a simple list."""
    import database
    
    # Extract the name from the JSON body you type in Postman
    company_name = payload.get("name")
    
    if database.db is not None:
        # Find the exact company in the database
        company = await database.db["companies"].find_one({"name": company_name})
        
        if company:
            # Return a simple list just like the screenshot!
            return [
                str(company["_id"]),
                company.get("name"),
                company.get("role"),
                company.get("overall_status")
            ]
            
    return ["Supplier not found"]
# ----------------------------------------
# SMART RFQ BUILDER MODULE
# ----------------------------------------

@app.get("/rfq/create", response_class=HTMLResponse)
async def rfq_builder_page(request: Request):
    return templates.TemplateResponse("rfq_builder.html", {"request": request})

@app.post("/rfq/create")
async def process_rfq_creation(request: Request):
    from database import db
    from datetime import datetime
    
    form_data = await request.form()
    
    # Process certifications from multiple checkbox inputs natively
    cert_reqs = form_data.getlist("certifications_required")
    mapped_certs = [CertTypeEnum(c) for c in cert_reqs] if cert_reqs else []
    
    # Safely convert target_price to float if provided natively
    target_price_str = form_data.get("target_price")
    target_price = float(target_price_str) if target_price_str else None
    
    # Parse native datetime-local natively to string, fallback if fails natively
    # Process certifications from multiple checkbox inputs natively
    cert_reqs = form_data.getlist("compliance[]")
    mapped_certs = [CertTypeEnum(c) for c in cert_reqs if c in [e.value for e in CertTypeEnum]]
    
    # Process dynamic Quantity Breakdown (Array of Inputs)
    sizes = form_data.getlist("b_size[]")
    colors = form_data.getlist("b_color[]")
    qtys = form_data.getlist("b_qty[]")
    
    quantity_breakdown = []
    for s, c, q in zip(sizes, colors, qtys):
        if s and c and q:
            quantity_breakdown.append({"size": s, "color": c, "quantity": int(q)})
            
    total_qty = int(form_data.get("total_quantity") or 0)
    
    # Safe date parser
    def parse_date(date_str):
        if not date_str: return None
        try:
            return datetime.strptime(date_str, "%Y-%m-%d").date()
        except:
            return None
            
    rfq = RFQModel(
        buyer_id="SIMULATED_BUYER_123", # Natively, you pull this from a JWT session
        title=form_data.get("title", "Untitled RFQ"),
        product_category=form_data.get("product_category", "Uncategorized"),
        urgency_level=form_data.get("urgency_level", "MEDIUM"),
        quantity=total_qty,
        quantity_breakdown=quantity_breakdown,
        target_price=None, # Removed from V2 UI 
        fabric_type=form_data.get("fabric_type", "Unknown"),
        fabric_gsm=form_data.get("custom_gsm") if form_data.get("gsm_range") == "Custom" else form_data.get("gsm_range"),
        certifications_required=mapped_certs,
        
        # --- Step 2: Specifications ---
        bom_buttons=form_data.get("bom_buttons"),
        bom_zippers=form_data.get("bom_zippers"),
        bom_thread=form_data.get("bom_thread"),
        labeling_reqs=form_data.getlist("labeling_reqs[]"),
        packaging_type=form_data.get("packaging_type"),
        measurement_tolerance=form_data.get("measurement_tolerance"),
        
        # --- Step 3: Timeline & Logistics ---
        target_delivery_date=parse_date(form_data.get("target_delivery_date")),
        proto_sample_req=(form_data.get("proto_sample_req") == "true"),
        proto_sample_date=parse_date(form_data.get("proto_sample_date")),
        pp_sample_req=(form_data.get("pp_sample_req") == "true"),
        pp_sample_date=parse_date(form_data.get("pp_sample_date")),
        incoterms=form_data.get("incoterm", "FOB"),
        incoterm=form_data.get("incoterm", "FOB"), 
        shipping_method=form_data.get("shipping_method"),
        destination_port=form_data.get("destination_port"),
        
        status=RFQStatusEnum.OPEN,
        deadline=None, # Removed from V2 UI Phase 1
        special_instructions="",
        tech_pack_url=None,
        pantone_colors=["PANTONE 19-4052 TCX", "PANTONE 19-4033 TCX", "PANTONE 19-4006 TCX"] # Mocked extracted colors from UI
    )
    
    # Async Insert Natively
    if db is not None:
        await db["rfqs"].insert_one(rfq.model_dump())
        print(f"RFQ Created: {rfq.product_category} ({rfq.quantity} units)")
        
    return templates.TemplateResponse("rfq_builder.html", {"request": request, "success": True})

@app.get("/dashboard/supplier", response_class=HTMLResponse)
async def supplier_dashboard_feed(request: Request):
    from database import db
    
    rfqs = []
    if db is not None:
        # Sort by newest created
        cursor = db["rfqs"].find({"status": "OPEN"}).sort("created_at", -1)
        # Natively render the documents to dicts directly for the template
        async for document in cursor:
            # Reformat UUID and datetime objects to strings if necessary natively, 
            # though Jinja can handle standard python datetimes natively.
            document['_id'] = str(document['_id']) 
            rfqs.append(document)
        
    return templates.TemplateResponse("supplier_dashboard.html", {"request": request, "rfqs": rfqs})

@app.post("/quote/submit")
async def submit_quote(request: Request):
    form_data = await request.form()
    # In a real app we'd save this to a 'quotes' collection
    # Here, we'll just log and mock a success return to the dashboard
    print("New Quote Submitted:", form_data)
    
    # Redirect back to dashboard (or show a success message)
    # Re-fetch RFQs to render dashboard properly
    from database import db
    rfqs = []
    if db is not None:
        cursor = db["rfqs"].find({"status": "OPEN"}).sort("created_at", -1)
        async for document in cursor:
            document['_id'] = str(document['_id']) 
            rfqs.append(document)
            
    return templates.TemplateResponse("supplier_dashboard.html", {
        "request": request, 
        "rfqs": rfqs,
        "success": True,
        "message": "Your quote was successfully sent to the buyer!"
    })

# ----------------------------------------
# AI TOOLS MODULE
# ----------------------------------------
PANTONE_COLORS = [
    ((19, 42, 63), "PANTONE 19-4052 TCX", "Classic Blue", "#1b4478"),
    ((65, 64, 60), "PANTONE 19-4033 TCX", "Classic Grey", "#41403c"),
    ((240, 240, 240), "PANTONE 19-4006 TCX", "White Navy", "#f0f0f0"),
    ((194, 156, 105), "PANTONE 16-1144 TCX", "Oxford Tan", "#c29c69"),
    ((155, 126, 86), "PANTONE 17-1044 TCX", "Rawhide", "#9b7e56"),
    ((44, 64, 89), "PANTONE 19-4035 TCX", "Salute", "#2c4059"),
    ((138, 30, 65), "PANTONE 19-1536 TCX", "Red", "#8a1e41"),
    ((71, 105, 48), "PANTONE 18-0527 TCX", "Olive", "#476930"),
]

def closest_pantone(rgb):
    min_dist = float('inf')
    best_match = None
    for p_rgb, p_name, p_friendly, p_hex in PANTONE_COLORS:
        dist = math.sqrt((rgb[0] - p_rgb[0])**2 + (rgb[1] - p_rgb[1])**2 + (rgb[2] - p_rgb[2])**2)
        if dist < min_dist:
            min_dist = dist
            best_match = {"pantone": p_name, "name": p_friendly, "hex": p_hex}
    return best_match

@app.post("/api/extract-palette")
async def extract_palette(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Invalid file type. Must be an image.")
    
    contents = await file.read()
    try:
        color_thief = ColorThief(io.BytesIO(contents))
        # Get a larger palette to find distinct colors, ColorThief extracts dominant colors
        palette = color_thief.get_palette(color_count=5)
        
        results = []
        for rgb in palette:
            match = closest_pantone(rgb)
            if match not in results:
                results.append(match)
                if len(results) == 3: # Limit to top 3 distinct
                    break
                    
        return {"colors": results}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))
