"""Integration tests for data export endpoints."""


def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Export",
            "last_name": "Tester",
            "email": "export@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_export_adherence_csv_empty(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/export/adherence", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    assert "content-disposition" in response.headers
    content = response.text
    # Should have header row
    assert "date,item_type,item_name" in content


def test_export_adherence_csv_with_date_range(client):
    headers = signup(client)

    response = client.get(
        "/api/v1/users/me/export/adherence?start_date=2026-01-01&end_date=2026-12-31",
        headers=headers,
    )
    assert response.status_code == 200
    assert "text/csv" in response.headers["content-type"]


def test_export_stack_csv_empty(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/export/stack", headers=headers)
    assert response.status_code == 200
    assert response.headers["content-type"].startswith("text/csv")
    content = response.text
    assert "type,name,dosage" in content


def test_export_requires_auth(client):
    response = client.get("/api/v1/users/me/export/adherence")
    assert response.status_code in (401, 403, 422)

    response = client.get("/api/v1/users/me/export/stack")
    assert response.status_code in (401, 403, 422)
