def test_search_returns_matching_entries(client):
    response = client.get("/api/translations/search", params={"q": "नमस्ते"})
    assert response.status_code == 200
    body = response.json()
    assert body["total"] >= 1
    assert any(r["target_text"] == "जोहार" for r in body["results"])


def test_search_empty_query_returns_paginated_full_list(client):
    response = client.get("/api/translations/search", params={"page": 1, "page_size": 2})
    assert response.status_code == 200
    body = response.json()
    assert len(body["results"]) <= 2
    assert body["total"] >= 4  # seeded 4 entries in conftest


def test_search_category_filter(client):
    response = client.get("/api/translations/search", params={"category": "number"})
    body = response.json()
    assert all(r["category"] == "number" for r in body["results"])
    assert body["total"] == 2  # "एक" and "दो" from the fixture


def test_search_empty_results_state(client):
    response = client.get("/api/translations/search", params={"q": "zzzznotfound"})
    body = response.json()
    assert body["total"] == 0
    assert body["results"] == []


def test_list_categories(client):
    response = client.get("/api/translations/categories")
    assert response.status_code == 200
    categories = response.json()
    assert "greeting" in categories
    assert "number" in categories
