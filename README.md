# TheLaaw
### Claude-Powered Multi-Agent Legal Rights Assistant for Everyday Nigerians

TheLaaw gives ordinary Nigerians plain-language access to their legal rights — over **WhatsApp** or a **web interface**. Describe your situation in English, Pidgin, Yoruba, Igbo, or Hausa and get jurisdiction-aware legal analysis, relevant statute citations, and a formally drafted demand letter or complaint — in under 2 minutes.

---

## What It Does

- **Understands your situation** — extracts facts, identifies the legal domain (tenancy, labour, police conduct, family, consumer, etc.), and asks only what's needed
- **Researches Nigerian law** — queries a local ChromaDB of Nigerian statutes, grounded in real legislation (Lagos Tenancy Law 2011, Labour Act, Police Act 2020, etc.)
- **Builds a legal argument** — assesses your position (strong / moderate / weak), identifies applicable sections, and spots counter-arguments
- **Drafts formal documents** — produces properly structured demand letters, complaints, and formal responses as `.docx` files with your name, the other party's name, specific demands, and statute citations
- **Escalates when urgent** — detects violence, arrest, or <48h deadlines and surfaces verified Nigerian legal aid contacts (LACON, NBA Pro Bono, FIDA, Spaces for Change)
- **Speaks your language** — responds in whatever language you wrote in; voice input transcribed via Spitch API

---

## Architecture

### 6-Agent Pipeline (LangGraph)

```
User Message
     │
     ▼
 [Router] ─── decides which agents to run this turn
     │
     ├─── [Intake]      Extract facts, ask one clarifying question if needed
     ├─── [Escalation]  Parallel — detect urgent/dangerous situations
     ├─── [Research]    Parallel — ChromaDB vector search on Nigerian statutes
     ├─── [Reasoning]   Build legal argument, assess position strength
     ├─── [Drafting]    Generate structured .docx legal document
     └─── [Editing]     Modify an already-drafted document on request
```

**Performance optimisations:**
- Escalation + Research run in parallel (`asyncio.gather`)
- `legal_brief` and `relevant_statutes` cached in session — analysis never repeats per conversation
- All agents run on Claude Haiku (fast, cheap) — analysis turn: ~15s, drafting turn: ~10s
- ChromaDB client and LLM instances are module-level singletons (no per-request init cost)

### Delivery Channels

| Channel | How it works |
|---|---|
| **WhatsApp** | Evolution API (v2) running on Fly.io, webhook → Render backend |
| **Web** | Next.js frontend on Vercel, calls backend via proxy API routes |

---

## Tech Stack

| Layer | Technology |
|---|---|
| AI | Claude Haiku 4.5 (all agents) via LangChain/LangGraph |
| Backend | Python 3.11, FastAPI, LangGraph |
| WhatsApp bridge | Evolution API v2 on Fly.io |
| Web frontend | Next.js 15, React 19, TypeScript, Tailwind CSS 4 |
| Vector DB | ChromaDB (persistent, Nigerian statutes) |
| Voice | Spitch API (transcription + synthesis) |
| Document generation | python-docx (`.docx` output, no system deps) |
| Session storage | SQLite (via FastAPI backend on Render) |
| Hosting | Backend → Render · WhatsApp bridge → Fly.io · Frontend → Vercel |

---

## Project Structure

```
thelaaw/
├── backend/
│   ├── agents/
│   │   ├── intake.py        # Fact extraction, clarifying questions
│   │   ├── research.py      # ChromaDB statute search
│   │   ├── reasoning.py     # Legal argument + position assessment
│   │   ├── drafting.py      # Structured .docx document generation
│   │   ├── editing.py       # Post-send document editing
│   │   └── escalation.py    # Urgent situation detection
│   ├── tools/
│   │   └── docx_generator.py  # python-docx document builder
│   ├── orchestrator.py      # LangGraph pipeline + router
│   ├── main.py              # FastAPI app (WhatsApp webhook + web REST API)
│   ├── database.py          # SQLite session storage
│   ├── evolution_client.py  # Evolution API v2 client
│   ├── spitch_client.py     # Voice transcription + synthesis
│   └── requirements.txt
├── frontend/
│   ├── app/
│   │   ├── api/             # Next.js proxy routes → backend
│   │   │   ├── chat/route.ts
│   │   │   ├── review/route.ts
│   │   │   └── transcribe/route.ts
│   │   ├── components/      # Chat UI, agent pipeline viz, cards
│   │   ├── lib/             # API client, mock responses
│   │   └── types.ts
│   ├── .env.local           # BACKEND_URL (not committed)
│   └── package.json
├── fly.toml                 # Evolution API deployment config
└── README.md
```

---

## Setup

### Prerequisites
- Python 3.11+
- Node.js 18+
- An Anthropic API key
- A Spitch API key (for voice)

### 1. Clone & install

```bash
git clone https://github.com/divinefavourak/thelaaw.git
cd thelaaw

# Backend
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt

# Frontend
cd frontend && npm install
```

### 2. Environment variables

Create `backend/.env`:
```env
ANTHROPIC_API_KEY=your_key
SPITCH_API_KEY=your_key
SERVER_URL=https://your-backend-url.onrender.com
EVOLUTION_API_URL=https://thelaaw-evolution-laaw.fly.dev
EVOLUTION_API_KEY=thelaaw_secret_key
EVOLUTION_INSTANCE_NAME=thelaaw_bot
DATABASE_PATH=backend/data/thelaaw.db
CHROMA_DB_PATH=backend/data/chroma
```

Create `frontend/.env.local`:
```env
BACKEND_URL=https://your-backend-url.onrender.com
NEXT_PUBLIC_API_URL=
```

### 3. Ingest Nigerian statutes

```bash
python3 backend/ingest_statutes.py
```

### 4. Run locally

```bash
# Backend
uvicorn backend.main:app --reload --port 8000

# Frontend (separate terminal)
cd frontend && npm run dev
```

Frontend: `http://localhost:3000` · Backend: `http://localhost:8000`

---

## Deployment

### Backend → Render

1. Connect repo on [render.com](https://render.com)
2. **Build command:** `pip install -r backend/requirements.txt`
3. **Start command:** `uvicorn backend.main:app --host 0.0.0.0 --port $PORT`
4. Add all env vars from `backend/.env`

### WhatsApp bridge → Fly.io

```bash
flyctl deploy --config fly.toml
```

Then open `https://thelaaw-evolution-laaw.fly.dev/manager`, log in with the API key, create an instance, scan the QR code with the target WhatsApp number.

To generate a fresh QR code:
```bash
curl -X GET https://thelaaw-evolution-laaw.fly.dev/instance/connect/thelaaw_bot \
  -H "apikey: thelaaw_secret_key"
```

### Frontend → Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project**
2. Import `https://github.com/divinefavourak/thelaaw` (works with public repos)
3. Set **Root Directory** to `frontend`
4. Add environment variable: `BACKEND_URL=https://your-backend-url.onrender.com`
5. Deploy

Auto-deploys on every push to `main`.

---

## API Reference

### Web REST endpoints (FastAPI)

| Method | Path | Description |
|---|---|---|
| `GET` | `/health` | Health check |
| `POST` | `/chat` | Main chat endpoint |
| `POST` | `/review` | Upload a document for analysis |
| `POST` | `/transcribe` | Transcribe audio to text |
| `POST` | `/webhook/whatsapp` | Evolution API webhook (WhatsApp) |

**`POST /chat` payload:**
```json
{
  "message": "My landlord gave me 7 days notice",
  "session_id": "uuid-string",
  "message_type": "text",
  "base64_audio": null,
  "base64_image": null,
  "jurisdiction": "lagos"
}
```

**Response:**
```json
{
  "user_facing_response": "...",
  "relevant_statutes": [...],
  "reasoning": { "strength": "strong", "position_summary": "..." },
  "escalation": null,
  "drafted_document": {
    "document_type": "demand_letter",
    "suggested_filename": "Demand Letter to Landlord_20250419.docx",
    "document_markdown": "...",
    "key_points_summary": "...",
    "pdf_url": "https://your-backend.onrender.com/static/filename.docx"
  },
  "agent_trace": [...]
}
```

---

## Legal Domains Supported

| Domain | Examples |
|---|---|
| Tenancy | Illegal eviction, short notice, rent disputes, property damage |
| Labour | Unpaid wages, wrongful dismissal, overtime, unlawful deductions |
| Police conduct | Bribery, unlawful arrest, detention, brutality |
| Criminal | Bail rights, charge sheet, legal representation |
| Family | Divorce, child custody, domestic violence |
| Consumer | Scam, defective goods, service disputes |

---

## Supported Jurisdictions

All 36 Nigerian states + Federal Capital Territory. Defaults to Lagos if not specified.

---

## Language Support

English · Nigerian Pidgin · Yoruba · Igbo · Hausa

The bot detects the language from your message and responds in kind. Voice input (WhatsApp voice notes and web microphone) is transcribed via Spitch API, which supports all five languages.
