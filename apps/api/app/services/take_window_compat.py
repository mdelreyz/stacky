from sqlalchemy import inspect, text

from app.database import async_session_factory
from app.models.enums import TakeWindow, normalize_take_window, take_window_requires_food

_USER_ITEM_TABLES = (
    ("user_supplements", TakeWindow.morning_with_food, True),
    ("user_medications", TakeWindow.morning_with_food, True),
    ("user_therapies", TakeWindow.morning_fasted, False),
    ("user_peptides", TakeWindow.morning_fasted, True),
)


async def _table_exists(session, table_name: str) -> bool:
    connection = await session.connection()
    return await connection.run_sync(lambda sync_conn: inspect(sync_conn).has_table(table_name))


async def normalize_legacy_take_window_data() -> None:
    changed = False

    async with async_session_factory() as session:
        for table_name, fallback, has_with_food in _USER_ITEM_TABLES:
            if not await _table_exists(session, table_name):
                continue

            column_list = "id, take_window, with_food" if has_with_food else "id, take_window"
            rows = (await session.execute(text(f"SELECT {column_list} FROM {table_name}"))).mappings().all()

            for row in rows:
                raw_value = row["take_window"]
                normalized = normalize_take_window(raw_value, fallback=fallback)
                if normalized is None:
                    continue

                updates: dict[str, object] = {}
                if raw_value != normalized.value:
                    updates["take_window"] = normalized.value
                if has_with_food and take_window_requires_food(raw_value, fallback=normalized) and not row["with_food"]:
                    updates["with_food"] = True

                if not updates:
                    continue

                assignments = ", ".join(f"{column} = :{column}" for column in updates)
                await session.execute(
                    text(f"UPDATE {table_name} SET {assignments} WHERE id = :id"),
                    {"id": row["id"], **updates},
                )
                changed = True

        if await _table_exists(session, "adherence_logs"):
            snapshot_rows = (
                await session.execute(
                    text("SELECT id, take_window_snapshot FROM adherence_logs WHERE take_window_snapshot IS NOT NULL")
                )
            ).mappings().all()
            for row in snapshot_rows:
                raw_value = row["take_window_snapshot"]
                normalized = normalize_take_window(raw_value)
                if normalized is None or raw_value == normalized.value:
                    continue

                await session.execute(
                    text("UPDATE adherence_logs SET take_window_snapshot = :take_window_snapshot WHERE id = :id"),
                    {"id": row["id"], "take_window_snapshot": normalized.value},
                )
                changed = True

        if changed:
            await session.commit()
