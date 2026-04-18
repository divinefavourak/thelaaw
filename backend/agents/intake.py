import os
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional
import json
import logging
import base64
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.config import MODELS

load_dotenv()
logger = logging.getLogger(__name__)

INTAKE_PROMPT = """
You are the INTAKE AGENT for TheLaaw, a legal rights companion for everyday Nigerians.
Your ONLY job is to turn a user's description (text or document image) into a structured fact object.

# DOCUMENT EXTRACTION MODE
If an image of a document is provided, extract ALL text accurately. 
Specifically look for:
- Parties (Landlord, Tenant, Employer, Employee)
- Key Dates (Commencement, Expiry, Notice given)
- Clauses (Rent amount, Notice period, Service charge, etc.)
- Signatures and witnesses.

# Your process
1. Classify the legal domain: tenancy, labour, criminal, family, consumer, police_conduct, other.
2. Extract structured facts: jurisdiction (default "lagos"), parties, timeline, key_events, documents_mentioned.
3. Missing facts: Ask AT MOST TWO targeted clarifying questions.
4. Assess emotional state: Acknowledge briefly if distressed.

Output format: JSON only.
{
  "domain": "...", "jurisdiction": "...", "parties": { "user_role": "...", "other_party": "..." },
  "timeline": [{ "date": "...", "event": "..." }], "key_events": ["..."],
  "documents_mentioned": ["..."], "clarifying_questions": ["..."],
  "ready_for_research": true | false, "user_language": "...",
  "extracted_document_text": "..." 
}
"""

class IntakeAgent:
    def __init__(self, model_name: str = MODELS["intake"]):
        # We use Sonnet for Intake now because it has Vision and better extraction
        self.llm = ChatAnthropic(
            model=model_name, 
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(self, raw_input: str, history: List[Dict[str, str]] = None, base64_image: str = None) -> Dict[str, Any]:
        system_msg = SystemMessage(content=INTAKE_PROMPT)
        
        content = []
        if raw_input:
            content.append({"type": "text", "text": raw_input})
            
        if base64_image:
            # Add image to message content for Claude Vision
            content.append({
                "type": "image",
                "source": {
                    "type": "base64",
                    "media_type": "image/jpeg",
                    "data": base64_image
                }
            })
            
        messages = [system_msg]
        if history:
            for msg in history:
                messages.append(HumanMessage(content=msg["content"]))
        
        messages.append(HumanMessage(content=content))
        
        try:
            response = await self.llm.ainvoke(messages)
            text_response = response.content
            if "```json" in text_response:
                text_response = text_response.split("```json")[1].split("```")[0].strip()
            return json.loads(text_response)
        except Exception as e:
            logger.error(f"IntakeAgent Error: {e}")
            return {"ready_for_research": False, "clarifying_questions": ["Sorry, I couldn't read that document or message clearly. Could you try again?"]}
