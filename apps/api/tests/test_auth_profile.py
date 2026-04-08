def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Profile",
            "last_name": "Tester",
            "email": "profile@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_update_profile_location_and_timezone(client):
    headers = signup(client)

    response = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={
            "timezone": "Europe/Berlin",
            "location_name": "Barcelona",
            "latitude": 41.3874,
            "longitude": 2.1686,
        },
    )

    assert response.status_code == 200
    body = response.json()
    assert body["timezone"] == "Europe/Berlin"
    assert body["location_name"] == "Barcelona"
    assert body["latitude"] == 41.3874
    assert body["longitude"] == 2.1686


def test_update_profile_requires_latitude_and_longitude_together(client):
    headers = signup(client)

    response = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"latitude": 41.3874},
    )

    assert response.status_code == 422
