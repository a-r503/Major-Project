from typing import Dict, Any, Optional

class RiskEngine:
    """
    Evidence-based AI Decision and Risk Scoring Engine.
    Combines model prediction telemetry, order metadata, and historical party reliability.
    Risk score (0 to 100) indicates dispute urgency and priority, NOT automatic fraud presumption.
    """
    
    @classmethod
    def evaluate(
        cls,
        complaint_category: str,
        model_prediction: Dict[str, Any],
        target_ingredient: Optional[str] = None,
        order_meta: Optional[Dict[str, Any]] = None,
        customer_history: Optional[Dict[str, Any]] = None,
        restaurant_history: Optional[Dict[str, Any]] = None,
        has_two_photos: bool = False
    ) -> Dict[str, Any]:
        """
        Calculates risk score, priority level, outcome, and responsible party hypothesis.
        """
        confidence = float(model_prediction.get("confidence", 0.85))
        
        # 1. Base Discrepancy Score based on Model Findings
        discrepancy_score = 50.0
        hypothesis_party = "Undetermined"
        
        if complaint_category == "Missing Food Item / Ingredient":
            target_verified = model_prediction.get("target_verified")
            if target_verified is False:
                # Target ingredient was NOT found -> Customer claim is visually supported
                discrepancy_score = 25.0  # Lower risk of customer fraud
                hypothesis_party = "Restaurant"
            elif target_verified is True:
                # Target ingredient was clearly detected in the customer's photo -> Potential false claim
                discrepancy_score = 75.0
                hypothesis_party = "Customer"
            else:
                discrepancy_score = 50.0
                hypothesis_party = "Undetermined"

        elif complaint_category == "Package Tampering / Condition Change":
            tampering = model_prediction.get("tampering_detected", False)
            sim_score = model_prediction.get("similarity_score", 0.85)
            if tampering:
                discrepancy_score = 30.0  # Legitimate package issue
                hypothesis_party = "Delivery Partner"
            else:
                discrepancy_score = 68.0  # Packages are identical; claim unsubstantiated
                hypothesis_party = "Customer"

        elif complaint_category == "Food Spillage / Leakage":
            spillage = model_prediction.get("spillage_detected", False)
            if spillage:
                discrepancy_score = 20.0  # Legitimate transit damage
                hypothesis_party = "Delivery Partner"
            else:
                discrepancy_score = 65.0
                hypothesis_party = "Customer"

        elif complaint_category == "Foreign Object in Food":
            foreign = model_prediction.get("foreign_object_detected", False)
            if foreign:
                discrepancy_score = 15.0  # Critical legitimate issue
                hypothesis_party = "Restaurant"
            else:
                discrepancy_score = 60.0
                hypothesis_party = "Customer"
        else:
            discrepancy_score = 45.0
            hypothesis_party = "Undetermined"

        # 2. Historical Multipliers
        cust_history_factor = 0.0
        if customer_history:
            total_orders = customer_history.get("total_orders", 1)
            fraud_count = customer_history.get("confirmed_fraud_count", 0)
            dispute_rate = customer_history.get("dispute_count", 0) / max(1, total_orders)
            if fraud_count > 0:
                cust_history_factor = min(20.0, fraud_count * 10.0)
            elif dispute_rate > 0.40 and total_orders > 3:
                cust_history_factor = 10.0

        rest_history_factor = 0.0
        if restaurant_history:
            compliance = restaurant_history.get("compliance_score", 95.0)
            if compliance < 85.0:
                rest_history_factor = (85.0 - compliance) * 0.5  # Increases priority for low-compliance restaurants

        # 3. Model Confidence Adjustment
        confidence_factor = round((1.0 - confidence) * 20.0, 2)  # Higher uncertainty increases priority for manual check

        # 4. Synthesize Final Score (0 to 100)
        raw_score = (discrepancy_score * 0.60) + (cust_history_factor * 0.20) + (rest_history_factor * 0.10) + (confidence_factor * 0.10)
        final_risk_score = round(max(5.0, min(95.0, raw_score)), 1)

        # 5. Determine Priority Level
        if final_risk_score >= 70.0:
            priority = "High"
        elif final_risk_score >= 40.0:
            priority = "Medium"
        else:
            priority = "Low"

        # 6. Tri-State Investigation Outcome
        # Strictly one of: Verified Issue, Requires Manual Investigation, No Issue Detected
        if complaint_category == "Missing Food Item / Ingredient":
            if model_prediction.get("target_verified") is False and confidence >= 0.80:
                outcome = "Verified Issue"
            elif model_prediction.get("target_verified") is True and confidence >= 0.80:
                outcome = "No Issue Detected"
            else:
                outcome = "Requires Manual Investigation"
        elif complaint_category == "Package Tampering / Condition Change":
            if model_prediction.get("tampering_detected") and confidence >= 0.80:
                outcome = "Verified Issue"
            elif not model_prediction.get("tampering_detected") and confidence >= 0.85:
                outcome = "No Issue Detected"
            else:
                outcome = "Requires Manual Investigation"
        elif complaint_category == "Food Spillage / Leakage":
            if model_prediction.get("spillage_detected") and confidence >= 0.75:
                outcome = "Verified Issue"
            else:
                outcome = "No Issue Detected"
        elif complaint_category == "Foreign Object in Food":
            if model_prediction.get("foreign_object_detected") and confidence >= 0.75:
                outcome = "Verified Issue"
            else:
                outcome = "Requires Manual Investigation"  # Micro-contaminants warrant human review
        else:
            outcome = "Requires Manual Investigation"

        factors_breakdown = {
            "model_confidence": confidence,
            "discrepancy_score": discrepancy_score,
            "customer_history_adjustment": cust_history_factor,
            "restaurant_history_adjustment": rest_history_factor,
            "confidence_uncertainty_penalty": confidence_factor,
            "formula": "60% Discrepancy + 20% Customer History + 10% Restaurant Factor + 10% Confidence Penalty"
        }

        return {
            "risk_score": final_risk_score,
            "priority_level": priority,
            "outcome": outcome,
            "responsible_party": hypothesis_party,
            "factors_breakdown": factors_breakdown,
            "model_confidence_factor": confidence,
            "evidence_discrepancy_factor": discrepancy_score,
            "customer_history_factor": cust_history_factor,
            "restaurant_history_factor": rest_history_factor
        }

risk_engine = RiskEngine()
