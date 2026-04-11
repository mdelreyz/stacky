import asyncio

from app.database import async_session_factory
from app.models.peptide import Peptide, PeptideCategory


def auth_headers(client, email: str = "userpeptide@example.com"):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Peptide",
            "last_name": "User",
            "email": email,
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_peptide(name: str, category: PeptideCategory = PeptideCategory.research):
    async def _create():
        async with async_session_factory() as session:
            peptide = Peptide(name=name, category=category)
            session.add(peptide)
            await session.commit()
            await session.refresh(peptide)
            return str(peptide.id)

    return asyncio.run(_create())


def add_payload(peptide_id: str) -> dict:
    return {
        "peptide_id": peptide_id,
        "dosage_amount": 250,
        "dosage_unit": "mcg",
        "frequency": "daily",
        "take_window": "morning_fasted",
        "with_food": False,
        "route": "subcutaneous",
        "storage_notes": "Keep refrigerated",
        "notes": "Rotate injection sites",
        "started_at": "2026-04-11",
    }


# ── CRUD ─────────────────────────────────────────────────────────────


def test_add_user_peptide(client):
    headers = auth_headers(client)
    peptide_id = create_peptide("BPC-157", PeptideCategory.recovery)

    response = client.post(
        "/api/v1/users/me/peptides",
        json=add_payload(peptide_id),
        headers=headers,
    )
    assert response.status_code == 201
    body = response.json()
    assert body["peptide"]["name"] == "BPC-157"
    assert body["dosage_amount"] == 250
    assert body["dosage_unit"] == "mcg"
    assert body["route"] == "subcutaneous"
    assert body["storage_notes"] == "Keep refrigerated"
    assert body["is_active"] is True


def test_get_user_peptide(client):
    headers = auth_headers(client)
    peptide_id = create_peptide("TB-500")

    create_response = client.post(
        "/api/v1/users/me/peptides",
        json=add_payload(peptide_id),
        headers=headers,
    )
    user_peptide_id = create_response.json()["id"]

    response = client.get(f"/api/v1/users/me/peptides/{user_peptide_id}", headers=headers)
    assert response.status_code == 200
    assert response.json()["peptide"]["name"] == "TB-500"


def test_list_user_peptides(client):
    headers = auth_headers(client)
    p1 = create_peptide("BPC-157")
    p2 = create_peptide("TB-500")

    client.post("/api/v1/users/me/peptides", json=add_payload(p1), headers=headers)
    client.post("/api/v1/users/me/peptides", json=add_payload(p2), headers=headers)

    response = client.get("/api/v1/users/me/peptides", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 2
    names = {item["peptide"]["name"] for item in body["items"]}
    assert names == {"BPC-157", "TB-500"}


def test_update_user_peptide(client):
    headers = auth_headers(client)
    peptide_id = create_peptide("BPC-157")

    create_response = client.post(
        "/api/v1/users/me/peptides",
        json=add_payload(peptide_id),
        headers=headers,
    )
    user_peptide_id = create_response.json()["id"]

    response = client.patch(
        f"/api/v1/users/me/peptides/{user_peptide_id}",
        json={"dosage_amount": 500, "route": "intramuscular", "notes": "Updated notes"},
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["dosage_amount"] == 500
    assert body["route"] == "intramuscular"
    assert body["notes"] == "Updated notes"


def test_remove_user_peptide(client):
    headers = auth_headers(client)
    peptide_id = create_peptide("GHK-Cu")

    create_response = client.post(
        "/api/v1/users/me/peptides",
        json=add_payload(peptide_id),
        headers=headers,
    )
    user_peptide_id = create_response.json()["id"]

    delete_response = client.delete(
        f"/api/v1/users/me/peptides/{user_peptide_id}",
        headers=headers,
    )
    assert delete_response.status_code == 204

    # Should not appear in active list
    list_response = client.get("/api/v1/users/me/peptides", headers=headers)
    assert list_response.json()["total"] == 0


# ── Duplicate prevention ─────────────────────────────────────────────


def test_add_duplicate_peptide_rejected(client):
    headers = auth_headers(client)
    peptide_id = create_peptide("BPC-157")

    payload = add_payload(peptide_id)
    first = client.post("/api/v1/users/me/peptides", json=payload, headers=headers)
    assert first.status_code == 201

    second = client.post("/api/v1/users/me/peptides", json=payload, headers=headers)
    assert second.status_code == 409
    assert "already active" in second.json()["detail"].lower()


# ── IDOR protection ──────────────────────────────────────────────────


def test_cannot_access_other_users_peptide(client):
    headers_a = auth_headers(client, email="userA_pep@example.com")
    headers_b = auth_headers(client, email="userB_pep@example.com")
    peptide_id = create_peptide("BPC-157")

    create_response = client.post(
        "/api/v1/users/me/peptides",
        json=add_payload(peptide_id),
        headers=headers_a,
    )
    user_peptide_id = create_response.json()["id"]

    # User B should not see User A's peptide
    response = client.get(f"/api/v1/users/me/peptides/{user_peptide_id}", headers=headers_b)
    assert response.status_code == 404


# ── Invalid data ─────────────────────────────────────────────────────


def test_add_peptide_with_invalid_catalog_id(client):
    headers = auth_headers(client)
    fake_id = "00000000-0000-0000-0000-000000000000"
    payload = add_payload(fake_id)
    response = client.post("/api/v1/users/me/peptides", json=payload, headers=headers)
    assert response.status_code == 404


def test_add_peptide_with_zero_dosage_rejected(client):
    headers = auth_headers(client)
    peptide_id = create_peptide("BPC-157")
    payload = add_payload(peptide_id)
    payload["dosage_amount"] = 0
    response = client.post("/api/v1/users/me/peptides", json=payload, headers=headers)
    assert response.status_code == 422


# ── Auth requirement ─────────────────────────────────────────────────


def test_user_peptides_requires_auth(client):
    response = client.get("/api/v1/users/me/peptides")
    assert response.status_code in (401, 403, 422)
