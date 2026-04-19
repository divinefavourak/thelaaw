import uvicorn
from fastapi import FastAPI, Request, BackgroundTasks
from fastapi.responses import JSONResponse
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
from .database import init_db, get_case, update_case
from .tools.pdf_generator import PDFGenerator

load_dotenv()

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(title="TheLaaw Backend")

# Ensure directories exist
os.makedirs("backend/static", exist_ok=True)
os.makedirs("backend/temp", exist_ok=True)
app.mount("/static", StaticFiles(directory="backend/static"), name="static")

# Initialize clients
graph = create_laaw_graph()
whatsapp = EvolutionAPIClient()
spitch = SpitchAPIClient()
pdf_gen = PDFGenerator()

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

        logger.info(f"Processing message from {remote_jid} (Type: {message_type})")

        # 2. Retrieve Case Memory
        case_data = get_case(remote_jid)
        # Note: We should store intake_attempts in DB too for true persistence
        # For now, we'll derive it or default it
        intake_attempts = case_data.get("extracted_facts", {}).get("intake_attempts", 0)
        
        # 3. Run Agent Pipeline
        initial_state = {
            "phone_number": remote_jid,
            "raw_input": raw_text,
            "base64_image": base64_image,
            "message_type": "audio" if is_audio else "text",
            "extracted_facts": case_data["extracted_facts"],
            "history": case_data["history"],
            "intake_attempts": intake_attempts,
            "relevant_statutes": [],
            "clarifying_questions": [],
            "user_facing_response": ""
        }
        
        result = await graph.ainvoke(initial_state)
        
        # 4. Update Case Memory
        new_facts = result.get("extracted_facts", {})
        new_facts["intake_attempts"] = result.get("intake_attempts", 0)
        
        update_case(
            remote_jid, 
            new_facts, 
            result.get("history", []) + [{"role": "user", "content": raw_text}, {"role": "assistant", "content": result.get("user_facing_response", "")}]
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

        # 5.2 PDF — only send if drafting ran and produced a document
        doc = result.get("drafted_document")
        if doc and doc.get("document_markdown"):
            filename = pdf_gen.generate_legal_document(doc, result.get("extracted_facts", {}))
            if filename:
                server_url = os.getenv("SERVER_URL", "http://host.docker.internal:8000")
                media_url = f"{server_url}/static/{filename}"
                await whatsapp.send_media(
                    to=remote_jid,
                    media_url=media_url,
                    caption="Here's your formal document.",
                    filename=filename
                )

    except Exception as e:
        logger.error(f"Error in process_message: {e}", exc_info=True)

@app.post("/webhook/whatsapp")
async def whatsapp_webhook(request: Request, background_tasks: BackgroundTasks):
    payload = await request.json()
    event = payload.get("event")
    
    if event == "messages.upsert":
        data = payload.get("data", {})
        if not data.get("key", {}).get("fromMe"):
            background_tasks.add_task(process_message, data)
    
    return JSONResponse(content={"status": "success"}, status_code=200)

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
