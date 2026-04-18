# TheLaaw (v2 Architecture)
### Claude-Powered Multi-Agent Legal Rights System for Everyday Nigerians

TheLaaw is a WhatsApp-first legal rights system that gives ordinary Nigerians plain-language access to their legal rights. Built for the Claude AI Hackathon (UNILAG 2026), it uses a 5-agent pipeline to process user queries, perform jurisdiction-aware research, and draft legally sound documents.

## Core Features
- **5-Agent Pipeline:** Intake, Research, Reasoning, Drafting, and Escalation agents orchestrated via **LangGraph**.
- **Free WhatsApp Integration:** Uses **Evolution API (Docker)** via QR code—no Twilio or Meta approval required.
- **Nigerian Language Support:** Voice-to-text and Text-to-voice for Yoruba, Igbo, Hausa, and Pidgin via **Spitch API**.
- **Localized Research:** Grounded in Nigerian statutes (e.g., Lagos Tenancy Law 2011) stored in a local **ChromaDB**.
- **Automated Drafting:** Generates professional legal demand letters and complaints as PDFs.

## Tech Stack
- **AI:** Claude 3.5 Sonnet (via LangChain/LangGraph)
- **Backend:** Python 3.11 (FastAPI)
- **WhatsApp:** Evolution API (Docker)
- **Vector DB:** ChromaDB
- **Voice:** Spitch API
- **PDF Generation:** WeasyPrint

## Setup Instructions

### 1. Environment Variables
Create a `.env` file in the root:
```env
ANTHROPIC_API_KEY=your_key_here
SPITCH_API_KEY=your_key_here
SERVER_URL=http://your-ngrok-url.app
EVOLUTION_API_URL=http://localhost:8080
EVOLUTION_API_KEY=thelaaw_secret_key
EVOLUTION_INSTANCE_NAME=thelaaw_bot
```

### 2. Start Evolution API (WhatsApp)
```bash
docker-compose up -d
```
Access `http://localhost:8080` to generate a QR code and link your WhatsApp number.

### 3. Setup Backend
```bash
python3 -m venv venv
source venv/bin/activate
pip install -r backend/requirements.txt
```

### 4. Ingest Statutes
```bash
python3 backend/ingest_statutes.py
```

### 5. Run Backend
```bash
uvicorn backend.main:app --reload --port 8000
```
Use `ngrok http 8000` to expose your backend and update the `SERVER_URL` in `.env`.

## Architecture Flow
1. **Intake Agent:** Extract facts and domain.
2. **Research Agent:** Query ChromaDB for relevant Nigerian law.
3. **Reasoning Agent:** Build a legal argument and position assessment.
4. **Drafting Agent:** Produce a formal Markdown document.
5. **Escalation Agent:** Parallel check for violence or urgent human needs.
6. **Delivery:** Send plain-language explanation + PDF letter via WhatsApp.
