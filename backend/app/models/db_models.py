import datetime
from sqlalchemy import (
    Column, Integer, String, Float, Boolean, DateTime, ForeignKey, Text, JSON
)
from sqlalchemy.orm import relationship
from app.database import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(150), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    role = Column(String(30), default="customer")  # customer, restaurant, delivery_partner, admin
    status = Column(String(20), default="active")  # active, suspended, pending
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    last_login = Column(DateTime, nullable=True)
    
    # Linked business entities for restaurant and delivery partner users
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=True)
    delivery_partner_id = Column(Integer, ForeignKey("delivery_partners.id"), nullable=True)
    
    # Relationships
    login_activities = relationship("LoginActivity", back_populates="user", cascade="all, delete-orphan")
    orders = relationship("Order", back_populates="customer", foreign_keys="Order.customer_id")
    investigations = relationship("Investigation", back_populates="customer")
    feedback_reviews = relationship("FeedbackRecord", back_populates="reviewer")


class LoginActivity(Base):
    __tablename__ = "login_activity"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False)
    session_id = Column(String(100), nullable=True)
    ip_address = Column(String(45), default="127.0.0.1")
    user_agent = Column(String(255), nullable=True)
    success = Column(Boolean, default=True)
    event_type = Column(String(50), default="login")  # login, logout, failed_attempt
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    user = relationship("User", back_populates="login_activities")


class Restaurant(Base):
    __tablename__ = "restaurants"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(150), nullable=False)
    address = Column(String(255), nullable=False)
    contact_phone = Column(String(20), nullable=True)
    rating = Column(Float, default=4.5)
    compliance_score = Column(Float, default=98.5)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    orders = relationship("Order", back_populates="restaurant")


class DeliveryPartner(Base):
    __tablename__ = "delivery_partners"
    
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    vehicle_type = Column(String(50), default="Motorcycle")  # Motorcycle, Electric Scooter, Bicycle
    phone = Column(String(20), nullable=True)
    rating = Column(Float, default=4.8)
    deliveries_completed = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    orders = relationship("Order", back_populates="delivery_partner")


class Order(Base):
    __tablename__ = "orders"
    
    id = Column(Integer, primary_key=True, index=True)
    order_number = Column(String(50), unique=True, index=True, nullable=False)  # e.g. ORD-8942-X
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    restaurant_id = Column(Integer, ForeignKey("restaurants.id"), nullable=False)
    delivery_partner_id = Column(Integer, ForeignKey("delivery_partners.id"), nullable=True)
    
    # Ordered items JSON: [{"item": "Paneer Pizza", "quantity": 1, "ingredients": ["paneer", "cheese", "tomato", "onion", "crust"], "price": 14.99}]
    items_json = Column(JSON, nullable=False)
    total_amount = Column(Float, nullable=False)
    order_date = Column(DateTime, default=datetime.datetime.utcnow)
    status = Column(String(30), default="delivered")  # preparing, dispatched, in_transit, delivered, disputed
    
    # Tracking evidence captured by restaurant and courier
    restaurant_dispatch_time = Column(DateTime, nullable=True)
    restaurant_package_image = Column(String(255), nullable=True)
    delivery_handover_time = Column(DateTime, nullable=True)
    delivery_handover_image = Column(String(255), nullable=True)
    
    # Relationships
    customer = relationship("User", back_populates="orders", foreign_keys=[customer_id])
    restaurant = relationship("Restaurant", back_populates="orders")
    delivery_partner = relationship("DeliveryPartner", back_populates="orders")
    investigations = relationship("Investigation", back_populates="order")


class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_code = Column(String(50), unique=True, index=True, nullable=False)  # e.g. INV-2026-9041
    customer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    order_id = Column(Integer, ForeignKey("orders.id"), nullable=False)
    
    # Predefined complaint categories:
    # 1. Missing Food Item / Ingredient
    # 2. Package Tampering / Condition Change
    # 3. Food Spillage / Leakage
    # 4. Foreign Object in Food
    # 5. Other Order Issues
    complaint_category = Column(String(80), nullable=False)
    original_query = Column(Text, nullable=False)
    target_ingredient = Column(String(100), nullable=True)  # dynamically extracted, e.g. "paneer"
    
    selected_model = Column(String(80), nullable=False)  # Model 1, Model 2, Model 3, Model 4, or None
    status = Column(String(30), default="submitted")  # submitted, processing, under_review, resolved, rejected
    
    # Final verdicts: Legitimate, Confirmed Fraud, Inconclusive, No Issue Found
    final_verdict = Column(String(40), default="Inconclusive")
    # Responsible party: Customer, Restaurant, Delivery Partner, Multiple Parties, Undetermined
    responsible_party = Column(String(40), default="Undetermined")
    
    risk_score = Column(Float, default=50.0)  # 0 to 100
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    resolved_at = Column(DateTime, nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Role-specific dispute responses
    restaurant_response = Column(Text, nullable=True)
    restaurant_response_time = Column(DateTime, nullable=True)
    courier_statement = Column(Text, nullable=True)
    courier_statement_time = Column(DateTime, nullable=True)
    
    # Relationships
    customer = relationship("User", back_populates="investigations")
    order = relationship("Order", back_populates="investigations")
    evidence = relationship("UploadedEvidence", back_populates="investigation", cascade="all, delete-orphan")
    predictions = relationship("ModelPrediction", back_populates="investigation", cascade="all, delete-orphan")
    risk_assessment = relationship("RiskAssessment", back_populates="investigation", uselist=False, cascade="all, delete-orphan")
    report = relationship("InvestigationReport", back_populates="investigation", uselist=False, cascade="all, delete-orphan")
    feedback = relationship("FeedbackRecord", back_populates="investigation", cascade="all, delete-orphan")


class UploadedEvidence(Base):
    __tablename__ = "uploaded_evidence"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    evidence_type = Column(String(50), nullable=False)  # customer_food_photo, restaurant_dispatch_photo, delivery_handover_photo
    file_path = Column(String(255), nullable=False)
    annotated_path = Column(String(255), nullable=True)
    uploaded_by = Column(String(50), default="customer")
    mime_type = Column(String(50), default="image/jpeg")
    file_size_bytes = Column(Integer, default=0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    investigation = relationship("Investigation", back_populates="evidence")


class ModelPrediction(Base):
    __tablename__ = "model_predictions"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    model_name = Column(String(80), nullable=False)
    model_version = Column(String(50), default="1.0.0")
    is_custom_weights = Column(Boolean, default=False)
    
    input_image_path = Column(String(255), nullable=False)
    annotated_image_path = Column(String(255), nullable=True)
    
    # Prediction details
    detected_classes = Column(JSON, nullable=False)  # ["pizza", "cheese", "onion"]
    confidence = Column(Float, nullable=False)  # 0.0 - 1.0
    bounding_boxes = Column(JSON, nullable=True)  # [[x1, y1, x2, y2, label, score], ...]
    raw_output = Column(JSON, nullable=True)  # Full telemetry & model metrics
    
    target_verified = Column(Boolean, nullable=True)  # True/False/None
    execution_time_ms = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    investigation = relationship("Investigation", back_populates="predictions")


class RiskAssessment(Base):
    __tablename__ = "risk_assessments"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    risk_score = Column(Float, nullable=False)  # 0 to 100
    priority_level = Column(String(20), default="Medium")  # Low, Medium, High, Critical
    outcome = Column(String(50), nullable=False)  # Verified Issue, Requires Manual Investigation, No Issue Detected
    
    # Detailed factor weights & explanations
    model_confidence_factor = Column(Float, default=0.0)
    evidence_discrepancy_factor = Column(Float, default=0.0)
    customer_history_factor = Column(Float, default=0.0)
    restaurant_history_factor = Column(Float, default=0.0)
    factors_breakdown = Column(JSON, nullable=True)
    
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    investigation = relationship("Investigation", back_populates="risk_assessment")


class InvestigationReport(Base):
    __tablename__ = "investigation_reports"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    summary_text = Column(Text, nullable=False)
    ai_explanation = Column(Text, nullable=False)
    uncertainty_notes = Column(Text, nullable=True)
    recommended_action = Column(String(150), nullable=False)
    generated_by_llm = Column(Boolean, default=False)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    investigation = relationship("Investigation", back_populates="report")


class FeedbackRecord(Base):
    __tablename__ = "feedback_records"
    
    id = Column(Integer, primary_key=True, index=True)
    investigation_id = Column(Integer, ForeignKey("investigations.id", ondelete="CASCADE"), nullable=False)
    prediction_id = Column(Integer, ForeignKey("model_predictions.id", ondelete="CASCADE"), nullable=True)
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    is_prediction_correct = Column(Boolean, nullable=False)
    corrected_classes = Column(JSON, nullable=True)  # List of reviewer verified labels
    suitable_for_training = Column(Boolean, default=False)
    dataset_split = Column(String(20), default="unassigned")  # train, val, test, rejected
    reviewer_notes = Column(Text, nullable=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow)
    
    investigation = relationship("Investigation", back_populates="feedback")
    reviewer = relationship("User", back_populates="feedback_reviews")
