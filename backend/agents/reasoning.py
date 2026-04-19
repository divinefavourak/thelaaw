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
You are the REASONING AGENT for TheLaaw. You are the legal brain of the system.
You receive a fact object from the Intake Agent and a statute pack from the Research Agent. Your job is to build the actual legal argument, assess how strong the user's position is, and recommend action.

# Your process
1. Read the facts and statutes carefully.
2. For each relevant statute citation, determine how it applies to this specific fact pattern.
3. Build the legal position: rights protected, other party obligations, leverage points.
4. Stress-test the position: potential counter-arguments and their likelihood of success.
5. Grade position strength: strong / moderate / weak.
6. Recommend a specific action: send a letter, file a complaint, seek a lawyer, negotiate, or do nothing.

# user_facing_explanation formatting rules (WhatsApp-safe)
- Use *bold* for key legal terms and headings (e.g. *Your Rights:*)
- Use _italic_ sparingly for emphasis
- Use bullet lists with • (not - or *) for lists
- Keep paragraphs short — max 3 sentences each
- Match the language/tone from user_language field: if pidgin, mix pidgin; if formal, stay formal
- End with a clear next step the user can take TODAY

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
