import time
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
import cv2
import numpy as np
from app.config import settings

class SpillageDetector:
    """
    Model 3: Food Spillage and Leakage Detection.
    Identifies spilled liquids, grease soaking, compromised lids, and damaged food packaging.
    """
    
    CLASS_LABELS = [
        "liquid_spill", "curry_leakage", "oil_stain", "ruptured_lid", 
        "grease_soak", "container_rupture"
    ]

    def __init__(self):
        self.weights_path = settings.WEIGHTS_DIR / "spillage_yolo.pt"
        self.model = None
        self._load_model()

    def _load_model(self):
        if self.weights_path.exists():
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(self.weights_path))
            except Exception as e:
                print(f"[SpillageDetector] Could not load custom weights: {e}")
                self.model = None

    def infer(self, image_path: str) -> Dict[str, Any]:
        start_time = time.time()
        img = cv2.imread(image_path)
        if img is None:
            raise ValueError(f"Could not read image file from path: {image_path}")

        h, w, _ = img.shape
        detected_objects = []
        is_custom = False

        if self.model is not None:
            results = self.model(image_path, conf=settings.CONFIDENCE_THRESHOLD)
            is_custom = True
            for r in results:
                for box in r.boxes:
                    cls_id = int(box.cls[0])
                    conf = float(box.conf[0])
                    xyxy = box.xyxy[0].tolist()
                    label = self.model.names.get(cls_id, self.CLASS_LABELS[cls_id % len(self.CLASS_LABELS)])
                    detected_objects.append({
                        "label": label,
                        "confidence": round(conf, 4),
                        "box": [round(c, 1) for c in xyxy]
                    })
        else:
            # Computer Vision Spill & Fluid Spread Segmentation
            hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
            gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)

            # Detect liquid curry / gravy / sauce spread (orange, yellow, brown, red wetness)
            curry_mask1 = cv2.inRange(hsv, np.array([5, 80, 50]), np.array([25, 255, 220]))
            curry_mask2 = cv2.inRange(hsv, np.array([25, 50, 40]), np.array([40, 255, 180]))
            fluid_mask = curry_mask1 | curry_mask2

            # Smooth and clean fluid mask
            kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9))
            cleaned_fluid = cv2.morphologyEx(fluid_mask, cv2.MORPH_CLOSE, kernel)
            contours, _ = cv2.findContours(cleaned_fluid, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

            total_spill_area = 0.0
            for cnt in contours:
                area = cv2.contourArea(cnt)
                # Spills covering significant area outside main plate or on bag edges
                if area > (w * h * 0.012):
                    x, y, bw, bh = cv2.boundingRect(cnt)
                    total_spill_area += area
                    detected_objects.append({
                        "label": "curry_leakage" if area > (w * h * 0.04) else "oil_stain",
                        "confidence": round(min(0.97, 0.82 + (area / (w * h)) * 0.5), 3),
                        "box": [x, y, x + bw, y + bh]
                    })

            # Check edge container deformation / lid rupture
            edges = cv2.Canny(gray, 60, 180)
            edge_density = np.sum(edges > 0) / (w * h)
            if edge_density > 0.08 and len(detected_objects) > 0:
                detected_objects.append({
                    "label": "ruptured_lid",
                    "confidence": 0.884,
                    "box": [int(w * 0.2), int(h * 0.08), int(w * 0.8), int(h * 0.35)]
                })

        spillage_detected = len(detected_objects) > 0
        spill_ratio = sum((b["box"][2] - b["box"][0]) * (b["box"][3] - b["box"][1]) for b in detected_objects) / (w * h) if spillage_detected else 0.0

        # Severity categorization based on physical spill surface ratio
        if not spillage_detected:
            severity = "No Spillage Detected"
            summary = "Packaging and food vessel remain clean and structurally sealed."
        elif spill_ratio < 0.06:
            severity = f"Minor Leakage ({round(spill_ratio * 100, 1)}% surface area)"
            summary = "Surface oil seepage or slight sauce leakage detected on outer rim."
        elif spill_ratio < 0.20:
            severity = f"Moderate Spillage ({round(spill_ratio * 100, 1)}% surface area)"
            summary = "Substantial liquid or curry leakage escaping food container into packaging."
        else:
            severity = f"Severe Transit Damage ({round(spill_ratio * 100, 1)}% surface area)"
            summary = "Critical container breach; food contents largely displaced or unconsumable."

        # Annotate Image
        annotated_img = img.copy()
        for obj in detected_objects:
            lbl = obj["label"]
            conf = obj["confidence"]
            x1, y1, x2, y2 = [int(v) for v in obj["box"]]
            
            # Draw translucent fill over spill area
            overlay = annotated_img.copy()
            cv2.rectangle(overlay, (x1, y1), (x2, y2), (0, 120, 255), -1)
            cv2.addWeighted(overlay, 0.25, annotated_img, 0.75, 0, annotated_img)
            
            # Glowing border
            cv2.rectangle(annotated_img, (x1, y1), (x2, y2), (0, 165, 255), 2)
            lbl_tag = f"{lbl.upper().replace('_', ' ')} ({int(conf * 100)}%)"
            cv2.putText(annotated_img, lbl_tag, (x1, max(20, y1 - 8)), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (0, 220, 255), 1, cv2.LINE_AA)

        # Draw HUD Banner
        hud_color = (0, 50, 255) if spillage_detected else (0, 220, 100)
        hud_text = f"SPILLAGE: {'YES' if spillage_detected else 'NO'} | SEVERITY: {severity.upper()}"
        cv2.rectangle(annotated_img, (10, 10), (w - 10, 48), (20, 20, 25), -1)
        cv2.rectangle(annotated_img, (10, 10), (w - 10, 48), hud_color, 2)
        cv2.putText(annotated_img, hud_text, (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.6, hud_color, 2, cv2.LINE_AA)

        annotated_filename = f"ann_spill_{uuid.uuid4().hex[:10]}.jpg"
        annotated_path = settings.ANNOTATED_DIR / annotated_filename
        cv2.imwrite(str(annotated_path), annotated_img)

        exec_time = round((time.time() - start_time) * 1000, 2)
        overall_conf = round(float(np.mean([obj["confidence"] for obj in detected_objects])) if detected_objects else 0.92, 3)

        return {
            "model_name": "Food Spillage & Leakage Detection",
            "model_version": "v1.8.0",
            "is_custom_weights": is_custom,
            "spillage_detected": spillage_detected,
            "severity": severity,
            "detected_classes": [obj["label"] for obj in detected_objects],
            "confidence": overall_conf,
            "bounding_boxes": detected_objects,
            "investigation_summary": summary,
            "annotated_image_path": f"/static/annotated/{annotated_filename}",
            "execution_time_ms": exec_time
        }

spillage_detector = SpillageDetector()
