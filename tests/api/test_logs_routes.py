"""API tests for /v1/logs and /v1/logs/export."""


async def _scan(client, headers, barcode):
    return await client.post("/v1/scan", json={"barcode_data": barcode}, headers=headers)


async def test_logs_requires_auth(client):
    resp = await client.get("/v1/logs")
    assert resp.status_code == 401


async def test_logs_empty_initially(client, auth_headers):
    resp = await client.get("/v1/logs", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["items"] == []


async def test_logs_returns_scan(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    resp = await client.get("/v1/logs", headers=auth_headers)
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["result"] == "ALLOW"
    assert items[0]["state"] == "TX"


async def test_logs_filter_by_decision(client, auth_headers, adult_dl, underage_dl):
    await _scan(client, auth_headers, adult_dl)
    await _scan(client, auth_headers, underage_dl)
    resp = await client.get("/v1/logs", params={"decision": "DENY"}, headers=auth_headers)
    items = resp.json()["items"]
    assert len(items) == 1
    assert items[0]["result"] == "DENY"


async def test_logs_filter_by_state(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    resp = await client.get("/v1/logs", params={"state": "TX"}, headers=auth_headers)
    assert len(resp.json()["items"]) == 1
    resp_ga = await client.get("/v1/logs", params={"state": "GA"}, headers=auth_headers)
    assert resp_ga.json()["items"] == []


async def test_logs_pagination(client, auth_headers, adult_dl):
    for _ in range(3):
        await _scan(client, auth_headers, adult_dl)
    resp = await client.get("/v1/logs", params={"limit": 2, "offset": 0}, headers=auth_headers)
    body = resp.json()
    assert body["count"] == 2
    assert body["limit"] == 2


async def test_delete_single_log(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    scan_id = (await client.get("/v1/logs", headers=auth_headers)).json()["items"][0]["scan_id"]
    resp = await client.delete(f"/v1/logs/{scan_id}", headers=auth_headers)
    assert resp.status_code == 204
    assert (await client.get("/v1/logs", headers=auth_headers)).json()["items"] == []


async def test_delete_missing_log_404(client, auth_headers):
    resp = await client.delete("/v1/logs/does-not-exist", headers=auth_headers)
    assert resp.status_code == 404


async def test_clear_all_logs(client, auth_headers, adult_dl, underage_dl):
    await _scan(client, auth_headers, adult_dl)
    await _scan(client, auth_headers, underage_dl)
    resp = await client.delete("/v1/logs", headers=auth_headers)
    assert resp.status_code == 200
    assert resp.json()["deleted"] == 2
    assert (await client.get("/v1/logs", headers=auth_headers)).json()["items"] == []


async def test_delete_log_requires_auth(client):
    assert (await client.delete("/v1/logs/x")).status_code == 401


async def test_logs_export_is_csv(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    resp = await client.get("/v1/logs/export", headers=auth_headers)
    assert resp.status_code == 200
    assert "text/csv" in resp.headers["content-type"]


async def test_logs_export_has_header_and_row(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    resp = await client.get("/v1/logs/export", headers=auth_headers)
    text = resp.text.strip().splitlines()
    assert text[0].startswith("scan_id,timestamp,result")
    assert len(text) == 2  # header + one scan
