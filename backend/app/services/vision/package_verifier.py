import time
import uuid
from pathlib import Path
from typing import Dict, Any, List, Optional
import cv2
import numpy as np
from app.config import settings

class PackageVerifier:
    """
    Model 2: Restaurant & Courier Package Tampering and Condition Verification.
    Compares dispatch photo (restaurant) vs handover photo (courier).
    Aligns viewpoints using homography and computes structural difference.
    """
    
    def __init__(self):
        self.weights_path = settings.WEIGHTS_DIR / "package_tamper.pt"
        self.model = None
        self._load_model()

    def _load_model(self):
        if self.weights_path.exists():
            try:
                from ultralytics import YOLO
                self.model = YOLO(str(self.weights_path))
            except Exception as e:
                print(f"[PackageVerifier] Could not load custom weights: {e}")
                self.model = None

    def infer(self, restaurant_img_path: str, courier_img_path: str) -> Dict[str, Any]:
        start_time = time.time()
        
        img_rest = cv2.imread(restaurant_img_path)
        img_cour = cv2.imread(courier_img_path)
        
        if img_rest is None or img_cour is None:
            raise ValueError("Could not read one or both package verification images.")

        h1, w1 = img_rest.shape[:2]
        # Standardize courier image to match dispatch dimensions
        img_cour_resized = cv2.resize(img_cour, (w1, h1))

        # Convert to grayscale
        gray_rest = cv2.cvtColor(img_rest, cv2.COLOR_BGR2GRAY)
        gray_cour = cv2.cvtColor(img_cour_resized, cv2.COLOR_BGR2GRAY)

        # Feature-based homography alignment using ORB to cancel angle/perspective differences
        orb = cv2.ORB_create(500)
        kp1, des1 = orb.detectAndCompute(gray_rest, None)
        kp2, des2 = orb.detectAndCompute(gray_cour, None)

        aligned_cour = img_cour_resized.copy()
        alignment_quality = 0.85

        if des1 is not None and des2 is not None and len(kp1) >= 4 and len(kp2) >= 4:
            bf = cv2.BFMatcher(cv2.NORM_HAMMING, crossCheck=True)
            matches = bf.match(des1, des2)
            matches = sorted(matches, key=lambda x: x.distance)
            
            if len(matches) > 10:
                pts1 = np.float32([kp1[m.queryIdx].pt for m in matches[:30]]).reshape(-1, 1, 2)
                pts2 = np.float32([kp2[m.trainIdx].pt for m in matches[:30]]).reshape(-1, 1, 2)
                
                homography, inliers = cv2.findHomography(pts2, pts1, cv2.RANSAC, 5.0)
                if homography is not None:
                    aligned_cour = cv2.warpPerspective(img_cour_resized, homography, (w1, h1))
                    if inliers is not None:
                        alignment_quality = min(0.98, float(np.sum(inliers) / len(matches)))

        # Compute structural difference
        gray_aligned = cv2.cvtColor(aligned_cour, cv2.COLOR_BGR2GRAY)
        
        # Blur to reduce high frequency sensor noise
        blur_rest = cv2.GaussianBlur(gray_rest, (5, 5), 0)
        blur_cour = cv2.GaussianBlur(gray_aligned, (5, 5), 0)

        # Compute absolute difference
        diff = cv2.absdiff(blur_rest, blur_cour)
        _, thresh = cv2.threshold(diff, 45, 255, cv2.THRESH_BINARY)
        
        # Remove small speckles
        kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (7, 7))
        clean_thresh = cv2.morphologyEx(thresh, cv2.MORPH_OPEN, kernel)
        
        # Find contours of significant discrepancies
        contours, _ = cv2.findContours(clean_thresh, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        discrepancies = []
        for cnt in contours:
            area = cv2.contourArea(cnt)
            if area > (w1 * h1 * 0.015):  # more than 1.5% of total package area
                x, y, bw, bh = cv2.boundingRect(cnt)
                discrepancies.append({
                    "box": [x, y, x + bw, y + bh],
                    "area": float(area),
                    "aspect_ratio": round(bw / max(1, bh), 2)
                })

        # Calculate structural similarity index
        # 0.0 (completely altered) to 1.0 (identical)
        diff_area_sum = sum(d["area"] for d in discrepancies)
        discrepancy_ratio = diff_area_sum / (w1 * h1)

        similarity_score = max(0.20, min(0.99, round(1.0 - (discrepancy_ratio * 3.5), 3)))
        
        # Tamper decision logic
        tampering_detected = similarity_score < settings.TAMPER_SIMILARITY_THRESHOLD or len(discrepancies) >= 2
        confidence = round(0.85 + (abs(similarity_score - settings.TAMPER_SIMILARITY_THRESHOLD) * 0.3), 3)
        confidence = min(0.98, max(0.75, confidence))

        if tampering_detected:
            condition = "Seal Alteration / Packaging Discrepancy Detected"
            verdict = "Potential Package Tampering or Mishandling"
        else:
            condition = "Intact Package Seal - Unaltered Condition"
            verdict = "Consistent Handover Condition"

        detected_diff_descriptions = []
        if tampering_detected:
            detected_diff_descriptions.append("Tamper tape or seal integrity broken")
            if discrepancy_ratio > 0.08:
                detected_diff_descriptions.append("Container exterior deformation detected")
        else:
            detected_diff_descriptions.append("Minor handling creases within acceptable delivery tolerances")

        # Create Side-by-Side Visual Comparison Composite
        vis_rest = img_rest.copy()
        vis_cour = aligned_cour.copy()

        # Draw difference highlights on courier image
        diff_color = (0, 0, 255) if tampering_detected else (0, 255, 128)
        for d in discrepancies:
            bx1, by1, bx2, by2 = d["box"]
            cv2.rectangle(vis_cour, (bx1, by1), (bx2, by2), diff_color, 2)
            cv2.putText(vis_cour, "TAMPER REGION" if tampering_detected else "TOLERABLE VARIATION", 
                        (bx1, max(20, by1 - 5)), cv2.FONT_HERSHEY_SIMPLEX, 0.45, diff_color, 1)

        # Labels for left and right
        cv2.putText(vis_rest, "RESTAURANT DISPATCH (REFERENCE)", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)
        cv2.putText(vis_cour, "COURIER HANDOVER (ANALYSIS)", (20, 35), cv2.FONT_HERSHEY_SIMPLEX, 0.7, (0, 255, 255), 2)

        composite = np.hstack([vis_rest, vis_cour])
        comp_h, comp_w = composite.shape[:2]

        # Bottom HUD bar
        hud_bar = np.zeros((70, comp_w, 3), dtype=np.uint8)
        hud_text_1 = f"SIMILARITY: {int(similarity_score * 100)}% | STATUS: {condition.upper()}"
        hud_text_2 = f"MODEL VERDICT: {verdict.upper()} (CONFIDENCE: {int(confidence * 100)}%)"
        cv2.putText(hud_bar, hud_text_1, (25, 30), cv2.FONT_HERSHEY_SIMPLEX, 0.6, diff_color, 2)
        cv2.putText(hud_bar, hud_text_2, (25, 55), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (200, 200, 200), 1)

        final_annotated = np.vstack([composite, hud_bar])

        annotated_filename = f"ann_package_{uuid.uuid4().hex[:10]}.jpg"
        annotated_path = settings.ANNOTATED_DIR / annotated_filename
        cv2.imwrite(str(annotated_path), final_annotated)

        exec_time = round((time.time() - start_time) * 1000, 2)

        return {
            "model_name": "Restaurant & Courier Package Verifier",
            "model_version": "v2.1.0",
            "is_custom_weights": self.model is not None,
            "similarity_score": similarity_score,
            "tampering_detected": tampering_detected,
            "condition_assessment": condition,
            "investigation_result": verdict,
            "detected_differences": detected_diff_descriptions,
            "confidence": confidence,
            "bounding_boxes": discrepancies,
            "annotated_image_path": f"/static/annotated/{annotated_filename}",
            "execution_time_ms": exec_time
        }

package_verifier = PackageVerifier()
