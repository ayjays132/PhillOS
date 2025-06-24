import sys
import json
import re
from datetime import datetime, timedelta


def _parse_duration(text: str) -> int:
    match = re.search(r"(\d+)\s*(h|m|min)?", text.lower())
    if not match:
        return 30
    value = int(match.group(1))
    unit = match.group(2) or "m"
    if unit.startswith("h"):
        return value * 60
    return value


def smart_slot(payload: dict) -> dict:
    tasks = payload.get("tasks", [])
    events = payload.get("events", [])

    total_minutes = sum(_parse_duration(t) for t in tasks) or 30
    events_parsed = []
    for ev in events:
        try:
            start = datetime.fromisoformat(ev["start"])
            end = datetime.fromisoformat(ev["end"])
        except Exception:
            continue
        events_parsed.append((start, end))
    events_parsed.sort(key=lambda x: x[0])

    for day in range(7):
        day_start = (datetime.now() + timedelta(days=1 + day)).replace(
            hour=9, minute=0, second=0, microsecond=0
        )
        work_end = day_start.replace(hour=17)
        candidate_start = day_start
        candidate_end = candidate_start + timedelta(minutes=total_minutes)

        for start, end in events_parsed:
            if start.date() != day_start.date():
                continue
            if candidate_end <= start:
                break
            if candidate_start < end:
                candidate_start = end
                candidate_end = candidate_start + timedelta(minutes=total_minutes)

        if candidate_end <= work_end:
            return {"slot": candidate_start.isoformat(), "tasks": tasks}

    return {"slot": day_start.isoformat(), "tasks": tasks}


def reschedule(payload: dict) -> dict:
    events = payload.get("events", [])
    parsed = []
    for ev in events:
        try:
            start = datetime.fromisoformat(ev["start"])
            end = datetime.fromisoformat(ev["end"])
        except Exception:
            continue
        parsed.append((start, end, ev))

    parsed.sort(key=lambda x: x[0])
    rescheduled = []
    for start, end, ev in parsed:
        if rescheduled:
            prev_end = datetime.fromisoformat(rescheduled[-1]["end"])
            if start < prev_end:
                duration = end - start
                start = prev_end
                end = start + duration
        rescheduled.append({**ev, "start": start.isoformat(), "end": end.isoformat()})

    return {"events": rescheduled}


def reschedule_conflicts(payload: dict) -> dict:
    """Return updated times for events after resolving overlaps."""
    result = reschedule(payload)
    updates = [
        {"id": ev.get("id"), "start": ev["start"], "end": ev["end"]}
        for ev in result.get("events", [])
    ]
    return {"events": updates}


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
    elif action == "reschedule_conflicts":
        result = reschedule_conflicts(data)
    else:
        result = {}
    print(json.dumps(result))
