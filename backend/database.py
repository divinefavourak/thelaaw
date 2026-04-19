import sqlite3
import json
import os
from typing import Dict, Any, List, Optional
from datetime import datetime, timedelta

DB_PATH = os.getenv("DATABASE_PATH", "backend/data/thelaaw.db")

def init_db():
    os.makedirs(os.path.dirname(DB_PATH), exist_ok=True)
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS cases (
            phone_number TEXT PRIMARY KEY,
            extracted_facts TEXT,
            history TEXT,
            session_state TEXT,
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    # Add session_state column if upgrading from old schema
    try:
        cursor.execute("ALTER TABLE cases ADD COLUMN session_state TEXT")
    except sqlite3.OperationalError:
        pass  # column already exists
    conn.commit()
    conn.close()

def get_case(phone_number: str) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute(
        "SELECT extracted_facts, history, session_state, last_updated FROM cases WHERE phone_number = ?",
        (phone_number,)
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "extracted_facts": json.loads(row[0]) if row[0] else {},
            "history": json.loads(row[1]) if row[1] else [],
            "session_state": json.loads(row[2]) if row[2] else _default_session(),
            "last_updated": row[3],
        }
    return {"extracted_facts": {}, "history": [], "session_state": _default_session(), "last_updated": None}


def reset_session_if_stale(phone_number: str, case_data: Dict[str, Any], hours: int = 24) -> Dict[str, Any]:
    """Reset session state if the case has been inactive for more than `hours` hours."""
    last_updated = case_data.get("last_updated")
    if last_updated:
        try:
            last_dt = datetime.strptime(last_updated, "%Y-%m-%d %H:%M:%S")
            if datetime.utcnow() - last_dt > timedelta(hours=hours):
                case_data["session_state"] = _default_session()
                case_data["history"] = []
        except (ValueError, TypeError):
            pass
    return case_data

def update_case(
    phone_number: str,
    extracted_facts: Dict[str, Any],
    history: List[Dict[str, str]],
    session_state: Optional[Dict[str, Any]] = None,
):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO cases (phone_number, extracted_facts, history, session_state, last_updated)
        VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(phone_number) DO UPDATE SET
            extracted_facts = excluded.extracted_facts,
            history = excluded.history,
            session_state = excluded.session_state,
            last_updated = excluded.last_updated
    """, (
        phone_number,
        json.dumps(extracted_facts),
        json.dumps(history),
        json.dumps(session_state or _default_session()),
    ))
    conn.commit()
    conn.close()

def _default_session() -> Dict[str, Any]:
    return {
        "stage": "greeting",          # greeting|intake|analysis|waiting_pdf_confirm|complete
        "questions_asked": [],        # questions already sent so we never repeat them
        "pending_for": None,          # what we're waiting on: "pdf_confirm" | None
        "intents_queued": [],         # e.g. ["analysis", "draft"] — resolved one turn at a time
    }
