# TheLaaw

Nigerian legal rights companion. 5-agent Claude pipeline — Intake → Research → Reasoning → Drafting, with Escalation running in parallel.

## Stack

| Layer | Tech |
|---|---|
| Backend | FastAPI (Python) |
| AI | Anthropic Claude API (Opus 4.7 + Haiku 4.5) |
| Vector DB | ChromaDB (Pinecone-ready) |
| Voice | YarnGPT2b |
| Frontend | Next.js 15 + Tailwind CSS |
| PDF | WeasyPrint |

## Repo Structure

```
thelaaw/
├── backend/
│   ├── agents/         # 5 Claude agents
│   │   ├── intake.py
│   │   ├── research.py
│   │   ├── reasoning.py
│   │   ├── drafting.py
│   │   └── escalation.py
│   ├── tools/
│   │   ├── search_statutes.py
│   │   └── pdf_generator.py
│   ├── data/           # chunked statute JSON (gitignored except .gitkeep)
│   ├── orchestrator.py
│   ├── main.py
│   └── requirements.txt
├── frontend/           # Next.js app
│   └── src/
│       ├── app/
│       └── components/
├── statutes/           # raw statute source files
└── .env.example
```

## Setup

```bash
# Backend
cd backend
python -m venv .venv
source .venv/bin/activate  # or .venv\Scripts\activate on Windows
pip install -r requirements.txt

# Frontend
cd frontend
npm install

# Environment
cp .env.example .env
# Fill in ANTHROPIC_API_KEY
```

## Running

```bash
# Backend
cd backend && uvicorn main:app --reload --port 8000

# Frontend
cd frontend && npm run dev
```

## Agent Pipeline

```
User input
    │
    ▼
Intake Agent (Haiku)        ← classifies domain, extracts facts
    │
    ▼
Research Agent (Haiku)      ← queries vector DB, returns statute citations
    │              │
    ▼              ▼
Reasoning Agent (Opus)   Escalation Agent (Haiku) ← runs in parallel
    │
    ▼
Drafting Agent (Opus)       ← produces formal legal document (PDF)
```

MVP covers: tenancy domain, Lagos State + federal jurisdiction.
