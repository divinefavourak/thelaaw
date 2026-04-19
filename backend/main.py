import uvicorn
from fastapi import FastAPI, Request, BackgroundTasks, UploadFile, File, Form
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Optional
from fastapi.staticfiles import StaticFiles
import logging
import os
import json
import base64
import asyncio
from datetime import datetime
from dotenv import load_dotenv
import httpx

from .orchestrator import create_laaw_graph
from .evolution_client import EvolutionAPIClient
from .spitch_client import SpitchAPIClient
from .database import init_db, get_case, update_case, reset_session_if_stale
from .tools.docx_generator import DocxGenerator

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TheLaaw Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure directories exist
os.makedirs("backend/static", exist_ok=True)
os.makedirs("backend/temp", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Initialize clients
graph = create_laaw_graph()
whatsapp = EvolutionAPIClient()
spitch = SpitchAPIClient()
doc_gen = DocxGenerator()

@app.get("/health")
async def health():
    return {"status": "ok"}

async def self_ping():
    url = os.getenv("SERVER_URL", "http://localhost:8000") + "/health"
    async with httpx.AsyncClient() as client:
        while True:
            await asyncio.sleep(600)  # ping every 10 minutes
            try:
                await client.get(url, timeout=10)
                logger.info("Self-ping sent.")
            except Exception as e:
                logger.warning(f"Self-ping failed: {e}")

@app.on_event("startup")
async def startup_event():
    init_db()
    logger.info("Database initialized.")
    asyncio.create_task(self_ping())

async def process_message(message_data: dict):
    """
    Process an incoming message (text, audio, or image) through the agent pipeline.
    """
    try:
        remote_jid = message_data.get("key", {}).get("remoteJid")
        message_id = message_data.get("key", {}).get("id")
        message_type = message_data.get("messageType")

        # Ignore group messages
        if remote_jid and "@g.us" in remote_jid:
            return

        raw_text = ""
        base64_image = None
        is_audio = False
        
        # 1. Extract content based on message type
        if message_type == "conversation" or message_type == "extendedTextMessage":
            raw_text = message_data.get("message", {}).get("conversation") or \
                       message_data.get("message", {}).get("extendedTextMessage", {}).get("text")
        
        elif message_type == "audioMessage":
            is_audio = True
            # Download audio via Evolution API
            audio_bytes = await whatsapp.download_media(message_id)
            if audio_bytes:
                temp_path = f"backend/temp/{remote_jid}_{message_id}.mp3"
                with open(temp_path, "wb") as f:
                    f.write(audio_bytes)
                # Transcription via Spitch
                raw_text = await spitch.transcribe(temp_path)
                os.remove(temp_path)
        
        elif message_type == "imageMessage":
            # Download image via Evolution API for Vision extraction
            image_bytes = await whatsapp.download_media(message_id)
            if image_bytes:
                base64_image = base64.b64encode(image_bytes).decode("utf-8")
                caption = message_data.get("message", {}).get("imageMessage", {}).get("caption", "")
                raw_text = f"[Document Image Uploaded] {caption}"

        if not raw_text and not base64_image:
            return

        if is_audio and not raw_text:
            await whatsapp.send_text(remote_jid, "I couldn't catch that audio. Could you type your message instead? 🙏")
            return

        logger.info(f"Processing message from {remote_jid} (Type: {message_type})")

        # Send typing indicator before processing
        await whatsapp.send_presence(remote_jid, "composing")

        # 2. Retrieve Case + Session Memory (auto-reset if >24h stale)
        case_data = get_case(remote_jid)
        case_data = reset_session_if_stale(remote_jid, case_data)

        # Notify user for slow operations based on current stage
        stage = case_data["session_state"].get("stage", "greeting")
        raw_lower = (raw_text or "").lower()
        if stage == "analysis" and not case_data["session_state"].get("legal_brief"):
            await whatsapp.send_text(remote_jid, "⏳ Analysing your situation, give me a moment...")
        elif "draft" in raw_lower or "letter" in raw_lower or "document" in raw_lower:
            await whatsapp.send_text(remote_jid, "📝 Drafting your document, this may take a moment...")

        # 3. Run Agent Pipeline
        initial_state = {
            "phone_number": remote_jid,
            "raw_input": raw_text,
            "base64_image": base64_image,
            "message_type": "audio" if is_audio else "text",
            "extracted_facts": case_data["extracted_facts"],
            "history": case_data["history"],
            "session_state": case_data["session_state"],
            "intake_attempts": case_data["session_state"].get("intake_attempts", 0),
            "relevant_statutes": case_data["session_state"].get("relevant_statutes", []),
            "legal_brief": case_data["session_state"].get("legal_brief", {}),
            "clarifying_questions": [],
            "user_facing_response": "",
            "needs_pdf": True,
            "confirm_pdf_first": False,
            "next_stage": case_data["session_state"].get("stage", "greeting"),
            "intents_queued": case_data["session_state"].get("intents_queued", []),
        }

        result = await graph.ainvoke(initial_state)

        # 4. Update Case + Session Memory
        new_history = case_data["history"] + [
            {"role": "user", "content": raw_text or "[media]"},
            {"role": "assistant", "content": result.get("user_facing_response", "")},
        ]
        # Keep history bounded to last 40 messages (20 exchanges)
        new_history = new_history[-40:]

        updated_session = result.get("session_state", case_data["session_state"])
        updated_session["intake_attempts"] = result.get("intake_attempts", 0)

        update_case(
            remote_jid,
            result.get("extracted_facts", {}),
            new_history,
            updated_session,
        )
        
        # 5. Delivery Logic
        response_text = result.get("user_facing_response", "").strip()

        if response_text:
            if is_audio:
                audio_url = await spitch.synthesize(response_text)
                if audio_url:
                    await whatsapp.send_media(remote_jid, audio_url, caption=response_text, filename="response.mp3")
                else:
                    await whatsapp.send_text(remote_jid, response_text)
            else:
                await whatsapp.send_text(remote_jid, response_text)

        # 5.2 Document — generate and send as .docx
        doc = result.get("drafted_document")
        if doc and doc.get("document_markdown"):
            filename, docx_bytes = doc_gen.generate(doc, result.get("extracted_facts", {}))
            if docx_bytes:
                await whatsapp.send_media_base64(
                    to=remote_jid,
                    pdf_bytes=docx_bytes,
                    filename=filename,
                    caption="Here's your formal document.",
                )

    except Exception as e:
        logger.error(f"Error in process_message: {e}", exc_info=True)

class WebChatRequest(BaseModel):
    message: str
    session_id: str
    message_type: str = "text"
    base64_audio: Optional[str] = None
    base64_image: Optional[str] = None
    jurisdiction: Optional[str] = "lagos"


async def _run_web_pipeline(session_key: str, raw_text: str, base64_image: str = None, message_type: str = "text"):
    """Shared pipeline runner for web chat and document review."""
    case_data = get_case(session_key)
    case_data = reset_session_if_stale(session_key, case_data)

    initial_state = {
        "phone_number": session_key,
        "raw_input": raw_text or "",
        "base64_image": base64_image,
        "message_type": message_type,
        "extracted_facts": case_data["extracted_facts"],
        "history": case_data["history"],
        "session_state": case_data["session_state"],
        "intake_attempts": case_data["session_state"].get("intake_attempts", 0),
        "relevant_statutes": case_data["session_state"].get("relevant_statutes", []),
        "legal_brief": case_data["session_state"].get("legal_brief", {}),
        "clarifying_questions": [],
        "user_facing_response": "",
        "needs_pdf": True,
        "confirm_pdf_first": False,
        "next_stage": case_data["session_state"].get("stage", "greeting"),
        "intents_queued": case_data["session_state"].get("intents_queued", []),
    }

    result = await graph.ainvoke(initial_state)

    new_history = case_data["history"] + [
        {"role": "user", "content": raw_text or "[media]"},
        {"role": "assistant", "content": result.get("user_facing_response", "")},
    ]
    updated_session = result.get("session_state", case_data["session_state"])
    updated_session["intake_attempts"] = result.get("intake_attempts", 0)
    update_case(session_key, result.get("extracted_facts", {}), new_history[-40:], updated_session)

    # Generate docx if a document was drafted
    docx_url = None
    doc_data = result.get("drafted_document")
    if doc_data and doc_data.get("document_markdown"):
        filename, docx_bytes = doc_gen.generate(doc_data, result.get("extracted_facts", {}))
        if docx_bytes and filename:
            with open(os.path.join("backend/static", filename), "wb") as f:
                f.write(docx_bytes)
            server_url = os.getenv("SERVER_URL", "http://localhost:8000")
            docx_url = f"{server_url}/static/{filename}"

    # Build document_markdown preview from structured data
    doc_preview = ""
    if doc_data and doc_data.get("document_type"):
        parts = []
        if doc_data.get("salutation"):
            parts.append(doc_data["salutation"] + "\n")
        for p in doc_data.get("paragraphs", []):
            parts.append(p)
        if doc_data.get("demands"):
            parts.append("\nWe therefore demand that you:")
            for i, d in enumerate(doc_data["demands"], 1):
                parts.append(f"{i}. {d}")
        if doc_data.get("closing"):
            parts.append(f"\n{doc_data['closing']},")
        if doc_data.get("sender_name"):
            parts.append(doc_data["sender_name"])
        doc_preview = "\n\n".join(parts)

    brief = result.get("legal_brief") or {}
    reasoning = {
        "position_summary": brief.get("position_summary", ""),
        "strength": brief.get("strength", "moderate"),
        "supporting_argument": brief.get("supporting_argument", ""),
        "counter_arguments": brief.get("counter_arguments", []),
        "recommended_action": brief.get("recommended_action", ""),
        "user_facing_explanation": brief.get("user_facing_explanation", ""),
    } if brief else None

    escalation = None
    if result.get("escalation_needed"):
        escalation = {
            "escalation_needed": True,
            "urgency": "immediate",
            "reasons": [result.get("escalation_reason", "")] if result.get("escalation_reason") else [],
            "recommended_routes": [],
            "user_facing_message": result.get("user_facing_response", ""),
        }

    agents_run = result.get("agents_to_run", [])

    return {
        "user_facing_response": result.get("user_facing_response", ""),
        "extracted_facts": result.get("extracted_facts"),
        "clarifying_questions": result.get("clarifying_questions", []),
        "relevant_statutes": result.get("relevant_statutes", []),
        "reasoning": reasoning,
        "escalation": escalation,
        "drafted_document": {
            "document_type": doc_data.get("document_type", "demand_letter"),
            "suggested_filename": doc_data.get("suggested_filename", "document.docx"),
            "document_markdown": doc_preview,
            "key_points_summary": doc_data.get("key_points_summary", ""),
            "pdf_url": docx_url,
        } if doc_data and doc_data.get("document_type") else None,
        "agent_trace": [{"agent": a, "status": "done", "label": a.capitalize()} for a in agents_run],
    }


@app.post("/chat")
async def web_chat(req: WebChatRequest):
    session_key = f"web_{req.session_id}"
    raw_text = req.message
    base64_image = req.base64_image

    if req.message_type == "audio" and req.base64_audio:
        try:
            audio_bytes = base64.b64decode(req.base64_audio)
            temp_path = f"backend/temp/{session_key}.webm"
            os.makedirs("backend/temp", exist_ok=True)
            with open(temp_path, "wb") as f:
                f.write(audio_bytes)
            raw_text = await spitch.transcribe(temp_path)
            os.remove(temp_path)
        except Exception as e:
            logger.error(f"Audio transcription error: {e}")
        if not raw_text:
            return JSONResponse({"user_facing_response": "I couldn't catch that audio. Could you type your message instead?"})

    return JSONResponse(await _run_web_pipeline(session_key, raw_text, base64_image, req.message_type))


@app.post("/review")
async def web_review(session_id: str = Form(...), file: UploadFile = File(...)):
    session_key = f"web_{session_id}"
    contents = await file.read()
    b64 = base64.b64encode(contents).decode("utf-8")
    raw_text = f"[Document uploaded: {file.filename}]"
    return JSONResponse(await _run_web_pipeline(session_key, raw_text, b64, "image"))


@app.post("/transcribe")
async def web_transcribe(session_id: str = Form(...), audio: UploadFile = File(...)):
    try:
        contents = await audio.read()
        temp_path = f"backend/temp/web_{session_id}.webm"
        os.makedirs("backend/temp", exist_ok=True)
        with open(temp_path, "wb") as f:
            f.write(contents)
        transcript = await spitch.transcribe(temp_path)
        os.remove(temp_path)
        return JSONResponse({"transcript": transcript or ""})
    except Exception as e:
        logger.error(f"Transcribe error: {e}")
        return JSONResponse({"transcript": ""})


@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    event = payload.get("event")
    if event == "messages.upsert":
        data = payload.get("data", {})
        if isinstance(data, list):
            data = data[0] if data else {}
        remote_jid = data.get("key", {}).get("remoteJid", "")
        from_me = data.get("key", {}).get("fromMe", False)
        if not from_me and "@g.us" not in remote_jid:
            logger.info(f"Incoming DM from {remote_jid}")
            background_tasks.add_task(process_message, data)
    
    return JSONResponse(content={"status": "success"}, status_code=200)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
