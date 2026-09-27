# NEW FILE -- tests for every /api/admin/* endpoint, plus the
# rights-clearance enforcement that ties the whole feature together.


def test_admin_routes_reject_non_admin(client, auth_headers):
    """auth_headers is a teacher account -- every admin route must 403 it."""
    for method, path in [
        ("get", "/api/admin/users"),
        ("get", "/api/admin/dataset"),
        ("get", "/api/admin/dashboard/stats"),
        ("get", "/api/admin/dashboard/feedback"),
        ("get", "/api/admin/dashboard/audit-log"),
    ]:
        response = getattr(client, method)(path, headers=auth_headers)
        assert response.status_code == 403, f"{method.upper()} {path} should reject a teacher"


def test_admin_routes_reject_anonymous(client):
    response = client.get("/api/admin/users")
    assert response.status_code == 401


def test_admin_can_list_users(client, admin_headers, auth_headers):
    response = client.get("/api/admin/users", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1  # at least the teacher created by auth_headers
    assert any(u["email"] == "test.teacher@example.com" for u in body["users"])


def test_admin_can_deactivate_a_user(client, admin_headers, auth_headers, db_session):
    from app.models.user import User
    teacher = db_session.query(User).filter(User.email == "test.teacher@example.com").first()

    response = client.patch(
        f"/api/admin/users/{teacher.id}", json={"is_active": False}, headers=admin_headers,
    )
    assert response.status_code == 200
    assert response.json()["is_active"] is False


def test_admin_cannot_deactivate_own_account(client, admin_headers, db_session):
    from app.models.user import User
    admin = db_session.query(User).filter(User.email == "test.admin@example.com").first()

    response = client.patch(
        f"/api/admin/users/{admin.id}", json={"is_active": False}, headers=admin_headers,
    )
    assert response.status_code == 400


def test_new_dataset_entry_starts_unpublished_and_admin_can_clear_it(client, admin_headers, auth_headers):
    # 1. Create a new entry -- defaults to rights_cleared=False (see AdminDatasetEntryCreate)
    create_response = client.post("/api/admin/dataset", json={
        "source_text": "धन्यवाद",
        "target_text": "जोहार धन्यवाद",  # placeholder, not a real translation -- test data only
        "source_citation": "internal test",
    }, headers=admin_headers)
    assert create_response.status_code == 201
    entry = create_response.json()
    assert entry["rights_cleared"] is False

    # 2. It must NOT show up in the public search yet (as a teacher)
    search_response = client.get(
        "/api/translations/search", params={"q": "धन्यवाद"}, headers=auth_headers,
    )
    assert all(r["id"] != entry["id"] for r in search_response.json()["results"])

    # 3. Admin clears rights
    clear_response = client.patch(
        f"/api/admin/dataset/{entry['id']}", json={"rights_cleared": True}, headers=admin_headers,
    )
    assert clear_response.status_code == 200
    assert clear_response.json()["rights_cleared"] is True

    # 4. NOW it shows up in public search
    search_response_2 = client.get(
        "/api/translations/search", params={"q": "धन्यवाद"}, headers=auth_headers,
    )
    assert any(r["id"] == entry["id"] for r in search_response_2.json()["results"])


def test_admin_actions_are_audit_logged(client, admin_headers):
    client.post("/api/admin/dataset", json={
        "source_text": "परीक्षण", "target_text": "परीक्षण-मुंडारी", "source_citation": "test",
    }, headers=admin_headers)

    response = client.get("/api/admin/dashboard/audit-log", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert any(item["action"] == "dataset_entry.create" for item in body["items"])


def test_dashboard_stats_are_real_not_fabricated(client, admin_headers, auth_headers):
    client.post("/api/translations", json={
        "text": "नमस्ते", "source_language": "hi", "target_language": "mundari",
    }, headers=auth_headers)

    response = client.get("/api/admin/dashboard/stats", headers=admin_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total_translations_served"] >= 1
    assert body["users_by_role"]["teacher"] >= 1
    assert body["users_by_role"]["admin"] >= 1
