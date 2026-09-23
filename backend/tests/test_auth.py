"""
NEW FILE -- tests for the auth endpoints. Uses the exact same `client`
and `db_session` fixtures already defined in backend/tests/conftest.py
(unchanged) -- importing app.models.user here is enough for its table to
be created in the isolated in-memory test database, since pytest imports
this module (registering User on Base.metadata) before any fixture runs
Base.metadata.create_all().
"""
from app.models.user import User  # noqa: F401  (import registers the table -- see docstring)


def _register_payload(**overrides):
    payload = {
        "full_name": "Anjali Kumari",
        "email": "anjali@example.com",
        "password": "a-strong-password",
        "role": "teacher",
        "school_name": "Govt Middle School, Khunti",
        "district": "Khunti",
    }
    payload.update(overrides)
    return payload


def test_register_creates_account_and_returns_token(client):
    response = client.post("/api/auth/register", json=_register_payload())
    assert response.status_code == 201
    body = response.json()
    assert body["user"]["email"] == "anjali@example.com"
    assert body["user"]["role"] == "teacher"
    assert "access_token" in body


def test_register_rejects_duplicate_email(client):
    client.post("/api/auth/register", json=_register_payload())
    response = client.post("/api/auth/register", json=_register_payload(full_name="Second Person"))
    assert response.status_code == 409


def test_register_rejects_admin_role(client):
    response = client.post("/api/auth/register", json=_register_payload(role="admin"))
    assert response.status_code == 422  # rejected by the Literal["teacher","student"] schema type


def test_login_succeeds_with_correct_password(client):
    client.post("/api/auth/register", json=_register_payload())
    response = client.post("/api/auth/login", json={"email": "anjali@example.com", "password": "a-strong-password"})
    assert response.status_code == 200
    assert "access_token" in response.json()


def test_login_fails_with_wrong_password(client):
    client.post("/api/auth/register", json=_register_payload())
    response = client.post("/api/auth/login", json={"email": "anjali@example.com", "password": "wrong-password"})
    assert response.status_code == 401


def test_me_requires_a_token(client):
    response = client.get("/api/auth/me")
    assert response.status_code == 401


def test_me_returns_profile_with_valid_token(client):
    register_response = client.post("/api/auth/register", json=_register_payload())
    token = register_response.json()["access_token"]
    response = client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "anjali@example.com"


def test_update_profile(client):
    register_response = client.post("/api/auth/register", json=_register_payload())
    token = register_response.json()["access_token"]
    response = client.patch(
        "/api/auth/me",
        json={"school_name": "New School Name"},
        headers={"Authorization": f"Bearer {token}"},
    )
    assert response.status_code == 200
    assert response.json()["school_name"] == "New School Name"
