import io
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_endpoints():
    print("Testing API endpoints...")

    # 1. Root & Health
    r = client.get("/")
    assert r.status_code == 200, f"Root error: {r.text}"
    print("✓ Root endpoint:", r.json()["platform"])

    r = client.get("/api/health")
    assert r.status_code == 200, f"Health error: {r.text}"
    print("✓ Healthcheck endpoint: OK")

    # 2. Models Status (Four Models)
    r = client.get("/api/models/status")
    assert r.status_code == 200, f"Models status error: {r.text}"
    models = r.json()
    assert len(models) == 4, f"Expected 4 models, got {len(models)}"
    print(f"✓ 4 Models Status verified: {[m['name'] for m in models]}")

    # 3. Auth Login First
    r = client.post("/api/auth/login", json={
        "email": "alex@foodguard.ai",
        "password": "Customer@2026"
    })
    assert r.status_code == 200
    token = r.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    print("✓ Auth login successful for alex@foodguard.ai")

    # 4. Orders List (Authenticated)
    r = client.get("/api/orders", headers=headers)
    assert r.status_code == 200
    orders = r.json()
    print(f"✓ Orders count: {len(orders)} (First order: {orders[0]['order_number']})")

    # 5. Dashboard Stats
    r = client.get("/api/dashboard/stats", headers=headers)
    assert r.status_code == 200
    stats = r.json()
    print(f"✓ Dashboard stats: Total Inv={stats['total_investigations']}, Avg Risk={stats['avg_risk_score']}")

    # 6. End-to-End Investigation Submission (Missing Paneer Check)
    with open("static/uploads/sample_pizza_nopaneer.jpg", "rb") as f:
        img_bytes = f.read()

    r = client.post(
        "/api/investigations",
        data={
            "order_number": "ORD-8942-X",
            "complaint_category": "Missing Food Item / Ingredient",
            "complaint_description": "I ordered a paneer pizza, but there is no paneer on it.",
            "target_ingredient": "paneer"
        },
        files={
            "evidence_image_1": ("sample_pizza.jpg", img_bytes, "image/jpeg")
        },
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r.status_code == 200, f"Investigation submission error: {r.text}"
    inv_res = r.json()
    print(f"✓ E2E Investigation submitted successfully: Code={inv_res['investigation_code']}")
    print(f"  - Target Ingredient: {inv_res['target_ingredient']}")
    print(f"  - Target Verified in Image: {inv_res['predictions'][0]['target_verified']} (False = Missing Claim Confirmed)")
    print(f"  - Risk Score: {inv_res['risk_score']} / 100")
    print(f"  - Verdict: {inv_res['final_verdict']}")
    print(f"  - AI Explanation: {inv_res['report']['summary_text']}")

    # 7. Adjudication Patch (Must be Admin; Customer should get 403)
    # Test customer attempt -> 403 Forbidden
    r_cust = client.patch(
        f"/api/investigations/{inv_res['id']}/verdict",
        json={"final_verdict": "Verified Issue", "responsible_party": "Restaurant"},
        headers={"Authorization": f"Bearer {token}"}
    )
    assert r_cust.status_code == 403, f"Expected 403 for customer verdict patch, got {r_cust.status_code}"
    print("✓ Customer verdict change blocked with 403 Forbidden as expected")

    # Log in as Admin
    r_admin = client.post("/api/auth/login", json={
        "email": "admin@foodguard.ai",
        "password": "Admin@2026"
    })
    admin_token = r_admin.json()["access_token"]

    r = client.patch(
        f"/api/investigations/{inv_res['id']}/verdict",
        json={
            "final_verdict": "Verified Issue",
            "responsible_party": "Restaurant",
            "status": "resolved",
            "resolution_notes": "Adjudicated and verified by QA test suite"
        },
        headers={"Authorization": f"Bearer {admin_token}"}
    )
    assert r.status_code == 200
    print("✓ Admin adjudication verdict updated successfully")

    print("\nALL TEST SUITE CHECKS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_endpoints()
