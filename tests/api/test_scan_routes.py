"""API tests for /v1/scan, /v1/challenge, /v1/sync."""


async def test_scan_requires_auth(client, adult_dl):
    resp = await client.post("/v1/scan", json={"barcode_data": adult_dl})
    assert resp.status_code == 401


async def test_scan_rejects_bad_token(client, adult_dl):
    resp = await client.post(
        "/v1/scan",
        json={"barcode_data": adult_dl},
        headers={"Authorization": "Bearer not-a-real-key"},
    )
    assert resp.status_code == 401


async def test_scan_adult_returns_allow(client, auth_headers, adult_dl):
    resp = await client.post("/v1/scan", json={"barcode_data": adult_dl}, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["result"] == "ALLOW"
    assert body["is_valid_age"] is True
    assert body["state"] == "TX"
    assert body["scan_id"]


async def test_scan_returns_physical_descriptors(client, auth_headers, adult_dl):
    resp = await client.post("/v1/scan", json={"barcode_data": adult_dl}, headers=auth_headers)
    body = resp.json()
    # Height / eye color / sex come straight off the AAMVA barcode.
    assert body["height"] == "070 in"
    assert body["eye_color"] == "BRO"
    assert body["sex"] == "M"


async def test_scan_underage_returns_deny(client, auth_headers, underage_dl):
    resp = await client.post("/v1/scan", json={"barcode_data": underage_dl}, headers=auth_headers)
    body = resp.json()
    assert body["result"] == "DENY"
    assert any(f["code"] == "UNDERAGE" for f in body["flags"])


async def test_scan_manual_method_adds_penalty(client, auth_headers, adult_dl):
    resp = await client.post(
        "/v1/scan",
        json={"barcode_data": adult_dl, "scan_method": "manual"},
        headers=auth_headers,
    )
    body = resp.json()
    assert any(f["code"] == "MANUAL_ENTRY" for f in body["flags"])
    assert body["risk_score"] >= 15


async def test_scan_passport_via_mrz(client, auth_headers, valid_passport_td3):
    resp = await client.post(
        "/v1/scan",
        json={"barcode_data": valid_passport_td3, "document_input_type": "MRZ"},
        headers=auth_headers,
    )
    body = resp.json()
    assert body["document_type"] == "US_PASSPORT"
    assert body["result"] == "ALLOW"


async def test_structured_adult_is_allow(client, auth_headers):
    body = {
        "document_type": "US_DRIVERS_LICENSE",
        "first_name": "JOHN", "last_name": "DOE",
        "date_of_birth": "1990-01-15", "expiration_date": "2035-01-15",
        "sex": "M", "height": "070 in", "eye_color": "BRO",
        "document_number": "12345678", "address_state": "TX", "postal_code": "75001",
        "data_match": True,
    }
    resp = await client.post("/v1/scan/structured", json=body, headers=auth_headers)
    assert resp.status_code == 200
    j = resp.json()
    assert j["result"] == "ALLOW"
    assert j["age"] == 36 or j["age"] is not None
    assert j["name"] == "JOHN DOE"
    assert j["height"] == "070 in"


async def test_structured_tamper_flags_data_mismatch(client, auth_headers):
    body = {
        "document_type": "US_DRIVERS_LICENSE",
        "first_name": "JANE", "last_name": "ROE",
        "date_of_birth": "1992-03-03", "expiration_date": "2035-03-03",
        "document_number": "87654321", "address_state": "TX",
        "data_match": False,
    }
    resp = await client.post("/v1/scan/structured", json=body, headers=auth_headers)
    j = resp.json()
    assert any(f["code"] == "DATA_MISMATCH" for f in j["flags"])


async def test_structured_underage_is_deny(client, auth_headers):
    body = {
        "document_type": "US_DRIVERS_LICENSE",
        "first_name": "KID", "last_name": "YOUNG",
        "date_of_birth": "2010-06-01", "expiration_date": "2035-06-01",
        "document_number": "11112222", "address_state": "TX", "data_match": True,
    }
    resp = await client.post("/v1/scan/structured", json=body, headers=auth_headers)
    j = resp.json()
    assert j["result"] == "DENY"
    assert any(f["code"] == "UNDERAGE" for f in j["flags"])


async def test_challenge_updates_decision(client, auth_headers, adult_dl):
    scan = (
        await client.post("/v1/scan", json={"barcode_data": adult_dl}, headers=auth_headers)
    ).json()
    resp = await client.post(
        "/v1/challenge",
        json={"scan_id": scan["scan_id"], "failures": 3},
        headers=auth_headers,
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["failures"] == 3
    assert body["result"] == "REVIEW"
    assert body["risk_score"] == 60


async def test_challenge_unknown_scan_is_404(client, auth_headers):
    resp = await client.post(
        "/v1/challenge",
        json={"scan_id": "00000000-0000-0000-0000-000000000000", "failures": 1},
        headers=auth_headers,
    )
    assert resp.status_code == 404


async def test_sync_batch(client, auth_headers, adult_dl, underage_dl):
    records = [
        {"barcode_data": adult_dl, "client_timestamp": "2026-01-01T22:00:00Z"},
        {"barcode_data": underage_dl, "client_timestamp": "2026-01-01T22:05:00Z"},
    ]
    resp = await client.post("/v1/sync", json=records, headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["synced"] == 2
    assert len(body["results"]) == 2


async def test_sync_rejects_oversized_batch(client, auth_headers, adult_dl):
    records = [{"barcode_data": adult_dl}] * 501
    resp = await client.post("/v1/sync", json=records, headers=auth_headers)
    assert resp.status_code == 413
