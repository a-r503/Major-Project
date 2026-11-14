import os
import uuid
import datetime
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form, Query
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.db_models import (
    Investigation, Order, User, UploadedEvidence, 
    ModelPrediction, RiskAssessment, InvestigationReport,
    Restaurant, DeliveryPartner
)
from app.schemas.schemas import (
    InvestigationOut, InvestigationDetailOut, InvestigationVerdictUpdate
)
from app.services.nlp.complaint_parser import classify_complaint_text, extract_target_ingredient
from app.services.vision.food_detector import food_detector
from app.services.vision.package_verifier import package_verifier
from app.services.vision.spillage_detector import spillage_detector
from app.services.vision.foreign_object_detector import foreign_object_detector
from app.services.risk_engine import risk_engine
from app.services.explanation_engine import explanation_engine
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/investigations", tags=["Dispute Investigations"])

@router.post("", response_model=InvestigationDetailOut)
async def submit_investigation(
    order_number: str = Form(...),
    complaint_description: str = Form(...),
    complaint_category: Optional[str] = Form(None),
    target_ingredient: Optional[str] = Form(None),
    evidence_image_1: UploadFile = File(...),
    evidence_image_2: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits a new customer complaint, dynamically parses the complaint text,
    routes to the appropriate computer vision model, executes inference,
    computes evidence-based risk score, generates AI explanation, and saves the complete traceable lifecycle.
    """
    # 1. Validate Order in Database
    clean_order_num = order_number.strip().upper()
    order = db.query(Order).filter(Order.order_number == clean_order_num).first()
    if not order:
        # Check case-insensitive match
        order = db.query(Order).filter(Order.order_number.ilike(f"%{clean_order_num}%")).first()
        
    if order:
        # Enforce role-based order access: users cannot file complaints on other users' orders
        if current_user.role == "customer" and order.customer_id != current_user.id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN, 
                detail="Access Denied: You cannot file complaints on orders belonging to other customers."
            )
        elif current_user.role == "restaurant" and order.restaurant_id != (current_user.restaurant_id or 1):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Order does not belong to your restaurant kitchen."
            )
        elif current_user.role == "delivery_partner" and order.delivery_partner_id != (current_user.delivery_partner_id or 1):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Access Denied: Order is not assigned to your courier account."
            )
    else:
        # If order doesn't exist, create a dynamic order record scoped to caller's role
        restaurant = db.query(Restaurant).first()
        rest_id = (current_user.restaurant_id or restaurant.id) if current_user.role == "restaurant" else (restaurant.id if restaurant else 1)
        dp_id = current_user.delivery_partner_id if current_user.role == "delivery_partner" else None
        
        order = Order(
            order_number=clean_order_num,
            customer_id=current_user.id,
            restaurant_id=rest_id,
            delivery_partner_id=dp_id,
            items_json=[{"item": "Custom Order Item", "quantity": 1, "ingredients": ["cheese", "crust"], "price": 18.50}],
            total_amount=18.50,
            status="delivered",
            order_date=datetime.datetime.utcnow() - datetime.timedelta(hours=2)
        )
        db.add(order)
        db.commit()
        db.refresh(order)

    # 2. Dynamic NLP Complaint Classification & Target Extraction
    cat, extracted_target, selected_model = classify_complaint_text(
        complaint_description, 
        complaint_category
    )
    final_target = target_ingredient.strip() if target_ingredient else extracted_target

    # 3. Save Uploaded Evidence Files
    ext1 = Path(evidence_image_1.filename).suffix or ".jpg"
    filename1 = f"evid_1_{uuid.uuid4().hex[:10]}{ext1}"
    file_path1 = settings.UPLOAD_DIR / filename1
    with open(file_path1, "wb") as f:
        content1 = await evidence_image_1.read()
        f.write(content1)

    file_path2 = None
    if evidence_image_2:
        ext2 = Path(evidence_image_2.filename).suffix or ".jpg"
        filename2 = f"evid_2_{uuid.uuid4().hex[:10]}{ext2}"
        file_path2 = settings.UPLOAD_DIR / filename2
        with open(file_path2, "wb") as f:
            content2 = await evidence_image_2.read()
            f.write(content2)

    # 4. Route to Designated AI Computer Vision Model
    prediction_result = {}
    
    if cat == "Missing Food Item / Ingredient":
        prediction_result = food_detector.infer(str(file_path1), final_target)
        model_name = "Model 1: YOLO Food Ingredient & Item Detection"

    elif cat == "Package Tampering / Condition Change":
        # Requires two images: restaurant dispatch & courier handover
        img2_path = str(file_path2) if file_path2 else str(file_path1)
        # If courier image was not provided, use order dispatch image or duplicate
        if not file_path2 and order.restaurant_package_image:
            order_disp = settings.BASE_DIR / order.restaurant_package_image.lstrip("/")
            if order_disp.exists():
                img2_path = str(order_disp)

        prediction_result = package_verifier.infer(str(file_path1), img2_path)
        model_name = "Model 2: Restaurant & Courier Package Verifier"

    elif cat == "Food Spillage / Leakage":
        prediction_result = spillage_detector.infer(str(file_path1))
        model_name = "Model 3: Food Spillage & Leakage Detection"

    elif cat == "Foreign Object in Food":
        prediction_result = foreign_object_detector.infer(str(file_path1))
        model_name = "Model 4: Foreign Object Detection"

    else:
        # Non-visual / Unsupported complaints
        model_name = "None"
        prediction_result = {
            "model_name": "None",
            "model_version": "N/A",
            "is_custom_weights": False,
            "detected_classes": [],
            "confidence": 0.0,
            "bounding_boxes": [],
            "annotated_image_path": f"/static/uploads/{filename1}",
            "execution_time_ms": 0.0
        }

    # 5. Customer & Restaurant Historical Context Retrieval
    customer_history = {
        "total_orders": db.query(Order).filter(Order.customer_id == current_user.id).count(),
        "dispute_count": db.query(Investigation).filter(Investigation.customer_id == current_user.id).count(),
        "confirmed_fraud_count": db.query(Investigation).filter(
            Investigation.customer_id == current_user.id,
            Investigation.final_verdict == "Confirmed Fraud"
        ).count()
    }
    
    rest_history = {
        "compliance_score": 96.0
    }
    if order.restaurant:
        rest_history["compliance_score"] = order.restaurant.compliance_score

    # 6. Execute Evidence-based Decision & Risk Scoring Engine
    risk_evaluation = risk_engine.evaluate(
        complaint_category=cat,
        model_prediction=prediction_result,
        target_ingredient=final_target,
        customer_history=customer_history,
        restaurant_history=rest_history,
        has_two_photos=file_path2 is not None
    )

    # 7. Generate AI Explanation
    order_meta = {
        "order_number": order.order_number,
        "restaurant_name": order.restaurant.name if order.restaurant else "Partner Restaurant",
        "items": order.items_json
    }
    explanation_res = await explanation_engine.generate_explanation(
        complaint_category=cat,
        query=complaint_description,
        target_ingredient=final_target,
        prediction=prediction_result,
        risk_data=risk_evaluation,
        order_meta=order_meta
    )

    # 8. Create Centralized Investigation Entity
    inv_code = f"INV-2026-{uuid.uuid4().hex[:4].upper()}"
    investigation = Investigation(
        investigation_code=inv_code,
        customer_id=current_user.id,
        order_id=order.id,
        complaint_category=cat,
        original_query=complaint_description,
        target_ingredient=final_target,
        selected_model=model_name,
        status="under_review" if risk_evaluation["outcome"] == "Requires Manual Investigation" else "resolved",
        final_verdict=risk_evaluation["outcome"],
        responsible_party=risk_evaluation["responsible_party"],
        risk_score=risk_evaluation["risk_score"],
        created_at=datetime.datetime.utcnow(),
        resolved_at=datetime.datetime.utcnow() if risk_evaluation["outcome"] != "Requires Manual Investigation" else None,
        resolution_notes=f"Auto-analyzed via {model_name}. System outcome: {risk_evaluation['outcome']}."
    )
    db.add(investigation)
    db.flush()

    # 9. Save Evidence Records
    evid1 = UploadedEvidence(
        investigation_id=investigation.id,
        evidence_type="customer_primary_photo",
        file_path=f"/static/uploads/{filename1}",
        annotated_path=prediction_result.get("annotated_image_path"),
        uploaded_by=current_user.role,
        file_size_bytes=len(content1)
    )
    db.add(evid1)

    if file_path2:
        evid2 = UploadedEvidence(
            investigation_id=investigation.id,
            evidence_type="courier_comparison_photo",
            file_path=f"/static/uploads/{filename2}",
            annotated_path=prediction_result.get("annotated_image_path"),
            uploaded_by="delivery_partner",
            file_size_bytes=len(content2)
        )
        db.add(evid2)

    # 10. Save Immutable Model Prediction Record
    pred_record = ModelPrediction(
        investigation_id=investigation.id,
        model_name=model_name,
        model_version=prediction_result.get("model_version", "1.0.0"),
        is_custom_weights=prediction_result.get("is_custom_weights", False),
        input_image_path=f"/static/uploads/{filename1}",
        annotated_image_path=prediction_result.get("annotated_image_path"),
        detected_classes=prediction_result.get("detected_classes", []),
        confidence=float(prediction_result.get("confidence", 0.0)),
        bounding_boxes=prediction_result.get("bounding_boxes", []),
        raw_output=prediction_result,
        target_verified=prediction_result.get("target_verified"),
        execution_time_ms=float(prediction_result.get("execution_time_ms", 0.0)),
        created_at=datetime.datetime.utcnow()
    )
    db.add(pred_record)

    # 11. Save Risk Assessment Record
    risk_record = RiskAssessment(
        investigation_id=investigation.id,
        risk_score=risk_evaluation["risk_score"],
        priority_level=risk_evaluation["priority_level"],
        outcome=risk_evaluation["outcome"],
        model_confidence_factor=risk_evaluation["model_confidence_factor"],
        evidence_discrepancy_factor=risk_evaluation["evidence_discrepancy_factor"],
        customer_history_factor=risk_evaluation["customer_history_factor"],
        restaurant_history_factor=risk_evaluation["restaurant_history_factor"],
        factors_breakdown=risk_evaluation["factors_breakdown"],
        created_at=datetime.datetime.utcnow()
    )
    db.add(risk_record)

    # 12. Save Investigation Report Record
    report_record = InvestigationReport(
        investigation_id=investigation.id,
        summary_text=explanation_res["summary_text"],
        ai_explanation=explanation_res["ai_explanation"],
        uncertainty_notes=explanation_res.get("uncertainty_notes"),
        recommended_action=explanation_res["recommended_action"],
        generated_by_llm=explanation_res.get("generated_by_llm", False),
        created_at=datetime.datetime.utcnow()
    )
    db.add(report_record)

    db.commit()
    db.refresh(investigation)

    return InvestigationDetailOut.from_orm(investigation)


@router.get("", response_model=List[InvestigationOut])
def list_investigations(
    status: Optional[str] = Query(None),
    verdict: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    customer_id: Optional[int] = Query(None),
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns dispute investigations strictly filtered by caller role:
    - Customer: only their own submitted investigations
    - Restaurant: only investigations for their kitchen orders
    - Delivery Partner: only investigations for deliveries assigned to them
    - Admin: all investigations
    """
    q = db.query(Investigation)

    if current_user.role == "customer":
        q = q.filter(Investigation.customer_id == current_user.id)
    elif current_user.role == "restaurant":
        rest_id = current_user.restaurant_id or 1
        q = q.join(Order, Investigation.order_id == Order.id).filter(Order.restaurant_id == rest_id)
    elif current_user.role == "delivery_partner":
        dp_id = current_user.delivery_partner_id or 1
        q = q.join(Order, Investigation.order_id == Order.id).filter(Order.delivery_partner_id == dp_id)
    elif current_user.role == "admin":
        if customer_id:
            q = q.filter(Investigation.customer_id == customer_id)

    if status:
        q = q.filter(Investigation.status == status)
    if verdict:
        q = q.filter(Investigation.final_verdict == verdict)
    if category:
        q = q.filter(Investigation.complaint_category.ilike(f"%{category}%"))

    records = q.order_by(Investigation.id.desc()).limit(limit).all()
    return [InvestigationOut.from_orm(r) for r in records]


@router.get("/{id}", response_model=InvestigationDetailOut)
def get_investigation_detail(
    id: int, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    record = db.query(Investigation).filter(Investigation.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Investigation record not found.")

    # Role permission check
    if current_user.role == "customer" and record.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You can only view your own investigations.")
    elif current_user.role == "restaurant" and record.order.restaurant_id != (current_user.restaurant_id or 1):
        raise HTTPException(status_code=403, detail="Access denied: Investigation relates to another restaurant.")
    elif current_user.role == "delivery_partner" and record.order.delivery_partner_id != (current_user.delivery_partner_id or 1):
        raise HTTPException(status_code=403, detail="Access denied: Investigation relates to another delivery courier.")

    return InvestigationDetailOut.from_orm(record)


@router.patch("/{id}/verdict", response_model=InvestigationDetailOut)
def update_investigation_verdict(
    id: int, 
    update_data: InvestigationVerdictUpdate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Only Admin has adjudication authority
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Permission denied: Only administrators can adjudicate dispute verdicts."
        )

    record = db.query(Investigation).filter(Investigation.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    record.final_verdict = update_data.final_verdict
    record.responsible_party = update_data.responsible_party
    record.status = update_data.status
    record.resolution_notes = update_data.resolution_notes or f"Reviewed and closed by {current_user.full_name} ({current_user.role})"
    record.resolved_at = datetime.datetime.utcnow()
    db.commit()
    db.refresh(record)
    return InvestigationDetailOut.from_orm(record)


@router.post("/{id}/restaurant-response", response_model=InvestigationDetailOut)
def submit_restaurant_response(
    id: int,
    response_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows Restaurant Partner to submit their kitchen explanation or counter-evidence.
    """
    if current_user.role not in ["restaurant", "admin"]:
        raise HTTPException(status_code=403, detail="Only restaurants can submit kitchen responses.")

    record = db.query(Investigation).filter(Investigation.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    resp_text = response_data.get("restaurant_response", "").strip()
    if not resp_text:
        raise HTTPException(status_code=400, detail="Response text cannot be empty.")

    record.restaurant_response = resp_text
    record.restaurant_response_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(record)
    return InvestigationDetailOut.from_orm(record)


@router.post("/{id}/courier-statement", response_model=InvestigationDetailOut)
def submit_courier_statement(
    id: int,
    statement_data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Allows Delivery Partner to submit their transit condition statement.
    """
    if current_user.role not in ["delivery_partner", "admin"]:
        raise HTTPException(status_code=403, detail="Only delivery couriers can submit transit statements.")

    record = db.query(Investigation).filter(Investigation.id == id).first()
    if not record:
        raise HTTPException(status_code=404, detail="Investigation not found.")

    stmt_text = statement_data.get("courier_statement", "").strip()
    if not stmt_text:
        raise HTTPException(status_code=400, detail="Statement text cannot be empty.")

    record.courier_statement = stmt_text
    record.courier_statement_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(record)
    return InvestigationDetailOut.from_orm(record)
