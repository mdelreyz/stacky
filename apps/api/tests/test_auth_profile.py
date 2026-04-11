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


# ---- Change password tests ----


def test_change_password_success(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "Password123", "new_password": "NewPassword456"},
    )
    assert response.status_code == 200
    assert response.json()["message"] == "Password changed successfully"

    # Old password should no longer work
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "profile@example.com", "password": "Password123"},
    )
    assert response.status_code == 401

    # New password should work
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "profile@example.com", "password": "NewPassword456"},
    )
    assert response.status_code == 200


def test_change_password_wrong_current(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "WrongPassword99", "new_password": "NewPassword456"},
    )
    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


def test_change_password_weak_new_password(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/auth/change-password",
        headers=headers,
        json={"current_password": "Password123", "new_password": "weak"},
    )
    assert response.status_code == 422


def test_change_password_requires_auth(client):
    response = client.post(
        "/api/v1/auth/change-password",
        json={"current_password": "Password123", "new_password": "NewPassword456"},
    )
    assert response.status_code in (401, 403, 422)


# ---- Delete account tests ----


def _signup_deletable(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Delete",
            "last_name": "Me",
            "email": "deleteme@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_delete_account_success(client):
    headers = _signup_deletable(client)

    response = client.request(
        "DELETE",
        "/api/v1/auth/me",
        headers=headers,
        json={"password": "Password123"},
    )
    assert response.status_code == 200
    assert "deleted" in response.json()["message"].lower()

    # Can no longer log in
    response = client.post(
        "/api/v1/auth/login",
        json={"email": "deleteme@example.com", "password": "Password123"},
    )
    assert response.status_code == 401


def test_delete_account_wrong_password(client):
    headers = _signup_deletable(client)

    response = client.request(
        "DELETE",
        "/api/v1/auth/me",
        headers=headers,
        json={"password": "WrongPassword99"},
    )
    assert response.status_code == 400
    assert "incorrect" in response.json()["detail"].lower()


def test_delete_account_requires_auth(client):
    response = client.request(
        "DELETE",
        "/api/v1/auth/me",
        json={"password": "Password123"},
    )
    assert response.status_code in (401, 403, 422)
