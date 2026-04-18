import os
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage
from backend.config import MODELS

load_dotenv()
logger = logging.getLogger(__name__)

ESCALATION_PROMPT = """
You are the ESCALATION AGENT for TheLaaw. You are the safety net.
Review the facts and input. Determine if the user needs urgent human legal aid or emergency services.

# Red flags
- Violence, physical harm, or threats.
- Criminal exposure/arrest.
- Urgent deadlines (< 48h).
- Vulnerable populations.

Output format: JSON only.
{
  "escalation_needed": true | false, 
  "urgency": "immediate|within_24h|within_week|none",
  "reasons": ["..."], 
  "recommended_routes": [{ "organization": "...", "why": "...", "contact": "..." }],
  "user_facing_message": "..."
}
"""

class EscalationAgent:
    def __init__(self, model_name: str = MODELS["escalation"]):
        self.llm = ChatAnthropic(
            model=model_name, 
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(self, intake_data: Dict[str, Any], raw_input: str) -> Dict[str, Any]:
        context = f"FACTS: {json.dumps(intake_data)}\n\nRAW_INPUT: {raw_input}"
        
        try:
            response = await self.llm.ainvoke([
                SystemMessage(content=ESCALATION_PROMPT),
                HumanMessage(content=context)
            ])
            content = response.content
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"EscalationAgent Error: {e}")
            # FALLBACK: If API fails, check for keywords manually for safety
            critical_keywords = ["kill", "die", "beat", "police", "arrest", "court", "suicide"]
            if any(k in (raw_input or "").lower() for k in critical_keywords):
                return {
                    "escalation_needed": True,
                    "urgency": "immediate",
                    "user_facing_message": "Safety Warning: Your situation seems to require urgent help. Please contact the nearest Legal Aid office or emergency services immediately."
                }
            return {"escalation_needed": False}
