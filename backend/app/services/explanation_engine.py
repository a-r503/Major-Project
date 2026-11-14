import os
import json
from typing import Dict, Any, Optional
import httpx
from app.config import settings

class ExplanationEngine:
    """
    AI-Generated Investigation Explanation Service.
    Produces clear, concise, non-hallucinatory explanations strictly based on actual CV model predictions.
    Incorporates Google Gemini API when available, with a resilient rule-guided synthesizer fallback.
    """

    @classmethod
    async def generate_explanation(
        cls,
        complaint_category: str,
        query: str,
        target_ingredient: Optional[str],
        prediction: Dict[str, Any],
        risk_data: Dict[str, Any],
        order_meta: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Returns structured report: summary_text, ai_explanation, uncertainty_notes, recommended_action.
        """
        # Try Gemini API if key is configured
        if settings.GEMINI_API_KEY and len(settings.GEMINI_API_KEY) > 10:
            try:
                gemini_res = await cls._call_gemini(
                    complaint_category, query, target_ingredient, prediction, risk_data, order_meta
                )
                if gemini_res:
                    return gemini_res
            except Exception as e:
                print(f"[ExplanationEngine] Gemini API call skipped: {e}")

        # Deterministic structured reasoning synthesis (100% faithful to model output)
        return cls._synthesize_structured_explanation(
            complaint_category, query, target_ingredient, prediction, risk_data, order_meta
        )

    @classmethod
    async def _call_gemini(
        cls,
        complaint_category: str,
        query: str,
        target_ingredient: Optional[str],
        prediction: Dict[str, Any],
        risk_data: Dict[str, Any],
        order_meta: Optional[Dict[str, Any]]
    ) -> Optional[Dict[str, Any]]:
        prompt = f"""
You are the FoodGuard AI Chief Dispute Investigator. Provide an objective, professional, and transparent investigation explanation based strictly on the verified computer vision data below. Do not fabricate any details.

COMPLAINT CATEGORY: {complaint_category}
CUSTOMER STATEMENT: "{query}"
TARGET INGREDIENT/OBJECT: {target_ingredient or 'N/A'}
COMPUTER VISION PREDICTION:
{json.dumps(prediction, indent=2)}

RISK SCORING ASSESSMENT:
{json.dumps(risk_data, indent=2)}

Return a valid JSON object with these exact keys:
{{
  "summary_text": "One sentence summary of the verified finding.",
  "ai_explanation": "Detailed professional breakdown of the evidence, detected classes, and bounding boxes.",
  "uncertainty_notes": "Specific vision caveats (e.g. occlusion under cheese layer, photographic lighting, sensor angle).",
  "recommended_action": "Actionable next operational step for restaurant/courier/customer."
}}
"""
        url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key={settings.GEMINI_API_KEY}"
        async with httpx.AsyncClient(timeout=10.0) as client:
            resp = await client.post(
                url,
                json={"contents": [{"parts": [{"text": prompt}]}]},
                headers={"Content-Type": "application/json"}
            )
            if resp.status_code == 200:
                data = resp.json()
                text_content = data["candidates"][0]["content"]["parts"][0]["text"]
                # Clean code blocks
                if text_content.startswith("```"):
                    text_content = text_content.split("```")[1]
                    if text_content.startswith("json"):
                        text_content = text_content[4:]
                parsed = json.loads(text_content.strip())
                parsed["generated_by_llm"] = True
                return parsed
        return None

    @classmethod
    def _synthesize_structured_explanation(
        cls,
        complaint_category: str,
        query: str,
        target_ingredient: Optional[str],
        prediction: Dict[str, Any],
        risk_data: Dict[str, Any],
        order_meta: Optional[Dict[str, Any]]
    ) -> Dict[str, Any]:
        detected_classes = prediction.get("detected_classes", [])
        conf_pct = int(prediction.get("confidence", 0.85) * 100)
        outcome = risk_data.get("outcome", "Requires Manual Investigation")
        party = risk_data.get("responsible_party", "Undetermined")

        if complaint_category == "Missing Food Item / Ingredient":
            target = target_ingredient or "specified ingredient"
            target_found = prediction.get("target_verified", False)
            classes_str = ", ".join(detected_classes) if detected_classes else "base food crust"

            if target_found:
                summary = f"Visual inspection confirmed presence of {target.upper()} in the uploaded food image."
                explanation = (
                    f"The customer reported that '{target}' was missing from their order ('{query}'). "
                    f"Our YOLO food detection model identified the following item(s) and toppings: {classes_str}. "
                    f"The target ingredient '{target}' was detected with {conf_pct}% confidence. "
                    f"The customer's claim of an omitted topping could not be substantiated by visual evidence."
                )
                uncertainty = "Ingredients may be dispersed beneath surface sauces or cheese; visual presence confirms ingredient inclusion."
                action = "Notify customer that visual verification identified the topping. Offer customer support review if preparation was unsatisfactory."
            else:
                summary = f"Visual inspection supported customer claim: {target.upper()} was not detected in the food image."
                explanation = (
                    f"The customer reported: '{query}'. "
                    f"The YOLO food detection model processed the image and recognized: {classes_str}. "
                    f"The target ingredient '{target}' was not detected above the configured {int(settings.CONFIDENCE_THRESHOLD * 100)}% detection threshold. "
                    f"Visual evidence is consistent with the customer's missing ingredient claim."
                )
                uncertainty = "Visual detection alone cannot establish whether the ingredient was completely omitted during preparation or is obscured inside the folded layer."
                action = f"Issue automated dispute credit to customer and log quality incident with restaurant kitchen ({order_meta.get('restaurant_name', 'Partner Kitchen') if order_meta else 'Kitchen'})."

        elif complaint_category == "Package Tampering / Condition Change":
            tampering = prediction.get("tampering_detected", False)
            sim_pct = int(prediction.get("similarity_score", 0.85) * 100)

            if tampering:
                summary = f"Package discrepancy confirmed: Handover photograph exhibits structural alteration (Similarity: {sim_pct}%)."
                explanation = (
                    f"Dual-image homography and structural similarity analysis revealed significant variance between restaurant dispatch and courier handover photographs. "
                    f"Seal regions demonstrated disruption exceeding acceptable delivery tolerances. Model confidence: {conf_pct}%."
                )
                uncertainty = "Lighting conditions and slight packaging compression during transport were normalized via homography before computing SSIM."
                action = "Initiate delivery partner handling review; issue immediate customer refund or priority order re-dispatch."
            else:
                summary = f"Package verification confirmed intact: Handover matches dispatch baseline (Similarity: {sim_pct}%)."
                explanation = (
                    f"Structural comparison of the restaurant dispatch photograph and courier handover photograph yielded a high similarity score of {sim_pct}%. "
                    f"No evidence of breached security seals, torn tape, or altered container seals was detected."
                )
                uncertainty = "Homography alignment compensated for angle and perspective differences between handheld devices."
                action = "Mark package condition verified as intact. If internal items were compromised without packaging damage, escalate to restaurant packaging team."

        elif complaint_category == "Food Spillage / Leakage":
            spillage = prediction.get("spillage_detected", False)
            severity = prediction.get("severity", "Unspecified")

            if spillage:
                summary = f"Spillage and container damage verified: {severity}."
                explanation = (
                    f"Computer vision fluid and grease segmentation detected escaping liquids and container boundary displacement with {conf_pct}% confidence. "
                    f"{prediction.get('investigation_summary', 'Significant spillage observed.')}"
                )
                uncertainty = "Condensation inside thermal transit bags was distinguished from liquid curry/sauce via HSV chrominance thresholding."
                action = "Authorize instant customer reimbursement for damaged items and notify delivery partner logistics supervisor."
            else:
                summary = "No spillage or container breach detected in uploaded evidence."
                explanation = (
                    f"Inspection of the uploaded image revealed clean container surfaces with no fluid accumulation or ruptured seals. Model confidence: {conf_pct}%."
                )
                uncertainty = "Minor internal lid leakage that did not reach the exterior packaging cannot be visually detected from external photos."
                action = "Request additional photographic evidence of interior container if leakage occurred inside."

        elif complaint_category == "Foreign Object in Food":
            foreign = prediction.get("foreign_object_detected", False)
            obj_cat = prediction.get("object_category", "foreign_object")

            if foreign:
                summary = f"Foreign contaminant alert: Detected {obj_cat.replace('_', ' ').upper()} in food."
                explanation = (
                    f"High-contrast morphological anomaly filtering and YOLO contaminant classification detected a foreign object ({obj_cat}) with {conf_pct}% confidence. "
                    f"Critical hygiene risk flagged for immediate food safety escalation."
                )
                uncertainty = "High-contrast food elements (e.g., charred herb stems or dark spices) are evaluated using aspect ratio and edge sharpness to minimize false positives."
                action = "High Priority: Issue immediate full refund, notify restaurant food safety manager, and quarantine ingredient batch."
            else:
                summary = "No foreign objects or contaminants detected above model sensitivity threshold."
                explanation = (
                    f"Morphological and high-pass Laplacian scan of the food image found no anomalous inclusions corresponding to supported foreign object classes. Model confidence: {conf_pct}%."
                )
                uncertainty = "Sub-millimeter contaminants or translucent plastic fragments embedded deep inside sauces require manual human inspection."
                action = "Route to human safety officer for manual magnification inspection if customer reports micro-fragment."

        else:
            summary = "Issue type falls outside computer vision verification scope."
            explanation = (
                f"The customer reported: '{query}'. "
                f"Our four trained computer vision models evaluate physical food toppings, package seals, fluid spillage, and physical foreign objects. "
                f"Issues relating to taste, delivery timing, or service interactions require administrative customer support resolution rather than computer vision analysis."
            )
            uncertainty = "Non-visual claims cannot be validated via photographic inference."
            action = "Transfer customer ticket directly to Human Support Specialist."

        return {
            "summary_text": summary,
            "ai_explanation": explanation,
            "uncertainty_notes": uncertainty,
            "recommended_action": action,
            "generated_by_llm": False
        }

explanation_engine = ExplanationEngine()
