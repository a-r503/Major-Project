from typing import Dict, Any, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from app.database import get_db
from app.models.db_models import Investigation, Order, User, Restaurant, DeliveryPartner
from app.schemas.schemas import DashboardStatsOut, InvestigationOut
from app.services.vision.model_registry import model_registry

from app.services.auth_service import get_current_user

router = APIRouter(prefix="/dashboard", tags=["Dashboard & Analytics"])

@router.get("/role-stats")
def get_role_dashboard_stats(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns statistics strictly tailored to the authenticated user's role.
    """
    if current_user.role == "customer":
        total_orders = db.query(Order).filter(Order.customer_id == current_user.id).count()
        customer_invs = db.query(Investigation).filter(Investigation.customer_id == current_user.id).all()
        active_disputes = sum(1 for i in customer_invs if i.status == "under_review")
        resolved_disputes = sum(1 for i in customer_invs if i.status == "resolved")
        verified_count = sum(1 for i in customer_invs if i.final_verdict == "Verified Issue")
        
        # Calculate refund credit
        verified_inv_ids = [i.id for i in customer_invs if i.final_verdict == "Verified Issue"]
        refund_orders = db.query(Order).join(Investigation, Investigation.order_id == Order.id).filter(Investigation.id.in_(verified_inv_ids)).all() if verified_inv_ids else []
        total_refunded = round(sum(o.total_amount for o in refund_orders), 2)

        recent_orders = db.query(Order).filter(Order.customer_id == current_user.id).order_by(Order.id.desc()).limit(5).all()
        recent_invs = db.query(Investigation).filter(Investigation.customer_id == current_user.id).order_by(Investigation.id.desc()).limit(5).all()

        return {
            "role": "customer",
            "user_name": current_user.full_name,
            "email": current_user.email,
            "total_orders": total_orders,
            "active_disputes": active_disputes,
            "resolved_disputes": resolved_disputes,
            "verified_claims": verified_count,
            "total_refunded": total_refunded,
            "recent_orders": [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "items": o.items_json,
                    "total_amount": o.total_amount,
                    "order_date": o.order_date.isoformat(),
                    "status": o.status
                } for o in recent_orders
            ],
            "recent_disputes": [
                {
                    "id": i.id,
                    "investigation_code": i.investigation_code,
                    "complaint_category": i.complaint_category,
                    "original_query": i.original_query,
                    "status": i.status,
                    "final_verdict": i.final_verdict,
                    "risk_score": i.risk_score,
                    "created_at": i.created_at.isoformat()
                } for i in recent_invs
            ]
        }

    elif current_user.role == "restaurant":
        rest_id = current_user.restaurant_id or 1
        rest = db.query(Restaurant).filter(Restaurant.id == rest_id).first()
        rest_name = rest.name if rest else "Bella Napoli Gourmet Pizza"
        compliance = rest.compliance_score if rest else 97.5

        total_orders = db.query(Order).filter(Order.restaurant_id == rest_id).count()
        rest_orders = db.query(Order).filter(Order.restaurant_id == rest_id).all()
        order_ids = [o.id for o in rest_orders]

        disputes = db.query(Investigation).filter(Investigation.order_id.in_(order_ids)).all() if order_ids else []
        missing_ing = sum(1 for d in disputes if "Missing" in d.complaint_category)
        pkg_issues = sum(1 for d in disputes if "Package" in d.complaint_category)
        spill_issues = sum(1 for d in disputes if "Spillage" in d.complaint_category)
        confirmed_rest = sum(1 for d in disputes if d.responsible_party == "Restaurant")

        recent_orders = db.query(Order).filter(Order.restaurant_id == rest_id).order_by(Order.id.desc()).limit(6).all()
        disputed_invs = db.query(Investigation).filter(Investigation.order_id.in_(order_ids)).order_by(Investigation.id.desc()).limit(6).all() if order_ids else []

        return {
            "role": "restaurant",
            "restaurant_id": rest_id,
            "restaurant_name": rest_name,
            "compliance_score": compliance,
            "total_orders_prepared": total_orders,
            "disputes_received": len(disputes),
            "missing_ingredient_claims": missing_ing,
            "packaging_claims": pkg_issues,
            "spillage_claims": spill_issues,
            "confirmed_faults": confirmed_rest,
            "recent_orders": [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "items": o.items_json,
                    "total_amount": o.total_amount,
                    "order_date": o.order_date.isoformat(),
                    "status": o.status,
                    "has_dispatch_photo": bool(o.restaurant_package_image),
                    "dispatch_photo_url": o.restaurant_package_image
                } for o in recent_orders
            ],
            "disputes": [
                {
                    "id": i.id,
                    "investigation_code": i.investigation_code,
                    "complaint_category": i.complaint_category,
                    "original_query": i.original_query,
                    "status": i.status,
                    "final_verdict": i.final_verdict,
                    "responsible_party": i.responsible_party,
                    "risk_score": i.risk_score,
                    "has_response": bool(i.restaurant_response),
                    "restaurant_response": i.restaurant_response,
                    "created_at": i.created_at.isoformat()
                } for i in disputed_invs
            ]
        }

    elif current_user.role == "delivery_partner":
        dp_id = current_user.delivery_partner_id or 1
        dp = db.query(DeliveryPartner).filter(DeliveryPartner.id == dp_id).first()
        courier_name = dp.name if dp else "SwiftRider Express"
        vehicle = dp.vehicle_type if dp else "Electric Scooter"
        completed = dp.deliveries_completed if dp else 1420

        courier_orders = db.query(Order).filter(Order.delivery_partner_id == dp_id).all()
        order_ids = [o.id for o in courier_orders]

        disputes = db.query(Investigation).filter(Investigation.order_id.in_(order_ids)).all() if order_ids else []
        tamper_claims = sum(1 for d in disputes if "Package" in d.complaint_category)
        spill_claims = sum(1 for d in disputes if "Spillage" in d.complaint_category)
        confirmed_courier = sum(1 for d in disputes if d.responsible_party == "Delivery Partner")
        transit_integrity = round(max(80.0, 100.0 - (confirmed_courier * 4.5)), 1)

        recent_deliveries = db.query(Order).filter(Order.delivery_partner_id == dp_id).order_by(Order.id.desc()).limit(6).all()
        transit_disputes = db.query(Investigation).filter(Investigation.order_id.in_(order_ids)).order_by(Investigation.id.desc()).limit(6).all() if order_ids else []

        return {
            "role": "delivery_partner",
            "delivery_partner_id": dp_id,
            "courier_name": courier_name,
            "vehicle_type": vehicle,
            "deliveries_completed": completed,
            "transit_integrity_score": transit_integrity,
            "tampering_allegations": tamper_claims,
            "spillage_allegations": spill_claims,
            "confirmed_mishandling": confirmed_courier,
            "recent_deliveries": [
                {
                    "id": o.id,
                    "order_number": o.order_number,
                    "items": o.items_json,
                    "status": o.status,
                    "order_date": o.order_date.isoformat(),
                    "has_handover_photo": bool(o.delivery_handover_image),
                    "handover_photo_url": o.delivery_handover_image
                } for o in recent_deliveries
            ],
            "transit_disputes": [
                {
                    "id": i.id,
                    "investigation_code": i.investigation_code,
                    "complaint_category": i.complaint_category,
                    "original_query": i.original_query,
                    "status": i.status,
                    "final_verdict": i.final_verdict,
                    "responsible_party": i.responsible_party,
                    "risk_score": i.risk_score,
                    "has_statement": bool(i.courier_statement),
                    "courier_statement": i.courier_statement,
                    "created_at": i.created_at.isoformat()
                } for i in transit_disputes
            ]
        }

    else:
        # Admin: Full system telemetry
        stats = get_dashboard_stats(db)
        return {
            "role": "admin",
            "user_name": current_user.full_name,
            "stats": stats
        }

@router.get("/stats", response_model=DashboardStatsOut)
def get_dashboard_stats(db: Session = Depends(get_db)):
    total_inv = db.query(Investigation).count()
    verified_claims = db.query(Investigation).filter(Investigation.final_verdict == "Verified Issue").count()
    claims_review = db.query(Investigation).filter(Investigation.final_verdict == "Requires Manual Investigation").count()
    suspicious = db.query(Investigation).filter(Investigation.final_verdict == "Confirmed Fraud").count()
    
    # Average risk score
    avg_score_res = db.query(func.avg(Investigation.risk_score)).scalar()
    avg_risk_score = round(float(avg_score_res), 1) if avg_score_res is not None else 45.0

    # Model usage counts
    usage_records = db.query(
        Investigation.selected_model, func.count(Investigation.id)
    ).group_by(Investigation.selected_model).all()
    
    model_usage = {
        "Model 1 (Food Detection)": 0,
        "Model 2 (Package Verification)": 0,
        "Model 3 (Spillage Detection)": 0,
        "Model 4 (Foreign Object)": 0,
        "Unsupported / Other": 0
    }
    for model_name, cnt in usage_records:
        if "Food Ingredient" in (model_name or ""):
            model_usage["Model 1 (Food Detection)"] += cnt
        elif "Package" in (model_name or ""):
            model_usage["Model 2 (Package Verification)"] += cnt
        elif "Spillage" in (model_name or ""):
            model_usage["Model 3 (Spillage Detection)"] += cnt
        elif "Foreign" in (model_name or ""):
            model_usage["Model 4 (Foreign Object)"] += cnt
        else:
            model_usage["Unsupported / Other"] += cnt

    # Recent 6 investigations
    recent = db.query(Investigation).order_by(Investigation.id.desc()).limit(6).all()

    return DashboardStatsOut(
        total_investigations=total_inv,
        verified_claims=verified_claims,
        claims_requiring_review=claims_review,
        potential_suspicious_activity=suspicious,
        avg_risk_score=avg_risk_score,
        model_usage=model_usage,
        models_status=model_registry.get_all_models_status(),
        recent_investigations=[InvestigationOut.from_orm(r) for r in recent]
    )

@router.get("/party-profile")
def get_party_profile(
    party_type: str = Query(..., pattern="^(customer|restaurant|delivery_partner)$"),
    party_id: int = Query(...),
    db: Session = Depends(get_db)
):
    """
    Returns individual lifecycle history profiles for Customer, Restaurant, or Delivery Partner.
    Computed directly from actual database records.
    """
    if party_type == "customer":
        user = db.query(User).filter(User.id == party_id).first()
        if not user:
            raise HTTPException(status_code=404, detail="Customer not found")
        
        total_orders = db.query(Order).filter(Order.customer_id == user.id).count()
        total_complaints = db.query(Investigation).filter(Investigation.customer_id == user.id).count()
        legit = db.query(Investigation).filter(
            Investigation.customer_id == user.id,
            Investigation.final_verdict.in_(["Verified Issue", "Legitimate"])
        ).count()
        fraud = db.query(Investigation).filter(
            Investigation.customer_id == user.id,
            Investigation.final_verdict == "Confirmed Fraud"
        ).count()
        pending = db.query(Investigation).filter(
            Investigation.customer_id == user.id,
            Investigation.status == "under_review"
        ).count()
        avg_risk = db.query(func.avg(Investigation.risk_score)).filter(Investigation.customer_id == user.id).scalar()

        return {
            "type": "customer",
            "id": user.id,
            "name": user.full_name,
            "email": user.email,
            "total_orders": total_orders,
            "total_complaints": total_complaints,
            "legitimate_complaints": legit,
            "confirmed_fraud_complaints": fraud,
            "pending_investigations": pending,
            "avg_investigation_risk": round(float(avg_risk), 1) if avg_risk else 35.0,
            "reliability_rating": "Good Standing" if fraud == 0 else "Flagged for Audit"
        }

    elif party_type == "restaurant":
        rest = db.query(Restaurant).filter(Restaurant.id == party_id).first()
        if not rest:
            raise HTTPException(status_code=404, detail="Restaurant not found")

        total_orders = db.query(Order).filter(Order.restaurant_id == rest.id).count()
        order_ids = [o.id for o in db.query(Order.id).filter(Order.restaurant_id == rest.id).all()]
        
        complaints = db.query(Investigation).filter(Investigation.order_id.in_(order_ids)).all() if order_ids else []
        missing_ing = sum(1 for c in complaints if "Missing" in c.complaint_category)
        pkg_issues = sum(1 for c in complaints if "Package" in c.complaint_category)
        spill_issues = sum(1 for c in complaints if "Spillage" in c.complaint_category)
        confirmed_rest = sum(1 for c in complaints if c.responsible_party == "Restaurant")

        return {
            "type": "restaurant",
            "id": rest.id,
            "name": rest.name,
            "rating": rest.rating,
            "compliance_score": rest.compliance_score,
            "total_orders": total_orders,
            "total_complaints_received": len(complaints),
            "missing_ingredient_incidents": missing_ing,
            "packaging_incidents": pkg_issues,
            "spillage_incidents": spill_issues,
            "confirmed_fault_incidents": confirmed_rest,
            "hygiene_tier": "Tier 1 Verified Kitchen" if rest.compliance_score > 90 else "Review Candidate"
        }

    elif party_type == "delivery_partner":
        courier = db.query(DeliveryPartner).filter(DeliveryPartner.id == party_id).first()
        if not courier:
            raise HTTPException(status_code=404, detail="Delivery Partner not found")

        order_ids = [o.id for o in db.query(Order.id).filter(Order.delivery_partner_id == courier.id).all()]
        complaints = db.query(Investigation).filter(Investigation.order_id.in_(order_ids)).all() if order_ids else []
        pkg_issues = sum(1 for c in complaints if "Package" in c.complaint_category)
        spill_issues = sum(1 for c in complaints if "Spillage" in c.complaint_category)
        confirmed_courier = sum(1 for c in complaints if c.responsible_party == "Delivery Partner")

        return {
            "type": "delivery_partner",
            "id": courier.id,
            "name": courier.name,
            "vehicle_type": courier.vehicle_type,
            "rating": courier.rating,
            "deliveries_completed": courier.deliveries_completed,
            "packaging_condition_incidents": pkg_issues,
            "spillage_incidents": spill_issues,
            "confirmed_mishandling_incidents": confirmed_courier,
            "transit_integrity_score": f"{round(max(70.0, 100.0 - (confirmed_courier * 5.0)), 1)}%"
        }
