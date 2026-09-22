def test_languages_endpoint_lists_seeded_languages(client):
    response = client.get("/api/languages")
    assert response.status_code == 200
    codes = {lang["code"] for lang in response.json()}
    assert {"hi", "mundari"}.issubset(codes)


def test_dataset_stats_reports_real_counts_not_fake_numbers(client):
    response = client.get("/api/dataset/stats")
    assert response.status_code == 200
    body = response.json()
    mundari_stats = next(l for l in body["languages"] if l["language_code"] == "mundari")
    # exactly the 4 fixture rows -- proves the endpoint reports the DB's
    # real row count rather than a hardcoded/fake number
    assert mundari_stats["total_pairs"] == 4
    assert body["total_verified_pairs"] == 4


def test_feedback_can_be_submitted(client):
    response = client.post("/api/feedback", json={
        "message": "The number 5 (पांच) seems to be missing from the dataset.",
        "rating": 4,
        "page": "translate",
    })
    assert response.status_code == 201
    body = response.json()
    assert body["message"].startswith("The number 5")
    assert body["rating"] == 4


def test_feedback_requires_a_message(client):
    response = client.post("/api/feedback", json={"message": "", "page": "translate"})
    assert response.status_code == 422
