from typing import TypedDict, List, Dict, Any, Optional
import asyncio
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
- complete     : Case resolved for now

Rules:
1. Read `stage` and `questions_asked` carefully. Never ask a question that's in questions_asked.
2. If user explicitly asked for a document/letter/draft:
   - If facts are complete and user's full name is known → agents: ["drafting"], needs_pdf: true, confirm_pdf_first: false
   - If name is missing → agents: ["intake"] to collect name first
   - NEVER ask "should I send as PDF?" — always draft and send directly
3. If `has_legal_brief` is true: skip research and reasoning. Go directly to drafting if user wants a document, or just reply from existing analysis.
4. If message has MULTIPLE intents (e.g. "I was fired and I want a letter"):
   - This turn: handle the primary need (usually analysis first)
   - Queue the rest in intents_queued for next turn
5. Escalation runs whenever there are safety/criminal/urgent signals — even mid-conversation
6. Set next_stage to reflect where the conversation should be after this turn

Output JSON only:
{
  "agents": ["intake"|"escalation"|"research"|"reasoning"|"drafting"],
  "needs_pdf": true|false,
  "confirm_pdf_first": false,
  "next_stage": "greeting|intake|analysis|complete",
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
    agents_to_run: List[str]


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

    has_legal_brief = bool(sess.get("legal_brief") or state.get("legal_brief"))
    context = f"""SESSION STATE:
stage: {sess.get('stage', 'greeting')}
questions_asked: {json.dumps(sess.get('questions_asked', []))}
intents_queued: {json.dumps(sess.get('intents_queued', []))}
has_legal_brief: {has_legal_brief}

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

    # Restore cached brief/statutes from session (persisted across turns)
    cached_brief = state.get("legal_brief") or sess.get("legal_brief") or {}
    cached_statutes = state.get("relevant_statutes") or sess.get("relevant_statutes") or []

    updates: dict = {
        "extracted_facts": state.get("extracted_facts", {}),
        "relevant_statutes": cached_statutes,
        "legal_brief": cached_brief,
        "drafted_document": None,
        "user_facing_response": "",
        "clarifying_questions": [],
        "escalation_needed": False,
        "escalation_reason": None,
    }

    # --- Run agents, parallelising where safe ---
    # Pass 1: INTAKE (must run first — may short-circuit)
    if "intake" in agents_to_run:
        logger.info("Running agent: intake")
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
            if question not in questions_asked:
                questions_asked = questions_asked + [question]
            updates["clarifying_questions"] = [question]
            # Skip remaining agents — wait for user's answer
            agents_to_run = []

    # Pass 2: ESCALATION + RESEARCH in parallel (skip research if we already have statutes cached)
    if "research" in agents_to_run and cached_statutes:
        logger.info("Skipping research — using cached statutes")
        agents_to_run = [a for a in agents_to_run if a != "research"]

    parallel = [a for a in agents_to_run if a in ("escalation", "research")]
    if parallel:
        logger.info(f"Running in parallel: {parallel}")
        facts = updates.get("extracted_facts") or state.get("extracted_facts", {})

        async def run_escalation():
            agent = EscalationAgent()
            return await agent.process(facts, state["raw_input"])

        async def run_research():
            agent = ResearchAgent()
            return await agent.process(facts)

        tasks = []
        if "escalation" in parallel:
            tasks.append(run_escalation())
        if "research" in parallel:
            tasks.append(run_research())

        results = await asyncio.gather(*tasks, return_exceptions=True)
        idx = 0

        if "escalation" in parallel:
            esc_result = results[idx] if not isinstance(results[idx], Exception) else {}
            idx += 1
            updates["escalation_needed"] = esc_result.get("escalation_needed", False)
            updates["escalation_reason"] = (
                ", ".join(esc_result.get("reasons", [])) if esc_result.get("escalation_needed") else None
            )
            if esc_result.get("escalation_needed") and esc_result.get("urgency") == "immediate":
                updates["user_facing_response"] = esc_result.get("user_facing_message", "")
                agents_to_run = []  # Skip reasoning/drafting

        if "research" in parallel:
            res_result = results[idx] if not isinstance(results[idx], Exception) else {}
            updates["relevant_statutes"] = res_result.get("citations", [])

    # Skip reasoning if we already have a cached brief
    if "reasoning" in agents_to_run and cached_brief:
        logger.info("Skipping reasoning — using cached legal brief")
        agents_to_run = [a for a in agents_to_run if a != "reasoning"]

    # Pass 3: REASONING (depends on research output)
    if "reasoning" in agents_to_run:
        logger.info("Running agent: reasoning")
        agent = ReasoningAgent()
        facts = updates.get("extracted_facts") or state.get("extracted_facts", {})
        research = {"citations": updates.get("relevant_statutes", [])}
        user_language = updates.get("user_language") or state.get("user_language", "english")
        result = await agent.process(facts, research, user_language=user_language)
        updates["legal_brief"] = result
        updates["position_strength"] = result.get("strength", "moderate")
        updates["user_facing_response"] = result.get("user_facing_explanation", "")

    # Pass 4: DRAFTING (depends on reasoning output)
    if "drafting" in agents_to_run:
        logger.info("Running agent: drafting")
        agent = DraftingAgent()
        brief = updates.get("legal_brief") or state.get("legal_brief") or sess.get("legal_brief", {})
        result = await agent.process(brief)
        updates["drafted_document"] = result if result.get("document_markdown") else None
        if updates["drafted_document"]:
            updates["user_facing_response"] = "Your formal letter is ready — sending it now."

    # Update session state — persist brief + statutes so next turn can skip re-analysis
    updated_session = {
        **sess,
        "stage": state.get("next_stage", sess.get("stage", "intake")),
        "questions_asked": questions_asked,
        "pending_for": None,  # PDF confirm flow removed
        "intents_queued": state.get("intents_queued", []),
        "legal_brief": updates.get("legal_brief") or cached_brief,
        "relevant_statutes": updates.get("relevant_statutes") or cached_statutes,
    }

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
