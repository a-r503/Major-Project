import os
import uuid
import datetime
from pathlib import Path
import cv2
import numpy as np
from app.config import settings
from app.database import engine, SessionLocal, Base
from app.models.db_models import (
    User, LoginActivity, Restaurant, DeliveryPartner, Order,
    Investigation, UploadedEvidence, ModelPrediction, RiskAssessment,
    InvestigationReport, FeedbackRecord
)
from app.services.auth_service import hash_password

def generate_sample_images():
    """Generates synthetic high-quality test images for all 4 model categories."""
    settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    settings.ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)
    
    # 1. Pizza Image (Crust, cheese, red tomato sauce, onion rings)
    img_pizza = np.zeros((500, 500, 3), dtype=np.uint8)
    # Background table
    img_pizza[:] = (40, 35, 30)
    # Pizza Crust (golden brown)
    cv2.circle(img_pizza, (250, 250), 210, (50, 120, 190), -1)
    # Cheese layer (cream yellow)
    cv2.circle(img_pizza, (250, 250), 180, (80, 220, 250), -1)
    # Tomato sauce splotches (red)
    cv2.circle(img_pizza, (210, 210), 35, (25, 25, 200), -1)
    cv2.circle(img_pizza, (290, 260), 40, (25, 25, 200), -1)
    cv2.circle(img_pizza, (240, 310), 30, (25, 25, 200), -1)
    # Onion rings (purple/white)
    cv2.ellipse(img_pizza, (200, 270), (25, 12), 45, 0, 360, (200, 120, 240), 3)
    cv2.ellipse(img_pizza, (280, 190), (30, 14), 120, 0, 360, (200, 120, 240), 3)
    # Capsicum (green)
    cv2.rectangle(img_pizza, (170, 170), (195, 210), (35, 180, 45), -1)
    cv2.rectangle(img_pizza, (310, 290), (340, 315), (35, 180, 45), -1)
    cv2.imwrite(str(settings.UPLOAD_DIR / "sample_pizza_nopaneer.jpg"), img_pizza)

    # 2. Package Dispatch (Restaurant - Intact Seal)
    img_pkg_disp = np.zeros((450, 550, 3), dtype=np.uint8)
    img_pkg_disp[:] = (60, 60, 60)
    # Cardboard Pizza Box
    cv2.rectangle(img_pkg_disp, (80, 70), (470, 380), (70, 140, 200), -1)
    # Green Security Tape
    cv2.rectangle(img_pkg_disp, (240, 70), (310, 380), (60, 180, 60), -1)
    cv2.putText(img_pkg_disp, "SEALED", (245, 230), cv2.FONT_HERSHEY_SIMPLEX, 0.5, (255, 255, 255), 1)
    cv2.imwrite(str(settings.UPLOAD_DIR / "sample_pkg_dispatch.jpg"), img_pkg_disp)

    # 3. Package Handover (Courier - Broken Seal)
    img_pkg_tamper = img_pkg_disp.copy()
    # Tear/cut across the green security tape
    cv2.rectangle(img_pkg_tamper, (235, 200), (315, 250), (40, 40, 180), -1)
    cv2.line(img_pkg_tamper, (230, 225), (320, 225), (20, 20, 20), 4)
    cv2.putText(img_pkg_tamper, "TAMPER", (242, 220), cv2.FONT_HERSHEY_SIMPLEX, 0.45, (255, 255, 255), 1)
    cv2.imwrite(str(settings.UPLOAD_DIR / "sample_pkg_tampered.jpg"), img_pkg_tamper)

    # 4. Spillage Image (Food container with spilled curry/gravy)
    img_spill = np.zeros((450, 500, 3), dtype=np.uint8)
    img_spill[:] = (230, 230, 230)
    # Meal Box
    cv2.rectangle(img_spill, (100, 90), (380, 340), (20, 20, 20), -1)
    # Curry Spillage spreading out
    cv2.ellipse(img_spill, (360, 300), (90, 60), 30, 0, 360, (20, 100, 220), -1)
    cv2.circle(img_spill, (410, 340), 35, (20, 90, 210), -1)
    cv2.imwrite(str(settings.UPLOAD_DIR / "sample_spill.jpg"), img_spill)

    # 5. Foreign Object Image (Hair strand in meal)
    img_hair = np.zeros((450, 450, 3), dtype=np.uint8)
    img_hair[:] = (200, 215, 225)
    # Pasta/noodles base
    cv2.circle(img_hair, (225, 225), 170, (110, 190, 235), -1)
    # Wavy hair strand (dark thin line)
    pts = np.array([[160, 190], [190, 220], [230, 200], [270, 250], [300, 240]], np.int32)
    cv2.polylines(img_hair, [pts], False, (20, 20, 20), 2)
    cv2.imwrite(str(settings.UPLOAD_DIR / "sample_foreign_hair.jpg"), img_hair)

def seed_database():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()

    # Generate test images
    generate_sample_images()

    # Check if already seeded
    if db.query(User).count() > 0:
        db.close()
        return

    print("Seeding initial database data...")

    # 1. Restaurants first
    rest1 = Restaurant(
        name="Bella Napoli Gourmet Pizza",
        address="742 Evergreen Terrace, Sector 4",
        contact_phone="+1 555-019-8234",
        rating=4.8,
        compliance_score=97.5
    )
    rest2 = Restaurant(
        name="Urban Spice Bistro",
        address="1204 Broadway Ave, Tech Quarter",
        contact_phone="+1 555-018-4921",
        rating=4.5,
        compliance_score=92.0
    )
    rest3 = Restaurant(
        name="Dragon Bowl Asian Express",
        address="88 Lotus St, Downtown Plaza",
        contact_phone="+1 555-014-9932",
        rating=4.6,
        compliance_score=95.0
    )
    db.add_all([rest1, rest2, rest3])
    db.commit()

    # 2. Delivery Partners
    courier1 = DeliveryPartner(
        name="SwiftRider Express",
        vehicle_type="Electric Scooter",
        phone="+1 555-777-1234",
        rating=4.9,
        deliveries_completed=1420
    )
    courier2 = DeliveryPartner(
        name="UrbanCourier Pro",
        vehicle_type="Motorcycle",
        phone="+1 555-888-5678",
        rating=4.7,
        deliveries_completed=980
    )
    db.add_all([courier1, courier2])
    db.commit()

    # 3. Users for each role with linked entities
    admin_user = User(
        full_name="Chief Investigator Sarah Vance",
        email="admin@foodguard.ai",
        hashed_password=hash_password("Admin@2026"),
        role="admin",
        status="active",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=90),
        last_login=datetime.datetime.utcnow() - datetime.timedelta(minutes=10)
    )
    customer_user = User(
        full_name="Alex Mercer",
        email="alex@foodguard.ai",
        hashed_password=hash_password("Customer@2026"),
        role="customer",
        status="active",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=45),
        last_login=datetime.datetime.utcnow() - datetime.timedelta(hours=1)
    )
    restaurant_user = User(
        full_name="Marco Rossi (Bella Napoli)",
        email="manager@bellapizza.com",
        hashed_password=hash_password("Partner@2026"),
        role="restaurant",
        restaurant_id=rest1.id,
        status="active",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=60),
        last_login=datetime.datetime.utcnow() - datetime.timedelta(hours=3)
    )
    courier_user = User(
        full_name="Devon Carter (SpeedyDrop)",
        email="rider@speedydrop.com",
        hashed_password=hash_password("Rider@2026"),
        role="delivery_partner",
        delivery_partner_id=courier1.id,
        status="active",
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=30),
        last_login=datetime.datetime.utcnow() - datetime.timedelta(minutes=45)
    )

    db.add_all([admin_user, customer_user, restaurant_user, courier_user])
    db.commit()

    # 4. Realistic Orders
    order1 = Order(
        order_number="ORD-8942-X",
        customer_id=customer_user.id,
        restaurant_id=rest1.id,
        delivery_partner_id=courier1.id,
        items_json=[{
            "item": "Paneer Gourmet Pizza",
            "quantity": 1,
            "ingredients": ["paneer", "cheese", "tomato", "onion", "capsicum", "crust"],
            "price": 18.99
        }, {
            "item": "Garlic Dough Knots",
            "quantity": 1,
            "ingredients": ["garlic", "butter", "dough"],
            "price": 5.99
        }],
        total_amount=24.98,
        status="delivered",
        order_date=datetime.datetime.utcnow() - datetime.timedelta(hours=3),
        restaurant_dispatch_time=datetime.datetime.utcnow() - datetime.timedelta(hours=2, minutes=30),
        restaurant_package_image="/static/uploads/sample_pkg_dispatch.jpg",
        delivery_handover_time=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        delivery_handover_image="/static/uploads/sample_pkg_tampered.jpg"
    )

    order2 = Order(
        order_number="ORD-7721-B",
        customer_id=customer_user.id,
        restaurant_id=rest2.id,
        delivery_partner_id=courier2.id,
        items_json=[{
            "item": "Butter Chicken Curry with Basmati",
            "quantity": 1,
            "ingredients": ["chicken", "curry sauce", "butter", "rice"],
            "price": 16.50
        }],
        total_amount=16.50,
        status="delivered",
        order_date=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        restaurant_dispatch_time=datetime.datetime.utcnow() - datetime.timedelta(days=1, hours=1),
        restaurant_package_image="/static/uploads/sample_pkg_dispatch.jpg",
        delivery_handover_time=datetime.datetime.utcnow() - datetime.timedelta(days=1, minutes=30),
        delivery_handover_image="/static/uploads/sample_spill.jpg"
    )

    order3 = Order(
        order_number="ORD-4419-C",
        customer_id=customer_user.id,
        restaurant_id=rest3.id,
        delivery_partner_id=courier1.id,
        items_json=[{
            "item": "Tokyo Tonkotsu Ramen",
            "quantity": 1,
            "ingredients": ["noodles", "broth", "egg", "scallion"],
            "price": 15.00
        }],
        total_amount=15.00,
        status="delivered",
        order_date=datetime.datetime.utcnow() - datetime.timedelta(days=2),
        restaurant_package_image="/static/uploads/sample_pkg_dispatch.jpg"
    )
    db.add_all([order1, order2, order3])
    db.commit()

    # 5. Seed Historical Investigation (ORD-8942-X Paneer Claim)
    inv1 = Investigation(
        investigation_code="INV-2026-9041",
        customer_id=customer_user.id,
        order_id=order1.id,
        complaint_category="Missing Food Item / Ingredient",
        original_query="I ordered a paneer pizza, but there is no paneer on it.",
        target_ingredient="paneer",
        selected_model="Model 1: YOLO Food Ingredient & Item Detection",
        status="resolved",
        final_verdict="Verified Issue",
        responsible_party="Restaurant",
        risk_score=26.4,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(hours=2),
        resolved_at=datetime.datetime.utcnow() - datetime.timedelta(hours=1, minutes=45),
        resolution_notes="Visual detection confirmed absence of paneer blocks. Customer refunded $18.99."
    )
    db.add(inv1)
    db.flush()

    evid1 = UploadedEvidence(
        investigation_id=inv1.id,
        evidence_type="customer_primary_photo",
        file_path="/static/uploads/sample_pizza_nopaneer.jpg",
        annotated_path="/static/uploads/sample_pizza_nopaneer.jpg",
        uploaded_by="customer",
        file_size_bytes=142000
    )
    db.add(evid1)

    pred1 = ModelPrediction(
        investigation_id=inv1.id,
        model_name="Model 1: YOLO Food Ingredient & Item Detection",
        model_version="v1.4.2",
        is_custom_weights=False,
        input_image_path="/static/uploads/sample_pizza_nopaneer.jpg",
        annotated_image_path="/static/uploads/sample_pizza_nopaneer.jpg",
        detected_classes=["pizza", "cheese", "tomato", "onion", "capsicum"],
        confidence=0.912,
        bounding_boxes=[
            {"label": "pizza", "confidence": 0.942, "box": [50, 50, 450, 450]},
            {"label": "cheese", "confidence": 0.92, "box": [90, 90, 410, 410]},
            {"label": "tomato", "confidence": 0.895, "box": [180, 180, 240, 240]},
            {"label": "onion", "confidence": 0.864, "box": [170, 250, 230, 290]}
        ],
        raw_output={"target_ingredient": "paneer", "target_verified": False},
        target_verified=False,
        execution_time_ms=124.6
    )
    db.add(pred1)

    risk1 = RiskAssessment(
        investigation_id=inv1.id,
        risk_score=26.4,
        priority_level="Low",
        outcome="Verified Issue",
        model_confidence_factor=0.912,
        evidence_discrepancy_factor=25.0,
        customer_history_factor=0.0,
        restaurant_history_factor=0.0,
        factors_breakdown={"formula": "60% Discrepancy + 20% Customer + 10% Restaurant + 10% Confidence Penalty"}
    )
    db.add(risk1)

    rep1 = InvestigationReport(
        investigation_id=inv1.id,
        summary_text="Visual inspection supported customer claim: PANEER was not detected in the food image.",
        ai_explanation="The customer reported: 'I ordered a paneer pizza, but there is no paneer on it.' The YOLO food detection model identified pizza, cheese, tomato, and onion. The target ingredient 'paneer' was not detected above the 25% threshold. Visual evidence is consistent with the customer's missing ingredient claim.",
        uncertainty_notes="Visual detection confirms toppings on top surface; unexposed layers inside folds require human review.",
        recommended_action="Issue dispute credit of $18.99 to customer Alex Mercer and register kitchen omission warning with Bella Napoli Gourmet Pizza.",
        generated_by_llm=False
    )
    db.add(rep1)

    # 6. Seed Package Tampering Case (ORD-8942-X package tampering)
    inv2 = Investigation(
        investigation_code="INV-2026-8812",
        customer_id=customer_user.id,
        order_id=order1.id,
        complaint_category="Package Tampering / Condition Change",
        original_query="The box security seal was cut and torn when the rider handed it over.",
        target_ingredient=None,
        selected_model="Model 2: Restaurant & Courier Package Verifier",
        status="under_review",
        final_verdict="Requires Manual Investigation",
        responsible_party="Delivery Partner",
        risk_score=48.5,
        created_at=datetime.datetime.utcnow() - datetime.timedelta(days=1),
        resolution_notes="Discrepancy detected on security seal. Assigned to logistics audit."
    )
    db.add(inv2)
    db.commit()

    db.close()
    print("Database seeding completed successfully.")

if __name__ == "__main__":
    seed_database()
