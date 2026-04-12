"""Dispatch due reminder notifications for users with active Expo push tokens.

Usage:
    python -m scripts.send_due_notifications
    python -m scripts.send_due_notifications --at 2026-04-11T18:25:00+00:00
    python -m scripts.send_due_notifications --lookback-minutes 10
"""

import argparse
import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent.parent))

from app.services.notifications import dispatch_due_reminders_sync


def main() -> None:
    parser = argparse.ArgumentParser(description="Dispatch due scheduled reminder notifications")
    parser.add_argument("--at", type=str, default=None, help="Dispatch timestamp in ISO-8601 format")
    parser.add_argument("--lookback-minutes", type=int, default=None, help="Reminder lookback window in minutes")
    args = parser.parse_args()

    result = dispatch_due_reminders_sync(
        dispatch_at_iso=args.at,
        lookback_minutes=args.lookback_minutes,
    )
    print(json.dumps(result, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
