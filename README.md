# FOODGUARD AI (v2.0)
### Autonomous AI-Powered Food Delivery Fraud Detection & Dispute Resolution Platform

FoodGuard AI is a production-style forensic dispute investigation and fraud mitigation platform designed for high-volume online food delivery ecosystems. The system adjudicates customer, restaurant, and delivery partner disputes through dynamic natural language complaint parsing, centralized database lifecycle tracking, an evidence-based risk scoring engine, and four dedicated computer vision models.

---

## 1. System Architecture

```
                                  ┌──────────────────────────────────────────────┐
                                  │      FoodGuard AI Futuristic Web UI          │
                                  │ (React 18 + TypeScript + Tailwind + Lucide)  │
                                  └──────────────────────┬───────────────────────┘
                                                         │ HTTP / REST / JSON
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │          FastAPI Backend Gateway             │
                                  │   (JWT Auth, RBAC, Multi-part Image API)     │
                                  └──────────────┬───────────────┬───────────────┘
                                                 │               │
                     ┌───────────────────────────┘               └───────────────────────────┐
                     ▼                                                                       ▼
    ┌──────────────────────────────────┐                                    ┌──────────────────────────────────┐
    │     Dispute Decision Engine      │                                    │   4x Computer Vision Engines     │
    ├──────────────────────────────────┤                                    ├──────────────────────────────────┤
    │ • Dynamic NLP Complaint Parser   │                                    │ • Model 1: Food & Ingredient YOLO│
    │ • Multi-Factor Risk Scorer (0-100│                                    │ • Model 2: Package Tamper Verif. │
    │ • Structured AI Report Generator │                                    │ • Model 3: Spillage & Leakage Det│
    │ • Retraining Feedback Pipeline   │                                    │ • Model 4: Foreign Object Det.   │
    └────────────────┬─────────────────┘                                    └────────────────┬─────────────────┘
                     │                                                                       │
                     ▼                                                                       ▼
    ┌──────────────────────────────────┐                                    ┌──────────────────────────────────┐
    │    Centralized Relational DB     │                                    │    Model Weights & Annotation    │
    │ (PostgreSQL / SQLite / Supabase) │                                    │  (Ultralytics YOLO, PyTorch, CV) │
    └──────────────────────────────────┘                                    └──────────────────────────────────┘
```

---

## 2. Four Independently Trained Computer Vision Models

FoodGuard AI provides dedicated inference pipelines with dynamic model loading for all four dispute categories. Pre-trained weights files (`.pt`) reside in `backend/models/weights/`. If custom weights are uploaded, the engine hot-reloads dynamically.

### Model 1: YOLO Food Ingredient & Item Detection
- **Target Weights Path:** `backend/models/weights/food_ingredient_yolo.pt`
- **Architecture:** `YOLOv8x-FoodDet`
- **Supported Classes (16):** `pizza`, `paneer`, `cheese`, `tomato`, `onion`, `capsicum`, `mushroom`, `olive`, `pepperoni`, `chicken`, `burger`, `patty`, `lettuce`, `pasta`, `sauce`, `crust`
- **Dynamic Ingredient Verification:** Rather than merely listing detected food items, the system extracts the specific target ingredient from the user's natural language complaint (e.g. *"I ordered a paneer pizza, but there is no paneer on it"* $\to$ `paneer`). The model verifies whether the target ingredient is present in the image above the confidence threshold and flags missing claims accordingly.

### Model 2: Restaurant & Courier Package Integrity Verifier
- **Target Weights Path:** `backend/models/weights/package_tamper.pt`
- **Architecture:** `Siamese-ResNet50 + ORB Homography & SSIM`
- **Inputs:** Dual photographs — Image 1 (Restaurant dispatch baseline) & Image 2 (Courier handover photo).
- **Invariance:** Uses feature matching (ORB + RANSAC homography) to cancel out rotation, distance, lighting, and camera angle differences, preventing false positives from handheld angles.
- **Output:** Structural similarity index ($0.0$ to $1.0$), discrepancy heatmap, tamper probability, and a side-by-side composite visual comparison.

### Model 3: Food Spillage & Leakage Detection
- **Target Weights Path:** `backend/models/weights/spillage_yolo.pt`
- **Architecture:** `YOLOv8-SpillSeg`
- **Supported Classes (6):** `liquid_spill`, `curry_leakage`, `oil_stain`, `ruptured_lid`, `grease_soak`, `container_rupture`
- **Severity Classification:** Dynamically calculates physical spill surface area ratio relative to packaging:
  - *Minor Leakage* ($< 6\%$ surface area)
  - *Moderate Spillage* ($6\% - 20\%$ surface area)
  - *Severe Transit Damage* ($> 20\%$ surface area)

### Model 4: Foreign Object & Contaminant Detection
- **Target Weights Path:** `backend/models/weights/foreign_object_yolo.pt`
- **Architecture:** `YOLOv8-ContaminantDetect`
- **Supported Classes (7):** `hair`, `insect`, `plastic_shard`, `metal_wire`, `staple_pin`, `stone_pebble`, `paper_debris`
- **Output:** Categorized contaminant bounding box, danger crosshairs, confidence value, and immediate food safety risk escalation flag.

---

## 3. Centralized Database Schema & Full Lifecycle Tracking

The platform uses SQLAlchemy with full relational support (PostgreSQL or SQLite), capturing the complete dispute lifecycle:

1. **`users`**: Multi-role accounts (`customer`, `restaurant`, `delivery_partner`, `admin`) with hashed passwords and status.
2. **`login_activity`**: Full security audit log tracking user ID, IP address, user agent, event type, and session tokens.
3. **`restaurants`**: Profiles with compliance ratings and historical hygiene tiers.
4. **`delivery_partners`**: Courier profiles with delivery counts and vehicle telemetry.
5. **`orders`**: Complete order records with line items, ingredients, timestamps, restaurant dispatch photo, and courier handover photo.
6. **`investigations`**: Central dispute dossiers linked to customer and order, with status (`submitted`, `processing`, `under_review`, `resolved`), adjudication verdict, and hypothesis party.
7. **`uploaded_evidence`**: Raw customer, restaurant, and courier evidence files.
8. **`model_predictions`**: Immutable telemetry records storing detected classes, bounding boxes, confidence, execution time, and annotated image URLs.
9. **`risk_assessments`**: Evidence-based risk score ($0$ to $100$), priority level, outcome, and mathematical factor breakdown.
10. **`investigation_reports`**: AI explanations, uncertainty disclosures, and recommended operational next actions.
11. **`feedback_records`**: Reviewer verification, corrected labels, and training dataset partition tagging (`train`, `val`, `test`).

---

## 4. Multi-Factor Risk Scoring Engine

The risk score ($0$ to $100$) serves as an **investigation priority indicator**, not an automated presumption of fraud:

$$\text{Risk Score} = (0.60 \times \text{Discrepancy}) + (0.20 \times \text{Customer History}) + (0.10 \times \text{Restaurant History}) + (0.10 \times \text{Model Uncertainty})$$

- **Tri-State Investigation Outcomes:**
  1. `Verified Issue` (Evidence clearly supports complaint; automated compensation/refund initiated).
  2. `Requires Manual Investigation` (Ambiguous photographic evidence or high dispute history; routed to human officer).
  3. `No Issue Detected` (Evidence refutes complaint, e.g. target ingredient clearly visible).

---

## 5. Four Distinct Role-Based Dashboards & RBAC Protection

FoodGuard AI features **four completely independent role dashboards**, each equipped with dedicated layouts, navigation menus, business operations, and strict backend permission enforcement:

### 1. Customer Portal (`customer` — Alex Mercer)
- **Navigation:**
  - 💬 **AI Dispute Chatbot:** File complaints with photographic evidence and watch 6-stage AI vision inference execute live.
  - 📦 **My Orders:** View personal orders, ordered toppings, delivery timestamps, and trigger one-click issue reports.
  - 📋 **My Disputes & Refunds:** Track status (`under_review`, `resolved`), AI bounding boxes, risk scores, and credited refunds.
- **Data Scope:** Strictly limited to the customer's own orders and complaints. Cannot access other customers, restaurant operational logs, or adjudication controls.

### 2. Restaurant Kitchen Hub (`restaurant` — Marco Rossi / Bella Napoli)
- **Navigation:**
  - 📊 **Kitchen Overview:** Kitchen Quality Compliance Score (97.5%), orders prepared, dispute incident rates.
  - 🍳 **Kitchen Orders & Packaging Proof:** Real-time orders board with **Attach Packaging Proof Photo** feature to record intact seal photographs *before* courier pickup, preventing false missing topping claims.
  - 🔍 **Dispute Defense & Inquiries:** Inspect customer claims against the kitchen and submit **Chef Explanations / Counter-Evidence** notes.
  - 📜 **Recipe & Ingredient Standards:** Quality specs and YOLO Model 1 topping compliance guidelines.
- **Data Scope:** Restricted to orders baked by this kitchen and disputes lodged against them.

### 3. Delivery Courier Terminal (`delivery_partner` — Devon Carter / SpeedyDrop)
- **Navigation:**
  - 🛵 **Transit Overview:** Transit Integrity Score (98.2%), total deliveries completed, seal tampering allegations, spillage incidents.
  - 📦 **Assigned Deliveries & Handover Proof:** View assigned pickups and upload **Doorstep Handover Proof Photos** upon delivery to customer.
  - 🛡️ **Transit Disputes & Seal Verifications:** Review package tampering (Model 2) and spillage (Model 3) disputes; submit **Courier Transit Condition Statements**.
- **Data Scope:** Restricted to deliveries assigned to this courier.

### 4. Forensic Operations Center (`admin` — Chief Investigator Sarah Vance)
- **Navigation:**
  - 🛡️ **Global Risk Radar:** Global dispute KPIs across all parties, high-risk fraud alerts, 4 integrated model telemetry cards.
  - 📁 **Dispute Adjudication Center:** Full archive of all investigations; exclusive authority to commit final verdicts (`Verified Issue`, `Confirmed Fraud`, `Requires Manual Investigation`, `No Issue Detected`) and assign responsible parties.
  - 👥 **Platform Audit Hub:** Users Registry, real-time Security & Login audit log (`login_activity`), and cross-party scorecards.
  - ⚡ **Vision Lab:** Model weights deployment (`.pt` upload) and human-verified retraining dataset export.
  - 🧪 **AI Forensic Simulator:** Full simulator access to test dispute scenarios.

---

## 6. Pre-Configured Demo Accounts & Quick Role Switcher

| Role | Name | Email | Password |
|---|---|---|---|
| **Admin** | Chief Investigator Sarah Vance | `admin@foodguard.ai` | `Admin@2026` |
| **Customer** | Alex Mercer | `alex@foodguard.ai` | `Customer@2026` |
| **Restaurant** | Marco Rossi (Bella Napoli) | `manager@bellapizza.com` | `Partner@2026` |
| **Delivery Courier** | Devon Carter (SpeedyDrop) | `rider@speedydrop.com` | `Rider@2026` |

### One-Click Test Cases in UI:
1. **Missing Paneer:** Select Category 1, Order `#ORD-8942-X`. The model detects Pizza, Cheese, Tomato, Onion, and Capsicum, but confirms `paneer` is absent. Claim verified.
2. **Tampered Box:** Select Category 2, Order `#ORD-8942-X`. Compares dispatch vs handover photos; detects broken green security tape. Tampering flagged.
3. **Spilled Curry:** Select Category 3, Order `#ORD-7721-B`. Detects ruptured container lid and fluid spread ($11\%$ surface area). Claim verified.
4. **Hair Contaminant:** Select Category 4, Order `#ORD-4419-C`. High-contrast morphological edge filtering pinpoints hair inclusion. Hygiene warning issued.
5. **Non-Visual Issue (Cold Food):** Select Category 5. FoodGuard AI transparently explains that computer vision cannot verify taste/temperature and routes to customer service.

---

## 6. Execution & Setup Instructions

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### Backend Setup
```bash
cd backend
# Database seeds automatically on first run
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
```
API documentation available at `http://127.0.0.1:8000/docs`.

### Frontend Setup
```bash
cd frontend
npm.cmd run dev
```
Open `http://localhost:5173` in your browser.

### Windows One-Click Launchers
- Backend: Double-click `backend/start_backend.bat`
- Frontend: Double-click `frontend/start_frontend.bat`
