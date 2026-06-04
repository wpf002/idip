"""API tests for health and admin (location/rules/webhook) routes."""


async def test_health_no_auth_required(client):
    resp = await client.get("/health")
    assert resp.status_code == 200
    body = resp.json()
    assert body["status"] == "ok"
    assert body["service"] == "IDIP"


async def test_create_location_returns_api_key(client):
    resp = await client.post(
        "/admin/location",
        json={"name": "The Rail", "city": "Atlanta", "state_code": "GA"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["api_key"].startswith("idip_")
    assert body["state_code"] == "GA"
    assert body["is_active"] is True


async def test_created_location_key_authenticates(client, adult_dl):
    created = (
        await client.post("/admin/location", json={"name": "Bar X", "state_code": "TX"})
    ).json()
    headers = {"Authorization": f"Bearer {created['api_key']}"}
    resp = await client.get("/v1/logs", headers=headers)
    assert resp.status_code == 200


async def test_seed_rules(client):
    resp = await client.post("/admin/seed-rules")
    assert resp.status_code == 200
    assert resp.json()["seeded"] >= 50


async def test_create_webhook(client):
    created = (
        await client.post("/admin/location", json={"name": "Club Z", "state_code": "NV"})
    ).json()
    resp = await client.post(
        f"/admin/location/{created['id']}/webhooks",
        json={"provider": "toast", "endpoint_url": "https://pos.example/hook", "secret_key": "s3cr3t"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["provider"] == "toast"
    assert body["is_active"] is True
