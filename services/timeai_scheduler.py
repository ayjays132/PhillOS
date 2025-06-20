import sys
import json
import random
from datetime import datetime, timedelta


def smart_slot(payload: dict) -> dict:
    tasks = payload.get("tasks", [])
    base = datetime.now() + timedelta(days=1)
    slot = base.replace(hour=9, minute=0, second=0, microsecond=0)
    return {"slot": slot.isoformat(), "tasks": tasks}


def reschedule(payload: dict) -> dict:
    events = payload.get("events", [])
    random.shuffle(events)
    return {"events": events}


if __name__ == "__main__":
    if len(sys.argv) < 3:
        print("{}")
        sys.exit(0)
    action = sys.argv[1]
    data = json.loads(sys.argv[2])
    if action == "smart_slot":
        result = smart_slot(data)
    elif action == "reschedule":
        result = reschedule(data)
    else:
        result = {}
    print(json.dumps(result))
