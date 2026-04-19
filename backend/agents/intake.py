import os
from dotenv import load_dotenv
from typing import Dict, Any, List, Optional
import json
import logging
import base64
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
logger = logging.getLogger(__name__)

INTAKE_PROMPT = """You are the intake agent for TheLaaw, a Nigerian legal-aid WhatsApp assistant.

Your job: turn the user's message into a structured fact object — and identify exactly what's still missing.

# Rules
- You have the full conversation history. Use it. Do NOT ask for anything already answered.
- Ask AT MOST ONE question per turn. Pick the most important missing fact.
- If you already have enough to understand the core issue, set ready_for_research=true even if minor details are missing.
- If an image is provided, extract all visible text from it accurately.
- Keep your clarifying question short and conversational — like a smart friend asking, not a form.

# What counts as "enough" to set ready_for_research=true
- You know the legal domain (tenancy, labour, criminal, family, consumer, police_conduct, other)
- You know the core facts: who did what to whom, and roughly when
- You know the jurisdiction (default: lagos if not mentioned)
- For tenancy cases: you also know the tenancy type (weekly/monthly/yearly) — this determines the legal notice period and MUST be collected before analysis
- For labour cases: you know whether employment was formal/informal and the reason for termination (if any)

# Before a document can be drafted, you MUST also collect:
- The user's full name (for signing the letter)
- The other party's name and address (for addressing the letter)
- Any domain-specific details the letter needs (e.g. tenancy type, amount owed, date of termination)
- If any of these are missing, ask for them — ONE question at a time — before setting ready_for_research=true

# Output — JSON only
{
  "domain": "tenancy|labour|criminal|family|consumer|police_conduct|other",
  "jurisdiction": "lagos|abuja|...",
  "parties": {
    "user_role": "...",
    "user_full_name": "...",
    "other_party": "...",
    "other_party_address": "..."
  },
  "tenancy_type": "weekly|monthly|quarterly|yearly|unknown",
  "timeline": [{ "date": "...", "event": "..." }],
  "key_events": ["..."],
  "documents_mentioned": ["..."],
  "clarifying_question": "single question string, or null if none needed",
  "ready_for_research": true | false,
  "user_language": "english|pidgin|yoruba|igbo|hausa",
  "extracted_document_text": "..."
}"""


class IntakeAgent:
    def __init__(self, model_name: str = "claude-haiku-4-5-20251001"):
        self.llm = ChatAnthropic(
            model=model_name,
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(
        self,
        raw_input: str,
        history: List[Dict[str, str]] = None,
        base64_image: str = None,
        questions_asked: List[str] = None,
    ) -> Dict[str, Any]:

        # Build context for Claude
        history_text = ""
        if history:
            history_text = "\n".join(
                f"{m['role'].upper()}: {m['content']}" for m in history[-10:]
            )

        already_asked = ""
        if questions_asked:
            already_asked = "\n\nQuestions already asked (do NOT repeat these):\n" + "\n".join(f"- {q}" for q in questions_asked)

        system_content = INTAKE_PROMPT + already_asked

        content = []
        if history_text:
            content.append({"type": "text", "text": f"CONVERSATION SO FAR:\n{history_text}\n\n"})
        if raw_input:
            content.append({"type": "text", "text": f"LATEST MESSAGE: {raw_input}"})
        if base64_image:
            content.append({
                "type": "image",
                "source": {"type": "base64", "media_type": "image/jpeg", "data": base64_image}
            })

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=system_content),
                HumanMessage(content=content),
            ])
            text = response.content
            if isinstance(text, list):
                text = " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in text)
            text = text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            result = json.loads(text)
            # Normalise: old format used clarifying_questions list, new uses single string
            if "clarifying_questions" in result and "clarifying_question" not in result:
                qs = result.pop("clarifying_questions", [])
                result["clarifying_question"] = qs[0] if qs else None
            return result
        except Exception as e:
            logger.error(f"IntakeAgent Error: {e}")
            return {
                "ready_for_research": False,
                "clarifying_question": "Sorry, I didn't catch that clearly. Could you describe your situation again?",
            }
