from typing import List, Optional, Any, Dict
from pydantic import BaseModel
from datetime import datetime

# --- Auth & User ---
class UserBase(BaseModel):
    full_name: str
    email: str
    role: str = "customer"
    restaurant_id: Optional[int] = None
    delivery_partner_id: Optional[int] = None

class UserCreate(UserBase):
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class UserOut(UserBase):
    id: int
    status: str
    created_at: datetime
    last_login: Optional[datetime] = None

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user: UserOut

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None
    user_id: Optional[int] = None
    restaurant_id: Optional[int] = None
    delivery_partner_id: Optional[int] = None

class LoginActivityOut(BaseModel):
    id: int
    user_id: int
    ip_address: Optional[str]
    user_agent: Optional[str]
    success: bool
    event_type: str
    created_at: datetime

    class Config:
        from_attributes = True


# --- Orders ---
class OrderItem(BaseModel):
    item: str
    quantity: int = 1
    ingredients: List[str] = []
    price: float = 0.0

class OrderOut(BaseModel):
    id: int
    order_number: str
    customer_id: int
    restaurant_id: int
    delivery_partner_id: Optional[int] = None
    items_json: List[Dict[str, Any]]
    total_amount: float
    order_date: datetime
    status: str
    restaurant_dispatch_time: Optional[datetime] = None
    restaurant_package_image: Optional[str] = None
    delivery_handover_time: Optional[datetime] = None
    delivery_handover_image: Optional[str] = None

    class Config:
        from_attributes = True


# --- Evidence & Predictions ---
class UploadedEvidenceOut(BaseModel):
    id: int
    evidence_type: str
    file_path: str
    annotated_path: Optional[str] = None
    uploaded_by: str
    created_at: datetime

    class Config:
        from_attributes = True

class BoundingBox(BaseModel):
    box: List[float]  # [x1, y1, x2, y2]
    label: str
    confidence: float
    color: Optional[str] = "#00f2fe"

class ModelPredictionOut(BaseModel):
    id: int
    model_name: str
    model_version: str
    is_custom_weights: bool
    input_image_path: str
    annotated_image_path: Optional[str] = None
    detected_classes: List[str]
    confidence: float
    bounding_boxes: Optional[List[Dict[str, Any]]] = None
    raw_output: Optional[Dict[str, Any]] = None
    target_verified: Optional[bool] = None
    execution_time_ms: float
    created_at: datetime

    class Config:
        from_attributes = True


# --- Risk Assessment & Reports ---
class RiskAssessmentOut(BaseModel):
    id: int
    risk_score: float
    priority_level: str
    outcome: str
    model_confidence_factor: float
    evidence_discrepancy_factor: float
    customer_history_factor: float
    restaurant_history_factor: float
    factors_breakdown: Optional[Dict[str, Any]] = None
    created_at: datetime

    class Config:
        from_attributes = True

class InvestigationReportOut(BaseModel):
    id: int
    summary_text: str
    ai_explanation: str
    uncertainty_notes: Optional[str] = None
    recommended_action: str
    generated_by_llm: bool
    created_at: datetime

    class Config:
        from_attributes = True


# --- Feedback ---
class FeedbackCreate(BaseModel):
    prediction_id: Optional[int] = None
    is_prediction_correct: bool
    corrected_classes: Optional[List[str]] = None
    suitable_for_training: bool = False
    dataset_split: str = "unassigned"  # train, val, test, rejected
    reviewer_notes: Optional[str] = None

class FeedbackOut(FeedbackCreate):
    id: int
    investigation_id: int
    reviewer_id: int
    created_at: datetime

    class Config:
        from_attributes = True


# --- Investigation ---
class InvestigationCreate(BaseModel):
    order_number: str
    complaint_category: str
    complaint_description: str
    target_ingredient: Optional[str] = None

class InvestigationVerdictUpdate(BaseModel):
    final_verdict: str  # Legitimate, Confirmed Fraud, Inconclusive, No Issue Found
    responsible_party: str  # Customer, Restaurant, Delivery Partner, Multiple Parties, Undetermined
    status: str = "resolved"  # under_review, resolved, rejected
    resolution_notes: Optional[str] = None

class RestaurantResponseCreate(BaseModel):
    restaurant_response: str

class CourierStatementCreate(BaseModel):
    courier_statement: str

class InvestigationOut(BaseModel):
    id: int
    investigation_code: str
    customer_id: int
    order_id: int
    complaint_category: str
    original_query: str
    target_ingredient: Optional[str] = None
    selected_model: str
    status: str
    final_verdict: str
    responsible_party: str
    risk_score: float
    created_at: datetime
    resolved_at: Optional[datetime] = None
    resolution_notes: Optional[str] = None
    restaurant_response: Optional[str] = None
    restaurant_response_time: Optional[datetime] = None
    courier_statement: Optional[str] = None
    courier_statement_time: Optional[datetime] = None

    class Config:
        from_attributes = True

class InvestigationDetailOut(InvestigationOut):
    customer: UserOut
    order: OrderOut
    evidence: List[UploadedEvidenceOut] = []
    predictions: List[ModelPredictionOut] = []
    risk_assessment: Optional[RiskAssessmentOut] = None
    report: Optional[InvestigationReportOut] = None
    feedback: List[FeedbackOut] = []


# --- Dashboard Stats ---
class ModelStatusCard(BaseModel):
    id: str
    name: str
    type: str
    status: str  # ready, custom_loaded, missing_weights
    version: str
    weights_path: str
    classes_count: int
    classes_sample: List[str]
    latency_ms: float
    accuracy_metric: str

class DashboardStatsOut(BaseModel):
    total_investigations: int
    verified_claims: int
    claims_requiring_review: int
    potential_suspicious_activity: int
    avg_risk_score: float
    model_usage: Dict[str, int]
    models_status: List[ModelStatusCard]
    recent_investigations: List[InvestigationOut]
