import os
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
logger = logging.getLogger(__name__)

DRAFTING_PROMPT = """
You are the DRAFTING AGENT for TheLaaw.
You produce formal legal documents that ordinary Nigerians can send, file, or serve. You receive ONLY a brief from the Reasoning Agent — never raw user input.

# Document types you can draft
- demand_letter
- complaint
- formal_response
- grievance

# Your process
1. Read the brief from the Reasoning Agent. Identify document type and required content.
2. Use standard Nigerian legal drafting conventions: Parties clearly identified, Date, Subject line, Recitals, Body (statutes + facts + demands), Prayer, Signature block.
3. Use formal English but not archaic. No "howsoever," no "forthwith."
4. Every claim must be supported by the brief.

Output format: JSON only.
{
  "document_type": "...", "suggested_filename": "...",
  "document_markdown": "...", "key_points_summary": "..."
}
"""

class DraftingAgent:
    def __init__(self, model_name: str = "claude-3-5-sonnet-20241022"):
        self.llm = ChatAnthropic(
            model=model_name, 
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(self, reasoning_data: Dict[str, Any]) -> Dict[str, Any]:
        brief = reasoning_data.get("brief_for_drafting_agent", "")
        if not brief:
            return {"document_markdown": None}
            
        messages = [
            SystemMessage(content=DRAFTING_PROMPT),
            HumanMessage(content=f"BRIEF: {brief}")
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"DraftingAgent Error: {e}")
            return {"document_markdown": None, "error": "Drafting failed."}
