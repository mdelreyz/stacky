"""Integration tests for notification preferences and push tokens."""

import asyncio
from datetime import datetime, timezone

from app.services import notifications as notifications_service


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


def test_send_test_push_skips_without_registered_device(client):
    headers = signup(client)

    response = client.post(
        "/api/v1/users/me/notifications/test-push?target_date=2026-04-11",
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "skipped"
    assert body["message"] == "Register a push-enabled device first."
    assert body["sent_count"] == 0


def test_send_test_push_dispatches_schedule_preview(client, monkeypatch):
    headers = signup(client)
    register_response = client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[test-preview]", "platform": "ios"},
    )
    assert register_response.status_code == 201

    captured_messages = []

    async def fake_compute_reminder_schedule(session, user, target_date):
        return {
            "date": target_date.isoformat(),
            "reminders": [
                {
                    "window": "evening",
                    "scheduled_time": "18:30",
                    "items_count": 1,
                    "item_names": ["Magnesium Glycinate"],
                }
            ],
            "quiet_start": None,
            "quiet_end": None,
        }

    async def fake_send_expo_push_messages(messages, *, client=None):
        captured_messages.extend(messages)
        return [{"status": "ok", "id": "ticket-1"}]

    monkeypatch.setattr(notifications_service, "compute_reminder_schedule", fake_compute_reminder_schedule)
    monkeypatch.setattr(notifications_service, "send_expo_push_messages", fake_send_expo_push_messages)

    response = client.post(
        "/api/v1/users/me/notifications/test-push?target_date=2026-04-11",
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "sent"
    assert body["reminder_count"] == 1
    assert body["sent_count"] == 1
    assert body["title"] == "Protocol reminder test"
    assert "Magnesium Glycinate" in body["body"]

    assert len(captured_messages) == 1
    assert captured_messages[0]["to"] == "ExponentPushToken[test-preview]"
    assert captured_messages[0]["channelId"] == "default"
    assert captured_messages[0]["data"]["target_date"] == "2026-04-11"
    assert captured_messages[0]["data"]["reminders"][0]["window"] == "evening"


def test_send_test_push_deactivates_invalid_device_tokens(client, monkeypatch):
    headers = signup(client)

    register_response = client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[stale-device]", "platform": "ios"},
    )
    assert register_response.status_code == 201

    async def fake_send_expo_push_messages(messages, *, client=None):
        return [{"status": "error", "details": {"error": "DeviceNotRegistered"}}]

    monkeypatch.setattr(notifications_service, "send_expo_push_messages", fake_send_expo_push_messages)

    response = client.post(
        "/api/v1/users/me/notifications/test-push?target_date=2026-04-11",
        headers=headers,
    )

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "skipped"
    assert body["sent_count"] == 0

    tokens_response = client.get("/api/v1/users/me/notifications/push-tokens", headers=headers)
    assert tokens_response.status_code == 200
    assert tokens_response.json() == []


def test_dispatch_due_reminders_batch_sends_once_per_window(client, monkeypatch):
    headers = signup(client)

    register_response = client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[scheduled-1]", "platform": "ios"},
    )
    assert register_response.status_code == 201

    captured_messages = []

    async def fake_compute_reminder_schedule(session, user, target_date):
        return {
            "date": target_date.isoformat(),
            "reminders": [
                {
                    "window": "evening",
                    "scheduled_time": "18:30",
                    "items_count": 2,
                    "item_names": ["Magnesium", "Creatine"],
                }
            ],
            "quiet_start": None,
            "quiet_end": None,
        }

    async def fake_send_expo_push_messages(messages, *, client=None):
        captured_messages.extend(messages)
        return [{"status": "ok", "id": "ticket-1"}]

    monkeypatch.setattr(notifications_service, "compute_reminder_schedule", fake_compute_reminder_schedule)
    monkeypatch.setattr(notifications_service, "send_expo_push_messages", fake_send_expo_push_messages)

    dispatch_at = datetime(2026, 4, 11, 18, 25, tzinfo=timezone.utc)
    first = asyncio.run(
        notifications_service.dispatch_due_reminders_batch(dispatch_at=dispatch_at, lookback_minutes=5)
    )
    second = asyncio.run(
        notifications_service.dispatch_due_reminders_batch(dispatch_at=dispatch_at, lookback_minutes=5)
    )

    assert first["users_notified"] == 1
    assert first["windows_delivered"] == 1
    assert first["device_notifications_sent"] == 1
    assert second["users_notified"] == 0
    assert second["windows_delivered"] == 0
    assert len(captured_messages) == 1
    assert captured_messages[0]["title"] == "Evening protocol reminder"


def test_dispatch_due_reminders_batch_uses_user_timezone(client, monkeypatch):
    headers = signup(client)
    update_response = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"timezone": "America/New_York"},
    )
    assert update_response.status_code == 200

    register_response = client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[scheduled-nyc]", "platform": "ios"},
    )
    assert register_response.status_code == 201

    captured_messages = []

    async def fake_compute_reminder_schedule(session, user, target_date):
        assert user.timezone == "America/New_York"
        return {
            "date": target_date.isoformat(),
            "reminders": [
                {
                    "window": "morning_with_food",
                    "scheduled_time": "07:30",
                    "items_count": 1,
                    "item_names": ["Vitamin D3"],
                }
            ],
            "quiet_start": None,
            "quiet_end": None,
        }

    async def fake_send_expo_push_messages(messages, *, client=None):
        captured_messages.extend(messages)
        return [{"status": "ok", "id": "ticket-nyc"}]

    monkeypatch.setattr(notifications_service, "compute_reminder_schedule", fake_compute_reminder_schedule)
    monkeypatch.setattr(notifications_service, "send_expo_push_messages", fake_send_expo_push_messages)

    dispatch_at = datetime(2026, 4, 11, 11, 25, tzinfo=timezone.utc)
    summary = asyncio.run(
        notifications_service.dispatch_due_reminders_batch(dispatch_at=dispatch_at, lookback_minutes=5)
    )

    assert summary["users_notified"] == 1
    assert len(captured_messages) == 1
    assert captured_messages[0]["data"]["windows"] == ["morning_with_food"]


def test_dispatch_due_reminders_batch_skips_quiet_hours(client, monkeypatch):
    headers = signup(client)
    update_me_response = client.patch(
        "/api/v1/auth/me",
        headers=headers,
        json={"timezone": "America/New_York"},
    )
    assert update_me_response.status_code == 200

    prefs_response = client.put(
        "/api/v1/users/me/notifications/preferences",
        headers=headers,
        json={"quiet_start": "22:00", "quiet_end": "08:00"},
    )
    assert prefs_response.status_code == 200

    register_response = client.post(
        "/api/v1/users/me/notifications/push-tokens",
        headers=headers,
        json={"token": "ExponentPushToken[quiet-hours]", "platform": "ios"},
    )
    assert register_response.status_code == 201

    captured_messages = []

    async def fake_compute_reminder_schedule(session, user, target_date):
        return {
            "date": target_date.isoformat(),
            "reminders": [
                {
                    "window": "morning_with_food",
                    "scheduled_time": "07:30",
                    "items_count": 1,
                    "item_names": ["Fish Oil"],
                }
            ],
            "quiet_start": "22:00",
            "quiet_end": "08:00",
        }

    async def fake_send_expo_push_messages(messages, *, client=None):
        captured_messages.extend(messages)
        return [{"status": "ok", "id": "ticket-quiet"}]

    monkeypatch.setattr(notifications_service, "compute_reminder_schedule", fake_compute_reminder_schedule)
    monkeypatch.setattr(notifications_service, "send_expo_push_messages", fake_send_expo_push_messages)

    dispatch_at = datetime(2026, 4, 11, 11, 25, tzinfo=timezone.utc)
    summary = asyncio.run(
        notifications_service.dispatch_due_reminders_batch(dispatch_at=dispatch_at, lookback_minutes=5)
    )

    assert summary["users_notified"] == 0
    assert summary["windows_delivered"] == 0
    assert captured_messages == []
