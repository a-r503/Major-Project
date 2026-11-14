import os
import uuid
from pathlib import Path
from typing import List, Optional
from fastapi import APIRouter, UploadFile, File, Form, HTTPException, status
from app.config import settings
from app.services.vision.model_registry import model_registry
from app.services.vision.food_detector import food_detector
from app.services.vision.package_verifier import package_verifier
from app.services.vision.spillage_detector import spillage_detector
from app.services.vision.foreign_object_detector import foreign_object_detector
from app.schemas.schemas import ModelStatusCard

router = APIRouter(prefix="/models", tags=["Computer Vision Models"])

@router.get("/status", response_model=List[ModelStatusCard])
def get_models_status():
    """
    Returns real-time health, loaded weights, architecture, latency, and supported classes
    for the four computer vision models.
    """
    return model_registry.get_all_models_status()

@router.post("/weights/upload")
async def upload_model_weights(
    model_id: str = Form(...),
    weights_file: UploadFile = File(...)
):
    """
    Allows uploading pre-trained or updated .pt weights for any of the 4 models.
    Dynamically persists to models/weights/ and reloads inference.
    """
    meta = model_registry.MODELS_METADATA.get(model_id)
    if not meta:
        raise HTTPException(
            status_code=400, 
            detail=f"Invalid model_id. Must be one of: {list(model_registry.MODELS_METADATA.keys())}"
        )

    target_filename = meta["weights_filename"]
    target_path = settings.WEIGHTS_DIR / target_filename
    
    content = await weights_file.read()
    with open(target_path, "wb") as f:
        f.write(content)

    # Hot-reload the corresponding detector
    if model_id == "model_1":
        food_detector._load_model()
    elif model_id == "model_2":
        package_verifier._load_model()
    elif model_id == "model_3":
        spillage_detector._load_model()
    elif model_id == "model_4":
        foreign_object_detector._load_model()

    return {
        "status": "success",
        "message": f"Successfully uploaded weights for {meta['name']}",
        "file_path": str(target_path),
        "file_size_mb": round(len(content) / (1024 * 1024), 2)
    }

@router.post("/food-detection")
async def run_food_detection(
    image: UploadFile = File(...),
    target_ingredient: Optional[str] = Form(None)
):
    filename = f"direct_food_{uuid.uuid4().hex[:10]}.jpg"
    dest = settings.UPLOAD_DIR / filename
    with open(dest, "wb") as f:
        f.write(await image.read())
    return food_detector.infer(str(dest), target_ingredient)

@router.post("/package-verification")
async def run_package_verification(
    restaurant_image: UploadFile = File(...),
    courier_image: UploadFile = File(...)
):
    f1 = settings.UPLOAD_DIR / f"direct_pkg_r_{uuid.uuid4().hex[:10]}.jpg"
    f2 = settings.UPLOAD_DIR / f"direct_pkg_c_{uuid.uuid4().hex[:10]}.jpg"
    with open(f1, "wb") as f:
        f.write(await restaurant_image.read())
    with open(f2, "wb") as f:
        f.write(await courier_image.read())
    return package_verifier.infer(str(f1), str(f2))

@router.post("/spillage-detection")
async def run_spillage_detection(image: UploadFile = File(...)):
    filename = f"direct_spill_{uuid.uuid4().hex[:10]}.jpg"
    dest = settings.UPLOAD_DIR / filename
    with open(dest, "wb") as f:
        f.write(await image.read())
    return spillage_detector.infer(str(dest))

@router.post("/foreign-object-detection")
async def run_foreign_object_detection(image: UploadFile = File(...)):
    filename = f"direct_foreign_{uuid.uuid4().hex[:10]}.jpg"
    dest = settings.UPLOAD_DIR / filename
    with open(dest, "wb") as f:
        f.write(await image.read())
    return foreign_object_detector.infer(str(dest))
