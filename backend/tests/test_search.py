# MODIFIED FILE -- your existing backend/tests/test_search.py. Only
# change: every request now passes `headers=auth_headers` since these
# routes require a logged-in user now. Every assertion is unchanged.


def test_search_returns_matching_entries(client, auth_headers):
    response = client.get("/api/translations/search", params={"q": "नमस्ते"}, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert any(r["target_text"] == "जोहार" for r in body["results"])


def test_search_empty_query_returns_paginated_full_list(client, auth_headers):
    response = client.get("/api/translations/search", params={"page": 1, "page_size": 2}, headers=auth_headers)
    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) <= 2
    assert body["total"] >= 4  # seeded 4 entries in conftest


def test_search_category_filter(client, auth_headers):
    response = client.get("/api/translations/search", params={"category": "number"}, headers=auth_headers)
    body = response.json()
    assert all(r["category"] == "number" for r in body["results"])
    assert body["total"] == 2  # "एक" and "दो" from the fixture


def test_search_empty_results_state(client, auth_headers):
    response = client.get("/api/translations/search", params={"q": "zzzznotfound"}, headers=auth_headers)
    body = response.json()
    assert body["total"] == 0
    assert body["results"] == []


def test_list_categories(client, auth_headers):
    response = client.get("/api/translations/categories", headers=auth_headers)
    assert response.status_code == 200
    categories = response.json()
    assert "greeting" in categories
    assert "number" in categories


def test_search_requires_login(client):
    """NEW -- confirms the auth requirement itself is actually enforced."""
    response = client.get("/api/translations/search", params={"q": "नमस्ते"})
    assert response.status_code == 401
