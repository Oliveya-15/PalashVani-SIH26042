def test_health_check_ok(client):
    response = client.get("/api/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert "semantic_search_available" in body


def test_root_endpoint(client):
    response = client.get("/")
    assert response.status_code == 200
    assert "docs" in response.json()
