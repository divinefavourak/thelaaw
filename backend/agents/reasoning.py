import os
from dotenv import load_dotenv
from typing import Dict, Any, List
import json
import logging
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

load_dotenv()
logger = logging.getLogger(__name__)

REASONING_PROMPT = """
You are the REASONING AGENT for TheLaaw, a Nigerian legal-aid assistant.
You receive structured facts and relevant Nigerian statutes. Build the legal argument and write a response to the user.

# Your process
1. Apply the statutes to the specific facts. Be precise — cite the actual section numbers.
2. Assess position strength: strong / moderate / weak. Be honest.
3. Identify the single most useful action the user can take right now.
4. Write the user_facing_explanation.

# user_facing_explanation — how to write it
- Sound like a Nigerian lawyer explaining to a friend, not an AI generating a report
- Be direct and specific to THEIR facts — no generic advice that applies to everyone
- Keep it short: 3-5 sentences MAX. If you need to mention a law, quote the actual section once, then move on.
- Do NOT repeat the user's facts back to them. They know what happened.
- Do NOT produce bullet-point lists of obvious steps. Just tell them what matters most.
- End with ONE concrete next step — specific to their situation.
- If pidgin was used, respond in pidgin. If formal English, stay formal.

Output format: JSON only.
{
  "position_summary": "...", "strength": "strong|moderate|weak",
  "supporting_argument": "...", "counter_arguments": ["..."],
  "recommended_action": "...", "brief_for_drafting_agent": "...",
  "user_facing_explanation": "...",
  "user_language": "english|pidgin|yoruba|igbo|hausa"
}
"""

class ReasoningAgent:
    def __init__(self, model_name: str = "claude-haiku-4-5-20251001"):
        self.llm = ChatAnthropic(
            model=model_name, 
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def process(self, intake_data: Dict[str, Any], research_data: Dict[str, Any], user_language: str = "english") -> Dict[str, Any]:
        context = f"FACTS: {json.dumps(intake_data)}\n\nSTATUTES: {json.dumps(research_data)}\n\nUSER_LANGUAGE: {user_language}"
        
        messages = [
            SystemMessage(content=REASONING_PROMPT),
            HumanMessage(content=context)
        ]
        
        try:
            response = await self.llm.ainvoke(messages)
            content = response.content
            if isinstance(content, list):
                content = " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
            if "```json" in content:
                content = content.split("```json")[1].split("```")[0].strip()
            return json.loads(content)
        except Exception as e:
            logger.error(f"ReasoningAgent Error: {e}")
            return {"strength": "weak", "user_facing_explanation": "I'm having trouble analyzing your situation. Please consult a legal professional."}
