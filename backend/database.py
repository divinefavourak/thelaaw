import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

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
        "SELECT extracted_facts, history, session_state FROM cases WHERE phone_number = ?",
        (phone_number,)
    )
    row = cursor.fetchone()
    conn.close()

    if row:
        return {
            "extracted_facts": json.loads(row[0]) if row[0] else {},
            "history": json.loads(row[1]) if row[1] else [],
            "session_state": json.loads(row[2]) if row[2] else _default_session(),
        }
    return {"extracted_facts": {}, "history": [], "session_state": _default_session()}

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
