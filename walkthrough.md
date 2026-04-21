# TexBid Dashboard Project Walkthrough

This document summarizes the features implemented for the TexBid B2B SaaS Dashboard, including the frontend UI and backend integration.

## Features Implemented

### 1. Multi-Currency Support (Core Feature 1)
- **Global Toggle**: Located in the top header and inside the Financial Summary card.
- **Conversion Logic**: Automatically converts the base order value into USD, EUR, or BDT.
- **Transparency**: Displays the prominent converted value with a subtle base currency subtitle (e.g., *≈ $45,000 USD*).
- **Aesthetics**: Smooth fade transitions when values update.

### 2. Milestone Tracking Timeline (Core Feature 2)
- **Production Stages**: Order Placed → Fabric Sourcing → Cutting → Sewing → Finishing → Shipping.
- **Visual States**:
  - **Completed**: Green with checkmarks and timestamps.
  - **In-Progress**: Blue with a pulse/spinning animation (e.g., the "Cutting" stage).
  - **Pending**: Grayed out for future milestones.
- **Responsiveness**: 
  - **Horizontal** layout on Desktop.
  - **Vertical** layout on Mobile/Tablet.
  - **Hamburger Menu**: Mobile sidebar collapses into a toggleable menu.

## Backend Integration
- **FastAPI Endpoint**: The dashboard is powered by the `GET /api/dashboard/active-order` endpoint in `backend/main.py`.
- **CORS Configured**: The backend accepts requests from the Vite development server.
- **Dynamic Data**: The UI displays the requested mock data (10,000 pcs Men's T-Shirts for TexFab Industries).

## How to Run
1.  **Start Backend**:
    ```powershell
    cd backend
    python -m uvicorn main:app --port 8001 --reload
    ```
2.  **Start Frontend**:
    ```powershell
    cd frontend
    npm run dev
    ```
3.  **Visit Dashboard**: Open the Local URL (usually `http://localhost:5173`).
