"""Integration tests for notification preferences and push tokens."""


def signup(client) -> dict[str, str]:
    response = client.post(
        "/api/v1/auth/signup",
        json={
            "first_name": "Notify",
            "last_name": "Tester",
            "email": "notify@example.com",
            "password": "Password123",
        },
    )
    token = response.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}


def test_get_notification_preferences_creates_defaults(client):
    headers = signup(client)

    response = client.get("/api/v1/users/me/notifications/preferences", headers=headers)
    assert response.status_code == 200
    body = response.json()
    assert body["enabled"] is True
    assert body["window_times"] is not None
    assert "morning_fasted" in body["window_times"]
    assert body["enabled_windows"] is not None
    assert len(body["enabled_windows"]) == 6
    assert body["streak_reminders"] is True
    assert body["refill_reminders"] is True
    assert body["interaction_alerts"] is True


def test_update_notification_preferences(client):
    headers = signup(client)

    # First get to create defaults
    client.get("/api/v1/users/me/notifications/preferences", headers=headers)

    # Update some fields
    response = client.put(
        "/api/v1/users/me/notifications/preferences",
        headers=headers,
        json={
            "enabled": False,
            "quiet_start": "22:00",
            "quiet_end": "07:00",
            "advance_minutes": 15,
            "streak_reminders": False,
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert body["enabled"] is False
    assert body["quiet_start"] == "22:00"
    assert body["quiet_end"] == "07:00"
    assert body["advance_minutes"] == 15
    assert body["streak_reminders"] is False
    # Unmodified fields should keep defaults
    assert body["refill_reminders"] is True
    assert body["interaction_alerts"] is True


def test_update_notification_preferences_partial(client):
    headers = signup(client)

    # Only update enabled_windows
    response = client.put(
        "/api/v1/users/me/notifications/preferences",
        headers=headers,
        json={
            "enabled_windows": ["morning_fasted", "bedtime"],
        },
    )
    assert response.status_code == 200
    body = response.json()
    assert set(body["enabled_windows"]) == {"morning_fasted", "bedtime"}
    assert body["enabled"] is True  # default preserved


def test_update_notification_preferences_validates_time_format(client):
    headers = signup(client)

    response = client.put(
        "/api/v1/users/me/notifications/preferences",
        headers=headers,
        json={"quiet_start": "invalid"},
    )
    assert response.status_code == 422


def test_register_push_token(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={
            "token": "ExponentPushToken[test123abc]",
            "platform": "ios",
            "device_id": "device-001",
        },
    )
    assert response.status_code == 201
    body = response.json()
    assert body["token"] == "ExponentPushToken[test123abc]"
    assert body["platform"] == "ios"
    assert body["is_active"] is True


def test_register_push_token_idempotent(client):
    headers = signup(client)

    # Register same token twice
    for _ in range(2):
        client.post(
            "/api/v1/users/me/notifications/push-tokens",
            headers=headers,
            json={"token": "ExponentPushToken[dup123]", "platform": "ios"},
        )

    # Should only have one active token
    response = client.get("/api/v1/users/me/notifications/push-tokens", headers=headers)
    assert response.status_code == 200
    tokens = response.json()
    active = [t for t in tokens if t["is_active"]]
    assert len(active) == 1


def test_register_push_token_replaces_old_device_token(client):
    headers = signup(client)

    # Register first token for device
    client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[old]", "platform": "ios", "device_id": "device-A"},
    )

    # Register new token for same device
    client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[new]", "platform": "ios", "device_id": "device-A"},
    )

    response = client.get("/api/v1/users/me/notifications/push-tokens", headers=headers)
    tokens = response.json()
    active = [t for t in tokens if t["is_active"]]
    assert len(active) == 1
    assert active[0]["token"] == "ExponentPushToken[new]"


def test_list_push_tokens(client):
    headers = signup(client)

    client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[list1]", "platform": "ios"},
    )
    client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[list2]", "platform": "android"},
    )

    response = client.get("/api/v1/users/me/notifications/push-tokens", headers=headers)
    assert response.status_code == 200
    assert len(response.json()) == 2


def test_remove_push_token(client):
    headers = signup(client)

    token_value = "ExponentPushToken[remove123]"
    client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": token_value, "platform": "ios"},
    )

    # Remove it
    response = client.delete(
        f"/api/v1/users/me/notifications/push-tokens/{token_value}",
        headers=headers,
    )
    assert response.status_code == 204

    # Should be gone from active list
    response = client.get("/api/v1/users/me/notifications/push-tokens", headers=headers)
    assert len(response.json()) == 0


def test_remove_push_token_not_found(client):
    headers = signup(client)

    response = client.delete(
        "/api/v1/users/me/notifications/push-tokens/ExponentPushToken[nonexistent]",
        headers=headers,
    )
    assert response.status_code == 404


def test_get_reminder_schedule(client):
    headers = signup(client)

    response = client.get(
        "/api/v1/users/me/notifications/reminders",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert "date" in body
    assert "reminders" in body
    assert isinstance(body["reminders"], list)


def test_get_reminder_schedule_with_date(client):
    headers = signup(client)

    response = client.get(
        "/api/v1/users/me/notifications/reminders?target_date=2026-04-11",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["date"] == "2026-04-11"


def test_get_reminder_schedule_disabled(client):
    headers = signup(client)

    # Disable notifications
    client.put(
        "/api/v1/users/me/notifications/preferences",
        headers=headers,
        json={"enabled": False},
    )

    response = client.get(
        "/api/v1/users/me/notifications/reminders",
        headers=headers,
    )
    assert response.status_code == 200
    body = response.json()
    assert body["reminders"] == []
