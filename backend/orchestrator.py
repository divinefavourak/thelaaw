from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from .agents.intake import IntakeAgent
from .agents.research import ResearchAgent
from .agents.reasoning import ReasoningAgent
from .agents.drafting import DraftingAgent
from .agents.escalation import EscalationAgent
import logging
import json
import os
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

ROUTER_PROMPT = """You are the routing brain of TheLaaw, a Nigerian legal-aid WhatsApp assistant.

Given the conversation history and the user's latest message, decide:
1. What the user actually needs RIGHT NOW
2. Which agents to run (in order)
3. Whether a PDF/document is needed or just a plain response

Available agents:
- intake: Extract facts and ask clarifying questions. Use when facts are unclear or missing.
- escalation: Check for urgent/dangerous situations. Use when there are safety/criminal/urgent signals.
- research: Find relevant Nigerian laws/statutes. Use only when facts are sufficiently clear.
- reasoning: Analyse the legal position and produce a plain-language explanation. Use after research.
- drafting: Draft a formal document (demand letter, complaint, etc.). Use ONLY when the user explicitly asks for a letter/document, OR when reasoning determines a document is the right next step AND you have all needed info.

Rules:
- Never run all agents by default. Run only what's needed.
- If the message is a greeting, general question, or too vague → intake only (ask one focused question).
- If there are safety red flags → escalation first, then decide.
- If facts are clear and legal analysis is needed → research + reasoning (skip intake).
- If the user asks for a document → only draft if ALL required info is present. If not, ask for missing info first.
- Never draft a document without confirming with the user first unless they explicitly requested it in this message.
- Default response format is plain WhatsApp text. Only set needs_pdf=true if user explicitly asked for a PDF/document.

Output JSON only:
{
  "agents": ["intake"|"escalation"|"research"|"reasoning"|"drafting"],
  "needs_pdf": true|false,
  "confirm_pdf_first": true|false,
  "reasoning": "one sentence on why these agents"
}"""


class AgentState(TypedDict):
    phone_number: str
    user_language: str
    raw_input: str
    base64_image: Optional[str]
    message_type: str
    extracted_facts: Dict[str, Any]
    history: List[Dict[str, str]]
    legal_domain: Optional[str]
    jurisdiction: Optional[str]
    relevant_statutes: List[Dict[str, Any]]
    legal_brief: Dict[str, Any]
    position_strength: str
    drafted_document: Optional[Dict[str, Any]]
    user_facing_response: str
    is_complete: bool
    clarifying_questions: List[str]
    intake_attempts: int
    escalation_needed: bool
    escalation_reason: Optional[str]
    # Routing decisions
    agents_to_run: List[str]
    needs_pdf: bool
    confirm_pdf_first: bool


async def router_node(state: AgentState) -> dict:
    """Decide which agents to run based on conversation context."""
    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    history_summary = ""
    if state.get("history"):
        recent = state["history"][-6:]  # last 3 exchanges
        history_summary = "\n".join(
            f"{m['role'].upper()}: {m['content']}" for m in recent
        )

    facts_summary = json.dumps(state.get("extracted_facts", {}), indent=2) if state.get("extracted_facts") else "None yet"

    context = f"""CONVERSATION HISTORY (recent):
{history_summary or 'None yet'}

KNOWN FACTS:
{facts_summary}

USER'S LATEST MESSAGE:
{state['raw_input']}

MESSAGE TYPE: {state.get('message_type', 'text')}
HAS IMAGE: {bool(state.get('base64_image'))}"""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=ROUTER_PROMPT),
            HumanMessage(content=context)
        ])
        content = response.content
        if isinstance(content, list):
            content = " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        result = json.loads(content.strip())
        logger.info(f"Router decision: {result}")
        return {
            "agents_to_run": result.get("agents", ["intake"]),
            "needs_pdf": result.get("needs_pdf", False),
            "confirm_pdf_first": result.get("confirm_pdf_first", True),
        }
    except Exception as e:
        logger.error(f"Router error: {e}. Defaulting to intake.")
        return {"agents_to_run": ["intake"], "needs_pdf": False, "confirm_pdf_first": True}


async def smart_pipeline_node(state: AgentState) -> dict:
    """Run only the agents the router selected, in order."""
    agents_to_run = state.get("agents_to_run", ["intake"])
    updates: dict = {
        "extracted_facts": state.get("extracted_facts", {}),
        "relevant_statutes": state.get("relevant_statutes", []),
        "legal_brief": state.get("legal_brief", {}),
        "drafted_document": None,
        "user_facing_response": "",
        "clarifying_questions": [],
        "escalation_needed": False,
        "escalation_reason": None,
    }

    for agent_name in agents_to_run:
        logger.info(f"Running agent: {agent_name}")

        if agent_name == "intake":
            agent = IntakeAgent()
            attempts = state.get("intake_attempts", 0) + 1
            result = await agent.process(
                state["raw_input"],
                history=state.get("history"),
                base64_image=state.get("base64_image")
            )
            ready = result.get("ready_for_research", False)
            questions = result.get("clarifying_questions", [])
            if attempts >= 3:
                ready = True
                questions = []
            updates["extracted_facts"] = result
            updates["legal_domain"] = result.get("domain")
            updates["jurisdiction"] = result.get("jurisdiction")
            updates["user_language"] = result.get("user_language", "english")
            updates["clarifying_questions"] = questions
            updates["intake_attempts"] = attempts
            # If intake has questions to ask, stop here — no need for other agents
            if questions:
                updates["user_facing_response"] = _format_questions(questions)
                break

        elif agent_name == "escalation":
            agent = EscalationAgent()
            result = await agent.process(
                updates.get("extracted_facts") or state.get("extracted_facts", {}),
                state["raw_input"]
            )
            updates["escalation_needed"] = result.get("escalation_needed", False)
            updates["escalation_reason"] = ", ".join(result.get("reasons", [])) if result.get("escalation_needed") else None
            if result.get("escalation_needed") and result.get("urgency") == "immediate":
                updates["user_facing_response"] = result.get("user_facing_message", "")
                break  # Stop pipeline — user needs urgent help, not a legal brief

        elif agent_name == "research":
            agent = ResearchAgent()
            facts = updates.get("extracted_facts") or state.get("extracted_facts", {})
            result = await agent.process(facts)
            updates["relevant_statutes"] = result.get("citations", [])

        elif agent_name == "reasoning":
            agent = ReasoningAgent()
            facts = updates.get("extracted_facts") or state.get("extracted_facts", {})
            research = {"citations": updates.get("relevant_statutes", [])}
            result = await agent.process(facts, research)
            updates["legal_brief"] = result
            updates["position_strength"] = result.get("strength", "moderate")
            updates["user_facing_response"] = result.get("user_facing_explanation", "")

        elif agent_name == "drafting":
            # Only draft if confirm_pdf_first is False (user already confirmed) or needs_pdf is True
            if state.get("confirm_pdf_first") and not state.get("needs_pdf"):
                # Ask for confirmation instead of drafting
                current = updates.get("user_facing_response", "")
                updates["user_facing_response"] = (current + "\n\nShould I send this as a PDF document?").strip()
                updates["drafted_document"] = None
                break
            agent = DraftingAgent()
            brief = updates.get("legal_brief") or state.get("legal_brief", {})
            result = await agent.process(brief)
            updates["drafted_document"] = result if result.get("document_markdown") else None

    return updates


def _format_questions(questions: list) -> str:
    if not questions:
        return ""
    if len(questions) == 1:
        return questions[0]
    return "\n".join(f"• {q}" for q in questions)


def create_laaw_graph():
    workflow = StateGraph(AgentState)

    workflow.add_node("router", router_node)
    workflow.add_node("pipeline", smart_pipeline_node)

    workflow.set_entry_point("router")
    workflow.add_edge("router", "pipeline")
    workflow.add_edge("pipeline", END)

    return workflow.compile()
