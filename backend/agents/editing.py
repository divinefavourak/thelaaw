import os
from dotenv import load_dotenv
from typing import Dict, Any
import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
logger = logging.getLogger(__name__)

EDITING_PROMPT = """
You are the EDITING AGENT for TheLaaw. The user wants to modify a legal document that was already drafted.

You receive:
- The current document JSON (all fields)
- The user's edit instruction

Apply the edit precisely. Return the complete updated document JSON with the same structure.
Only change what the user asked to change. Do not alter unaffected fields.

Output JSON only — same structure as the input document.
"""


class EditingAgent:
    def __init__(self, model_name: str = "claude-haiku-4-5-20251001"):
        self.llm = ChatAnthropic(
            model=model_name,
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(self, current_doc: Dict[str, Any], edit_instruction: str) -> Dict[str, Any]:
        context = (
            f"CURRENT DOCUMENT:\n{json.dumps(current_doc, indent=2)}\n\n"
            f"USER'S EDIT REQUEST:\n{edit_instruction}"
        )
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=EDITING_PROMPT),
                HumanMessage(content=context),
            ])
            content = response.content
            if isinstance(content, list):
                content = " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            result = json.loads(content.strip())
            result["document_markdown"] = True
            return result
        except Exception as e:
            logger.error(f"EditingAgent Error: {e}")
            return current_doc  # return unchanged if edit fails
