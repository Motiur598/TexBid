from pydantic import BaseModel, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime
import uuid

# --- Enums ---
class RoleEnum(str, Enum):
    BUYER = "BUYER"
    SUPPLIER = "SUPPLIER"

class OverallStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    PENDING_REVIEW = "PENDING_REVIEW"
    VERIFIED = "VERIFIED"
    REJECTED = "REJECTED"

class CertTypeEnum(str, Enum):
    ISO_9001 = "ISO_9001"
    WRAP = "WRAP"
    OEKO_TEX = "OEKO_TEX"
    BSCI = "BSCI"
    OTHER = "OTHER"

class VerificationStatusEnum(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    EXPIRED = "EXPIRED"
    INVALID = "INVALID"

class RFQStatusEnum(str, Enum):
    DRAFT = "DRAFT"
    OPEN = "OPEN"
    EVALUATING = "EVALUATING"
    AWARDED = "AWARDED"
    CLOSED = "CLOSED"

class UrgencyLevelEnum(str, Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"



# --- Models ---
class CompanyModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the company")
    name: str = Field(..., description="The official registered name of the business")
    role: RoleEnum = Field(..., description="BUYER or SUPPLIER")
    overall_status: OverallStatusEnum = Field(default=OverallStatusEnum.DRAFT, description="Approval status")
    trust_score: int = Field(default=0, ge=0, le=100, description="Calculated score (0-100) based on verified data")
    created_at: datetime = Field(default_factory=datetime.utcnow, description="When the profile was created")

class LegalAndCapacityModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str = Field(..., description="Links back to the Companies table")
    business_license_no: str = Field(..., description="The official government license number")
    business_license_url: str = Field(..., description="Secure link to uploaded document")
    trade_license_no: str = Field(..., description="The trade license number")
    manufacturing_type: str = Field(..., description="e.g. Knit, Woven, Denim")
    total_workers: int = Field(default=0, description="Total number of employees")
    total_machines: int = Field(default=0, description="Total machinery count")
    annual_turnover: float = Field(default=0.0, description="Approximate yearly revenue")

class CertificationModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    company_id: str = Field(..., description="Links back to Companies table")
    cert_type: CertTypeEnum = Field(..., description="Type of certification")
    cert_number: str = Field(..., description="Unique ID on the certificate")
    document_url: str = Field(..., description="Secure link to the uploaded certificate")
    issue_date: Optional[datetime] = None
    expiry_date: Optional[datetime] = None
    verification_status: VerificationStatusEnum = Field(default=VerificationStatusEnum.PENDING)

class RFQModel(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    buyer_id: str = Field(..., description="Simulated Buyer ID")
    title: str = Field(default="Untitled RFQ", description="Project or Order Title")
    product_category: str = Field(..., description="e.g. T-Shirts, Denim, Activewear")
    urgency_level: UrgencyLevelEnum = Field(default=UrgencyLevelEnum.MEDIUM)
    quantity: int = Field(default=0, description="Total units required (sum of breakdown or legacy)")
    quantity_breakdown: List[dict] = Field(default_factory=list, description="List of {size, color, quantity} dicts")
    target_price: Optional[float] = Field(None, description="Optional target price per unit")
    fabric_type: str = Field(..., description="e.g. 100% Cotton, Poly-blend")
    fabric_gsm: Optional[str] = Field(None, description="e.g. 160-190 or Custom 175")
    certifications_required: List[CertTypeEnum] = Field(default_factory=list, description="List of required certificates")
    
    # Step 2: Specs
    bom_buttons: Optional[str] = None
    bom_zippers: Optional[str] = None
    bom_thread: Optional[str] = None
    labeling_reqs: List[str] = Field(default_factory=list)
    packaging_type: Optional[str] = None
    measurement_tolerance: Optional[str] = None
    
    # Step 3: Logistics
    target_delivery_date: Optional[datetime] = None
    proto_sample_req: bool = False
    proto_sample_date: Optional[datetime] = None
    pp_sample_req: bool = False
    pp_sample_date: Optional[datetime] = None
    incoterm: str = Field(default="FOB")
    incoterms: str = Field(default="FOB") # Legacy compat
    shipping_method: Optional[str] = None
    destination_port: Optional[str] = None

    status: RFQStatusEnum = Field(default=RFQStatusEnum.OPEN)
    created_at: datetime = Field(default_factory=datetime.utcnow)
    deadline: Optional[datetime] = None
    special_instructions: Optional[str] = None
    tech_pack_url: Optional[str] = Field(None, description="URL to main tech pack")
    design_files: List[str] = Field(default_factory=list, description="List of URLs for inspiration gallery")
    pantone_colors: List[str] = Field(default_factory=list, description="Primary visual specs")
