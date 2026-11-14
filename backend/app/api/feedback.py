from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import FeedbackRecord, Investigation, ModelPrediction, User
from app.schemas.schemas import FeedbackCreate, FeedbackOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/feedback", tags=["Model Training & Feedback Pipeline"])

@router.post("", response_model=FeedbackOut)
def submit_annotation_feedback(
    investigation_id: int,
    feedback_in: FeedbackCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Submits expert reviewer verification on model prediction.
    Maintains a curated, human-verified dataset separate from raw customer uploads.
    """
    inv = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    if not inv:
        raise HTTPException(status_code=404, detail="Investigation record not found")

    feedback = FeedbackRecord(
        investigation_id=investigation_id,
        prediction_id=feedback_in.prediction_id,
        reviewer_id=current_user.id,
        is_prediction_correct=feedback_in.is_prediction_correct,
        corrected_classes=feedback_in.corrected_classes or [],
        suitable_for_training=feedback_in.suitable_for_training,
        dataset_split=feedback_in.dataset_split,
        reviewer_notes=feedback_in.reviewer_notes,
        created_at=datetime.datetime.utcnow()
    )
    db.add(feedback)
    db.commit()
    db.refresh(feedback)
    return FeedbackOut.from_orm(feedback)

@router.get("/export")
def export_curated_training_dataset(
    split: Optional[str] = Query(None, description="train, val, or test"),
    db: Session = Depends(get_db)
):
    """
    Exports human-reviewed, approved samples formatted for future YOLO / PyTorch model retraining.
    Only includes verified records explicitly marked as suitable_for_training.
    """
    q = db.query(FeedbackRecord).filter(FeedbackRecord.suitable_for_training == True)
    if split:
        q = q.filter(FeedbackRecord.dataset_split == split)
    
    feedbacks = q.all()
    dataset_records = []
    for f in feedbacks:
        inv = f.investigation
        pred = f.investigation.predictions[0] if f.investigation.predictions else None
        dataset_records.append({
            "feedback_id": f.id,
            "investigation_code": inv.investigation_code,
            "complaint_category": inv.complaint_category,
            "model_name": inv.selected_model,
            "dataset_split": f.dataset_split,
            "image_path": pred.input_image_path if pred else None,
            "original_predictions": pred.detected_classes if pred else [],
            "verified_labels": f.corrected_classes,
            "reviewer_notes": f.reviewer_notes,
            "timestamp": f.created_at.isoformat()
        })

    return {
        "dataset_name": "FoodGuard-Curated-Retraining-Corpus",
        "version": "2.4.0",
        "exported_at": datetime.datetime.utcnow().isoformat(),
        "total_approved_samples": len(dataset_records),
        "split_filter": split or "all",
        "samples": dataset_records
    }
