import sqlite3
import json
import os
from typing import Dict, Any, List, Optional

# Use environment variable for the database path, default to local for dev
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
            last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)
    conn.commit()
    conn.close()

def get_case(phone_number: str) -> Dict[str, Any]:
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("SELECT extracted_facts, history FROM cases WHERE phone_number = ?", (phone_number,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            "extracted_facts": json.loads(row[0]),
            "history": json.loads(row[1])
        }
    return {"extracted_facts": {}, "history": []}

def update_case(phone_number: str, extracted_facts: Dict[str, Any], history: List[Dict[str, str]]):
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    cursor.execute("""
        INSERT INTO cases (phone_number, extracted_facts, history, last_updated)
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        ON CONFLICT(phone_number) DO UPDATE SET
            extracted_facts = excluded.extracted_facts,
            history = excluded.history,
            last_updated = excluded.last_updated
    """, (phone_number, json.dumps(extracted_facts), json.dumps(history)))
    conn.commit()
    conn.close()
