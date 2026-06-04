"""API tests for /v1/metrics."""


async def _scan(client, headers, barcode):
    return await client.post("/v1/scan", json={"barcode_data": barcode}, headers=headers)


async def test_metrics_requires_auth(client):
    resp = await client.get("/v1/metrics")
    assert resp.status_code == 401


async def test_metrics_empty(client, auth_headers):
    resp = await client.get("/v1/metrics", headers=auth_headers)
    assert resp.status_code == 200
    body = resp.json()
    assert body["total_scans"] == 0
    assert body["allow"] == 0


async def test_metrics_counts_total(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    await _scan(client, auth_headers, adult_dl)
    body = (await client.get("/v1/metrics", headers=auth_headers)).json()
    assert body["total_scans"] == 2


async def test_metrics_by_result(client, auth_headers, adult_dl, underage_dl):
    await _scan(client, auth_headers, adult_dl)
    await _scan(client, auth_headers, underage_dl)
    body = (await client.get("/v1/metrics", headers=auth_headers)).json()
    assert body["allow"] == 1
    assert body["deny"] == 1
    assert body["by_result"]["ALLOW"] == 1


async def test_metrics_underage_blocked(client, auth_headers, underage_dl):
    await _scan(client, auth_headers, underage_dl)
    body = (await client.get("/v1/metrics", headers=auth_headers)).json()
    assert body["underage_blocked"] == 1


async def test_metrics_period_today(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    body = (await client.get("/v1/metrics", params={"period": "today"}, headers=auth_headers)).json()
    assert body["period"] == "today"
    assert body["total_scans"] == 1


async def test_metrics_period_custom_days(client, auth_headers, adult_dl):
    await _scan(client, auth_headers, adult_dl)
    body = (await client.get("/v1/metrics", params={"period": "7d"}, headers=auth_headers)).json()
    assert body["total_scans"] == 1
    assert body["by_state"].get("TX") == 1
