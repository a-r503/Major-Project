from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_roles_rbac():
    print("Testing 4 Role-Based Dashboards & RBAC Protection...")

    # ==========================================
    # 1. CUSTOMER ROLE (Alex Mercer)
    # ==========================================
    r_cust = client.post("/api/auth/login", json={
        "email": "alex@foodguard.ai",
        "password": "Customer@2026"
    })
    assert r_cust.status_code == 200
    cust_token = r_cust.json()["access_token"]
    cust_user = r_cust.json()["user"]
    assert cust_user["role"] == "customer"
    print(f"✓ [ROLE 1] Authenticated Customer: {cust_user['full_name']} ({cust_user['role']})")

    # Customer Role Stats
    r_cstats = client.get("/api/dashboard/role-stats", headers={"Authorization": f"Bearer {cust_token}"})
    assert r_cstats.status_code == 200
    cdata = r_cstats.json()
    assert cdata["role"] == "customer"
    print(f"  - Customer Stats: Total Orders={cdata['total_orders']}, Refunded=${cdata['total_refunded']}")

    # Customer Orders Filter
    r_corders = client.get("/api/orders", headers={"Authorization": f"Bearer {cust_token}"})
    assert r_corders.status_code == 200
    assert all(o["customer_id"] == cust_user["id"] for o in r_corders.json())
    print(f"  - Orders restricted strictly to customer's account: {len(r_corders.json())} orders")

    # Customer Adjudication Block
    r_block = client.patch(
        "/api/investigations/1/verdict",
        json={"final_verdict": "Verified Issue", "responsible_party": "Restaurant"},
        headers={"Authorization": f"Bearer {cust_token}"}
    )
    assert r_block.status_code == 403
    print("  - Route Protection: Customer blocked from adjudicating verdicts (403 Forbidden)")

    # ==========================================
    # 2. RESTAURANT ROLE (Bella Napoli)
    # ==========================================
    r_rest = client.post("/api/auth/login", json={
        "email": "manager@bellapizza.com",
        "password": "Partner@2026"
    })
    assert r_rest.status_code == 200
    rest_token = r_rest.json()["access_token"]
    rest_user = r_rest.json()["user"]
    assert rest_user["role"] == "restaurant"
    print(f"\n✓ [ROLE 2] Authenticated Restaurant: {rest_user['full_name']} ({rest_user['role']})")

    # Restaurant Role Stats
    r_rstats = client.get("/api/dashboard/role-stats", headers={"Authorization": f"Bearer {rest_token}"})
    assert r_rstats.status_code == 200
    rdata = r_rstats.json()
    assert rdata["role"] == "restaurant"
    print(f"  - Kitchen Stats: Kitchen='{rdata['restaurant_name']}', Compliance={rdata['compliance_score']}%, Prepared={rdata['total_orders_prepared']}")

    # Restaurant Dispatch Photo Upload
    with open("static/uploads/sample_pkg_dispatch.jpg", "rb") as f:
        img_bytes = f.read()
    r_disp = client.post(
        "/api/orders/ORD-8942-X/dispatch-photo",
        files={"dispatch_photo": ("dispatch.jpg", img_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {rest_token}"}
    )
    assert r_disp.status_code == 200
    print("  - Kitchen feature: Attached Packaging Proof photo to order ORD-8942-X")

    # Restaurant Dispute Response Submission
    r_rresp = client.post(
        "/api/investigations/1/restaurant-response",
        json={"restaurant_response": "Kitchen station #2 confirmed 120g paneer baked; dispatch photo verifies sealed packaging."},
        headers={"Authorization": f"Bearer {rest_token}"}
    )
    assert r_rresp.status_code == 200
    assert r_rresp.json()["restaurant_response"] is not None
    print("  - Kitchen feature: Submitted Chef Counter-Evidence to dispute #1")

    # ==========================================
    # 3. DELIVERY PARTNER ROLE (SpeedyDrop)
    # ==========================================
    r_dp = client.post("/api/auth/login", json={
        "email": "rider@speedydrop.com",
        "password": "Rider@2026"
    })
    assert r_dp.status_code == 200
    dp_token = r_dp.json()["access_token"]
    dp_user = r_dp.json()["user"]
    assert dp_user["role"] == "delivery_partner"
    print(f"\n✓ [ROLE 3] Authenticated Courier: {dp_user['full_name']} ({dp_user['role']})")

    # Courier Role Stats
    r_dpstats = client.get("/api/dashboard/role-stats", headers={"Authorization": f"Bearer {dp_token}"})
    assert r_dpstats.status_code == 200
    dpdata = r_dpstats.json()
    assert dpdata["role"] == "delivery_partner"
    print(f"  - Transit Stats: Courier='{dpdata['courier_name']}', Vehicle={dpdata['vehicle_type']}, Transit Integrity={dpdata['transit_integrity_score']}%")

    # Courier Handover Photo Upload
    with open("static/uploads/sample_pkg_tampered.jpg", "rb") as f:
        h_bytes = f.read()
    r_hand = client.post(
        "/api/orders/ORD-8942-X/handover-photo",
        files={"handover_photo": ("handover.jpg", h_bytes, "image/jpeg")},
        headers={"Authorization": f"Bearer {dp_token}"}
    )
    assert r_hand.status_code == 200
    print("  - Courier feature: Attached Doorstep Handover Proof photo to order ORD-8942-X")

    # Courier Statement Submission
    r_dpstmt = client.post(
        "/api/investigations/1/courier-statement",
        json={"courier_statement": "Package was transported upright in thermal divider box; seal was inspected at customer doorstep."},
        headers={"Authorization": f"Bearer {dp_token}"}
    )
    assert r_dpstmt.status_code == 200
    assert r_dpstmt.json()["courier_statement"] is not None
    print("  - Courier feature: Recorded Transit Condition Statement to dispute #1")

    # ==========================================
    # 4. ADMIN ROLE (Chief Investigator Sarah Vance)
    # ==========================================
    r_adm = client.post("/api/auth/login", json={
        "email": "admin@foodguard.ai",
        "password": "Admin@2026"
    })
    assert r_adm.status_code == 200
    adm_token = r_adm.json()["access_token"]
    adm_user = r_adm.json()["user"]
    assert adm_user["role"] == "admin"
    print(f"\n✓ [ROLE 4] Authenticated Admin: {adm_user['full_name']} ({adm_user['role']})")

    # Admin Global Stats
    r_astats = client.get("/api/dashboard/role-stats", headers={"Authorization": f"Bearer {adm_token}"})
    assert r_astats.status_code == 200
    adata = r_astats.json()
    assert adata["role"] == "admin"
    print(f"  - Admin Stats: Total System Investigations={adata['stats']['total_investigations']}, Verified Claims={adata['stats']['verified_claims']}")

    # Admin Adjudication Success
    r_adj = client.patch(
        "/api/investigations/1/verdict",
        json={
            "final_verdict": "Verified Issue",
            "responsible_party": "Restaurant",
            "status": "resolved",
            "resolution_notes": "Adjudicated by Chief Investigator Sarah Vance after reviewing kitchen and courier statements."
        },
        headers={"Authorization": f"Bearer {adm_token}"}
    )
    assert r_adj.status_code == 200
    print("  - Admin authority: Adjudication verdict successfully committed to database!")

    print("\n========================================================")
    print("ALL 4 ROLE-BASED DASHBOARDS & RBAC RULES VERIFIED 100%!")
    print("========================================================")

if __name__ == "__main__":
    test_roles_rbac()
