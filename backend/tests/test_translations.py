def test_exact_match_translation(client):
    response = client.post("/api/translations", json={
        "text": "नमस्ते",
        "source_language": "hi",
        "target_language": "mundari",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["method"] == "exact"
    assert body["result_text"] == "जोहार"
    assert body["confidence"] == 1.0
    assert body["confidence_label"] == "high"
    assert body["verified"] is True
    assert body["ai_assisted"] is False


def test_punctuation_and_whitespace_are_normalized(client):
    response = client.post("/api/translations", json={
        "text": "  आप कैसे हैं?? ",
        "source_language": "hi",
        "target_language": "mundari",
    })
    body = response.json()
    assert body["result_text"] == "आम चिलेका मेना मा?"
    assert body["method"] in ("exact", "fuzzy")


def test_unknown_phrase_returns_honest_no_match(client):
    response = client.post("/api/translations", json={
        "text": "यह एक बहुत ही असामान्य वाक्य है जो डेटासेट में नहीं है",
        "source_language": "hi",
        "target_language": "mundari",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["method"] == "none"
    assert body["result_text"] is None
    assert "No verified match" in body["message"]


def test_empty_text_is_rejected_gracefully(client):
    response = client.post("/api/translations", json={"text": "", "source_language": "hi", "target_language": "mundari"})
    # min_length=1 on the schema -> FastAPI validation error, not a 500
    assert response.status_code == 422


def test_unknown_language_pair(client):
    response = client.post("/api/translations", json={
        "text": "नमस्ते",
        "source_language": "hi",
        "target_language": "klingon",
    })
    assert response.status_code == 200
    body = response.json()
    assert body["method"] == "none"
    assert "Unknown language pair" in body["message"]
