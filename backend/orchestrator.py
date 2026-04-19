from typing import TypedDict, List, Dict, Any, Optional
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

# ---------------------------------------------------------------------------
# Router prompt — reads session state and decides what to do this turn
# ---------------------------------------------------------------------------
ROUTER_PROMPT = """You are the routing brain of TheLaaw, a Nigerian legal-aid WhatsApp assistant.

You receive the full session context and must decide what to do THIS TURN ONLY.

Available agents:
- intake       : Extract/update facts, ask one clarifying question if needed
- escalation   : Check for urgent/dangerous situations (violence, arrest, <48h deadlines)
- research     : Find relevant Nigerian statutes (only when facts are clear)
- reasoning    : Analyse legal position, explain rights in plain language
- drafting     : Write a formal document (demand letter, complaint, etc.)

Session stages:
- greeting     : First message or very vague — run intake
- intake       : Still gathering facts — run intake, possibly escalation
- analysis     : Facts complete — run research + reasoning
- waiting_pdf_confirm : We asked "should I send as PDF?" — check if user said yes/no
- complete     : Case resolved for now

Rules:
1. Read `stage` and `questions_asked` carefully. Never ask a question that's in questions_asked.
2. If `pending_for` is "pdf_confirm":
   - User said yes/confirmed → agents: ["drafting"], needs_pdf: true, confirm_pdf_first: false
   - User said no/not now → agents: [], needs_pdf: false — just acknowledge
3. If message has MULTIPLE intents (e.g. "I was fired and I want a letter"):
   - This turn: handle the primary need (usually analysis first)
   - Queue the rest in intents_queued for next turn
4. Only run drafting when: user explicitly asked for a document AND facts are complete AND confirm_pdf_first is false
5. Escalation runs whenever there are safety/criminal/urgent signals — even mid-conversation
6. Set next_stage to reflect where the conversation should be after this turn

Output JSON only:
{
  "agents": ["intake"|"escalation"|"research"|"reasoning"|"drafting"],
  "needs_pdf": true|false,
  "confirm_pdf_first": true|false,
  "next_stage": "greeting|intake|analysis|waiting_pdf_confirm|complete",
  "intents_queued": [],
  "reasoning": "one sentence"
}"""


class AgentState(TypedDict):
    phone_number: str
    user_language: str
    raw_input: str
    base64_image: Optional[str]
    message_type: str
    extracted_facts: Dict[str, Any]
    history: List[Dict[str, str]]
    session_state: Dict[str, Any]
    legal_domain: Optional[str]
    jurisdiction: Optional[str]
    relevant_statutes: List[Dict[str, Any]]
    legal_brief: Dict[str, Any]
    position_strength: str
    drafted_document: Optional[Dict[str, Any]]
    user_facing_response: str
    clarifying_questions: List[str]
    intake_attempts: int
    escalation_needed: bool
    escalation_reason: Optional[str]
    needs_pdf: bool
    confirm_pdf_first: bool
    next_stage: str
    intents_queued: List[str]


# ---------------------------------------------------------------------------
# Router node
# ---------------------------------------------------------------------------
async def router_node(state: AgentState) -> dict:
    llm = ChatAnthropic(
        model="claude-haiku-4-5-20251001",
        temperature=0,
        anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
    )

    sess = state.get("session_state", {})
    history = state.get("history", [])
    recent_history = "\n".join(
        f"{m['role'].upper()}: {m['content']}" for m in history[-8:]
    ) or "None"

    context = f"""SESSION STATE:
stage: {sess.get('stage', 'greeting')}
questions_asked: {json.dumps(sess.get('questions_asked', []))}
pending_for: {sess.get('pending_for')}
intents_queued: {json.dumps(sess.get('intents_queued', []))}

KNOWN FACTS:
{json.dumps(state.get('extracted_facts', {}), indent=2) or 'None'}

RECENT CONVERSATION:
{recent_history}

USER'S MESSAGE THIS TURN:
{state['raw_input']}
HAS IMAGE: {bool(state.get('base64_image'))}"""

    try:
        response = await llm.ainvoke([
            SystemMessage(content=ROUTER_PROMPT),
            HumanMessage(content=context),
        ])
        content = response.content
        if isinstance(content, list):
            content = " ".join(b.get("text", "") if isinstance(b, dict) else str(b) for b in content)
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        result = json.loads(content.strip())
        logger.info(f"Router → agents: {result.get('agents')}, stage: {result.get('next_stage')}, reason: {result.get('reasoning')}")
        return {
            "agents_to_run": result.get("agents", ["intake"]),
            "needs_pdf": result.get("needs_pdf", False),
            "confirm_pdf_first": result.get("confirm_pdf_first", True),
            "next_stage": result.get("next_stage", sess.get("stage", "intake")),
            "intents_queued": result.get("intents_queued", []),
        }
    except Exception as e:
        logger.error(f"Router error: {e}. Defaulting to intake.")
        return {
            "agents_to_run": ["intake"],
            "needs_pdf": False,
            "confirm_pdf_first": True,
            "next_stage": "intake",
            "intents_queued": [],
        }


# ---------------------------------------------------------------------------
# Pipeline node — runs selected agents in order
# ---------------------------------------------------------------------------
async def pipeline_node(state: AgentState) -> dict:
    agents_to_run = state.get("agents_to_run", ["intake"])
    sess = state.get("session_state", {})
    questions_asked = sess.get("questions_asked", [])

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

        # --- INTAKE ---
        if agent_name == "intake":
            agent = IntakeAgent()
            result = await agent.process(
                state["raw_input"],
                history=state.get("history"),
                base64_image=state.get("base64_image"),
                questions_asked=questions_asked,
            )
            updates["extracted_facts"] = {**updates["extracted_facts"], **result}
            updates["legal_domain"] = result.get("domain")
            updates["jurisdiction"] = result.get("jurisdiction")
            updates["user_language"] = result.get("user_language", "english")
            updates["intake_attempts"] = state.get("intake_attempts", 0) + 1

            question = result.get("clarifying_question")
            if question:
                updates["user_facing_response"] = question
                # Track it so we never ask again
                if question not in questions_asked:
                    questions_asked = questions_asked + [question]
                updates["clarifying_questions"] = [question]
                break  # Don't run more agents — wait for user's answer

        # --- ESCALATION ---
        elif agent_name == "escalation":
            agent = EscalationAgent()
            result = await agent.process(
                updates.get("extracted_facts") or state.get("extracted_facts", {}),
                state["raw_input"]
            )
            updates["escalation_needed"] = result.get("escalation_needed", False)
            updates["escalation_reason"] = (
                ", ".join(result.get("reasons", [])) if result.get("escalation_needed") else None
            )
            if result.get("escalation_needed") and result.get("urgency") == "immediate":
                updates["user_facing_response"] = result.get("user_facing_message", "")
                break

        # --- RESEARCH ---
        elif agent_name == "research":
            agent = ResearchAgent()
            facts = updates.get("extracted_facts") or state.get("extracted_facts", {})
            result = await agent.process(facts)
            updates["relevant_statutes"] = result.get("citations", [])

        # --- REASONING ---
        elif agent_name == "reasoning":
            agent = ReasoningAgent()
            facts = updates.get("extracted_facts") or state.get("extracted_facts", {})
            research = {"citations": updates.get("relevant_statutes", [])}
            user_language = updates.get("user_language") or state.get("user_language", "english")
            result = await agent.process(facts, research, user_language=user_language)
            updates["legal_brief"] = result
            updates["position_strength"] = result.get("strength", "moderate")
            updates["user_facing_response"] = result.get("user_facing_explanation", "")

        # --- DRAFTING ---
        elif agent_name == "drafting":
            if state.get("confirm_pdf_first") and not state.get("needs_pdf"):
                current = updates.get("user_facing_response", "")
                updates["user_facing_response"] = (
                    (current + "\n\nShould I send this as a PDF?").strip()
                )
                updates["drafted_document"] = None
                # Signal that we're waiting for PDF confirmation
                state["session_state"]["pending_for"] = "pdf_confirm"
                break
            agent = DraftingAgent()
            brief = updates.get("legal_brief") or state.get("legal_brief", {})
            result = await agent.process(brief)
            updates["drafted_document"] = result if result.get("document_markdown") else None

    # Update session state
    updated_session = {
        **sess,
        "stage": state.get("next_stage", sess.get("stage", "intake")),
        "questions_asked": questions_asked,
        "pending_for": sess.get("pending_for"),
        "intents_queued": state.get("intents_queued", []),
    }
    # Clear pending_for if we ran drafting or user declined
    if "drafting" in agents_to_run or (
        sess.get("pending_for") == "pdf_confirm" and not updates.get("drafted_document")
    ):
        updated_session["pending_for"] = None

    updates["session_state"] = updated_session
    return updates


def create_laaw_graph():
    workflow = StateGraph(AgentState)
    workflow.add_node("router", router_node)
    workflow.add_node("pipeline", pipeline_node)
    workflow.set_entry_point("router")
    workflow.add_edge("router", "pipeline")
    workflow.add_edge("pipeline", END)
    return workflow.compile()
