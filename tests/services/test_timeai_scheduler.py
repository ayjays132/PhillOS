import unittest
from datetime import datetime, timedelta

from services.timeai_scheduler import smart_slot, reschedule, reschedule_conflicts


class TimeAISchedulerTests(unittest.TestCase):
    def setUp(self):
        base = datetime.now() + timedelta(days=1)
        self.day_start = base.replace(hour=9, minute=0, second=0, microsecond=0)

    def test_smart_slot_finds_first_available_gap(self):
        tasks = ["task 30m", "another 30m"]
        events = [
            {
                "start": self.day_start.isoformat(),
                "end": (self.day_start + timedelta(hours=1)).isoformat(),
            },
            {
                "start": (self.day_start + timedelta(hours=2)).isoformat(),
                "end": (self.day_start + timedelta(hours=3)).isoformat(),
            },
        ]
        res = smart_slot({"tasks": tasks, "events": events})
        expected = self.day_start + timedelta(hours=1)
        self.assertEqual(res["slot"], expected.isoformat())

    def test_reschedule_moves_overlapping_events(self):
        events = [
            {
                "id": 1,
                "start": self.day_start.isoformat(),
                "end": (self.day_start + timedelta(hours=1)).isoformat(),
            },
            {
                "id": 2,
                "start": (self.day_start + timedelta(minutes=30)).isoformat(),
                "end": (self.day_start + timedelta(hours=1, minutes=30)).isoformat(),
            },
            {
                "id": 3,
                "start": (self.day_start + timedelta(hours=1, minutes=15)).isoformat(),
                "end": (self.day_start + timedelta(hours=2)).isoformat(),
            },
        ]
        res = reschedule({"events": events})
        ev = res["events"]
        self.assertEqual(len(ev), 3)
        self.assertEqual(ev[0]["start"], self.day_start.isoformat())
        self.assertEqual(
            ev[1]["start"],
            ev[0]["end"],
        )
        self.assertEqual(ev[2]["start"], ev[1]["end"])

    def test_reschedule_conflicts_returns_updated_times(self):
        events = [
            {
                "id": 1,
                "start": self.day_start.isoformat(),
                "end": (self.day_start + timedelta(hours=1)).isoformat(),
            },
            {
                "id": 2,
                "start": (self.day_start + timedelta(minutes=30)).isoformat(),
                "end": (self.day_start + timedelta(hours=1, minutes=30)).isoformat(),
            },
            {
                "id": 3,
                "start": (self.day_start + timedelta(hours=1, minutes=30)).isoformat(),
                "end": (self.day_start + timedelta(hours=2)).isoformat(),
            },
        ]
        res = reschedule_conflicts({"events": events})
        ev = res["events"]
        self.assertEqual(ev[1]["start"], events[0]["end"])
        self.assertEqual(ev[2]["start"], ev[1]["end"])


if __name__ == "__main__":
    unittest.main()
