import duckdb
import os
from datetime import date, datetime
from app.core.config import settings

class QualityChecker:
    """
    Executes health checks and quality audits on the analytics datasets.
    """
    def __init__(self, db_path: str = str(settings.duckdb_path)):
        self.db_path = db_path

    def _get_conn(self):
        return duckdb.connect(self.db_path, read_only=True)

    def run_checks(self):
        if not os.path.exists(self.db_path):
            return {"status": "error", "message": "Database not found"}

        checks = []
        
        try:
            with self._get_conn() as conn:
                # 1. Freshness Check for Events
                last_event = conn.execute("SELECT MAX(event_date) FROM events").fetchone()[0]
                if isinstance(last_event, datetime):
                    last_event_date = last_event.date()
                elif isinstance(last_event, date):
                    last_event_date = last_event
                else:
                    last_event_date = None

                is_fresh = (datetime.now().date() - last_event_date).days <= 1 if last_event_date else False
                checks.append({
                    "target": "events",
                    "check": "freshness",
                    "status": "passed" if is_fresh else "warning",
                    "value": str(last_event_date or last_event),
                    "message": "Data is up to date" if is_fresh else "Data is more than 24h old"
                })

                # 2. Null Check for Subscriptions user_id
                null_subs = conn.execute("SELECT COUNT(*) FROM subscriptions WHERE user_id IS NULL").fetchone()[0]
                checks.append({
                    "target": "subscriptions",
                    "check": "completeness",
                    "status": "passed" if null_subs == 0 else "failed",
                    "value": null_subs,
                    "message": f"Found {null_subs} null user_ids" if null_subs > 0 else "No null values in keys"
                })

                # 3. Volume Check
                user_count = conn.execute("SELECT COUNT(*) FROM users").fetchone()[0]
                checks.append({
                    "target": "users",
                    "check": "volume",
                    "status": "passed" if user_count > 1000 else "warning",
                    "value": user_count,
                    "message": "User volume healthy" if user_count > 1000 else "Unexpectedly low user volume"
                })

        except Exception as e:
            return {"status": "error", "message": str(e)}

        return {
            "status": "ok",
            "last_run": datetime.now().isoformat(),
            "checks": checks
        }

quality_checker = QualityChecker()
