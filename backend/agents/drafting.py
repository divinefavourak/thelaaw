import os
from dotenv import load_dotenv
from typing import Dict, Any
import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
logger = logging.getLogger(__name__)

DRAFTING_PROMPT = """
You are the DRAFTING AGENT for TheLaaw, a Nigerian legal-aid assistant.
You produce formal legal documents Nigerians can send, file, or serve.

You receive:
- A legal brief from the Reasoning Agent (position, statutes, recommended action)
- The full extracted facts (parties, timeline, tenancy type, etc.)

# Rules
1. Use ONLY information actually present in the inputs. Never invent names, addresses, dates, or facts.
2. If a field (e.g. sender address) is not in the inputs, omit it — leave the field as an empty string.
3. Draft in formal but plain Nigerian English. No archaic phrases.
4. Every legal claim must cite the specific statute from the brief.
5. The document must feel tailored — it should name both parties, state the specific facts, and make specific demands.

# Document structure
- sender_name: user's full name from extracted_facts.parties.user_full_name
- sender_address: user's address if known, else ""
- recipient_name: other party's name from extracted_facts.parties.other_party
- recipient_address: other party's address from extracted_facts.parties.other_party_address
- subject: use extracted_facts.document_title if provided (uppercased); otherwise generate a concise subject line from the facts
- salutation: "Dear Mr./Mrs. [recipient_name]" (use actual name)
- paragraphs: list of body paragraphs — each a complete sentence. Include: (a) opening stating purpose, (b) facts as they occurred, (c) applicable law with section numbers, (d) how the facts breach the law
- demands: numbered list of specific demands (e.g. "Provide written notice of not less than 6 months as required by Section 13 of the Lagos Tenancy Law 2011")
- closing: "Yours faithfully" or "Yours sincerely" as appropriate

Output JSON only — no markdown, no prose outside the JSON.
{
  "document_type": "demand_letter|complaint|formal_response|grievance",
  "suggested_filename": "...",
  "sender_name": "...",
  "sender_address": "...",
  "recipient_name": "...",
  "recipient_address": "...",
  "subject": "...",
  "salutation": "...",
  "paragraphs": ["...", "..."],
  "demands": ["...", "..."],
  "closing": "...",
  "key_points_summary": "one sentence summary"
}
"""


class DraftingAgent:
    def __init__(self, model_name: str = "claude-haiku-4-5-20251001"):
        self.llm = ChatAnthropic(
            model=model_name,
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(self, reasoning_data: Dict[str, Any], extracted_facts: Dict[str, Any] = None) -> Dict[str, Any]:
        brief = reasoning_data.get("brief_for_drafting_agent", "")
        if not brief:
            return {"document_type": None}

        context = f"LEGAL BRIEF:\n{brief}\n\nEXTRACTED FACTS:\n{json.dumps(extracted_facts or {}, indent=2)}"

        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=DRAFTING_PROMPT),
                HumanMessage(content=context),
            ])
            content = response.content
            if isinstance(content, list):
                content = " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            result = json.loads(content.strip())
            # Backwards compat: keep document_markdown for any code still checking it
            result["document_markdown"] = True
            return result
        except Exception as e:
            logger.error(f"DraftingAgent Error: {e}")
            return {"document_type": None, "error": "Drafting failed."}
