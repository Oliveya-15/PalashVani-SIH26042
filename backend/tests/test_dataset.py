# MODIFIED FILE -- your existing backend/tests/test_dataset.py. Changes,
# marked below: /api/languages and /api/feedback now need `auth_headers`
# (any logged-in user); /api/dataset/stats specifically needs a teacher or
# admin account, which `auth_headers` already is (see conftest.py -- it
# registers a "teacher" role account). Every assertion is unchanged.


def test_languages_endpoint_lists_seeded_languages(client, auth_headers):
    response = client.get("/api/languages", headers=auth_headers)
    assert response.status_code == 200
    codes = {lang["code"] for lang in response.json()}
    assert {"hi", "mundari"}.issubset(codes)


def test_dataset_stats_reports_real_counts_not_fake_numbers(client, auth_headers):
    response = client.get("/api/dataset/stats", headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    mundari_stats = next(l for l in body["languages"] if l["language_code"] == "mundari")
    # exactly the 4 fixture rows -- proves the endpoint reports the DB's
    # real row count rather than a hardcoded/fake number
    assert mundari_stats["total_pairs"] == 4
    assert body["total_verified_pairs"] == 4


def test_dataset_stats_blocks_students(client, db_session):
    """NEW -- confirms the one real teacher-vs-student differentiation is
    actually enforced, not just documented."""
    register = client.post("/api/auth/register", json={
        "full_name": "Test Student", "email": "student@example.com",
        "password": "a-strong-password", "role": "student",
    })
    student_headers = {"Authorization": f"Bearer {register.json()['access_token']}"}
    response = client.get("/api/dataset/stats", headers=student_headers)
    assert response.status_code == 403


def test_feedback_can_be_submitted(client, auth_headers):
    response = client.post("/api/feedback", json={
        "message": "The number 5 (पांच) seems to be missing from the dataset.",
        "rating": 4,
        "page": "translate",
    }, headers=auth_headers)
    assert response.status_code == 201
    body = response.json()
    assert body["message"].startswith("The number 5")
    assert body["rating"] == 4


def test_feedback_requires_a_message(client, auth_headers):
    response = client.post(
        "/api/feedback", json={"message": "", "page": "translate"}, headers=auth_headers,
    )
    assert response.status_code == 422


def test_feedback_requires_login(client):
    """NEW -- confirms the auth requirement itself is actually enforced."""
    response = client.post("/api/feedback", json={"message": "Test.", "page": "translate"})
    assert response.status_code == 401
