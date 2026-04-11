import asyncio

from app.database import async_session_factory
from app.models.peptide import Peptide, PeptideCategory


def auth_headers(client, email: str = "peptide@example.com"):
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Peptide",
            "last_name": "Tester",
            "email": email,
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def create_peptide(
    name: str,
    category: PeptideCategory = PeptideCategory.research,
    goals: list[str] | None = None,
    ai_profile: dict | None = None,
):
    async def _create():
        async with async_session_factory() as session:
            peptide = Peptide(
                name=name,
                category=category,
                goals=goals,
                ai_profile=ai_profile,
            )
            session.add(peptide)
            await session.commit()
            await session.refresh(peptide)
            return str(peptide.id)

    return asyncio.run(_create())


def test_list_peptides_empty(client):
    headers = auth_headers(client)
    response = client.get("/api/v1/peptides", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["total"] == 0


def test_list_peptides_with_entries(client):
    headers = auth_headers(client)
    create_peptide("BPC-157", PeptideCategory.recovery, goals=["recovery"])
    create_peptide("TB-500", PeptideCategory.recovery, goals=["recovery"])
    create_peptide("GHK-Cu", PeptideCategory.cosmetic, goals=["skin"])

    response = client.get("/api/v1/peptides", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 3
    names = [item["name"] for item in body["items"]]
    assert "BPC-157" in names
    assert "TB-500" in names
    assert "GHK-Cu" in names


def test_list_peptides_search(client):
    headers = auth_headers(client)
    create_peptide("BPC-157")
    create_peptide("TB-500")

    response = client.get("/api/v1/peptides?search=BPC", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "BPC-157"


def test_list_peptides_category_filter(client):
    headers = auth_headers(client)
    create_peptide("BPC-157", PeptideCategory.recovery)
    create_peptide("GHK-Cu", PeptideCategory.cosmetic)

    response = client.get("/api/v1/peptides?category=cosmetic", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["total"] == 1
    assert body["items"][0]["name"] == "GHK-Cu"


def test_get_peptide_by_id(client):
    headers = auth_headers(client)
    peptide_id = create_peptide(
        "BPC-157",
        PeptideCategory.recovery,
        goals=["recovery", "gut_health"],
        ai_profile={"summary": "Healing peptide"},
    )

    response = client.get(f"/api/v1/peptides/{peptide_id}", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["name"] == "BPC-157"
    assert body["category"] == "recovery"
    assert body["goals"] == ["recovery", "gut_health"]
    assert body["ai_profile"]["summary"] == "Healing peptide"


def test_get_peptide_not_found(client):
    headers = auth_headers(client)
    fake_id = "00000000-0000-0000-0000-000000000000"
    response = client.get(f"/api/v1/peptides/{fake_id}", headers=headers)
    assert response.status_code == 404


def test_list_peptides_requires_auth(client):
    response = client.get("/api/v1/peptides")
    assert response.status_code in (401, 403, 422)
