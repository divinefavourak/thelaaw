import os
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
logger = logging.getLogger(__name__)

NIGERIAN_LEGAL_AID_CONTACTS = [
    {
        "organization": "Legal Aid Council of Nigeria (LACON)",
        "why": "Free legal representation for criminal and civil matters",
        "contact": "+234-9-670-4660 | legalaidcouncil.gov.ng"
    },
    {
        "organization": "Nigerian Bar Association (NBA) Pro Bono",
        "why": "Connects you with a volunteer lawyer in your state",
        "contact": "nba.org.ng | +234-1-462-0816"
    },
    {
        "organization": "FIDA Nigeria (Women & Children)",
        "why": "Free legal aid for women and children facing domestic violence or family law issues",
        "contact": "+234-1-774-4046 | fidanigeria.org"
    },
    {
        "organization": "Spaces for Change (Lagos)",
        "why": "Human rights violations, police brutality, community evictions",
        "contact": "+234-803-528-8779 | spacesforchange.org"
    },
    {
        "organization": "Emergency Services",
        "why": "Immediate physical danger",
        "contact": "Police: 199 | Ambulance: 112 | Fire: 01-7944929"
    },
]

ESCALATION_PROMPT = f"""
You are the ESCALATION AGENT for TheLaaw. You are the safety net.
Review the facts and input. Determine if the user needs urgent human legal aid or emergency services.

# Red flags
- Violence, physical harm, or threats.
- Criminal exposure/arrest.
- Urgent deadlines (< 48h).
- Vulnerable populations (minors, domestic violence victims).

# Verified Nigerian legal aid contacts (use ONLY these — do NOT invent contacts):
{json.dumps(NIGERIAN_LEGAL_AID_CONTACTS, indent=2)}

Pick the 1-2 most relevant contacts for this situation.

Output format: JSON only.
{{
  "escalation_needed": true | false,
  "urgency": "immediate|within_24h|within_week|none",
  "reasons": ["..."],
  "recommended_routes": [{{ "organization": "...", "why": "...", "contact": "..." }}],
  "user_facing_message": "..."
}}
"""

class EscalationAgent:
    def __init__(self, model_name: str = "claude-haiku-4-5-20251001"):
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
