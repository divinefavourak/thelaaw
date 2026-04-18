from typing import TypedDict, Annotated, List, Dict, Any, Optional
from langgraph.graph import StateGraph, END
from .agents.intake import IntakeAgent
from .agents.research import ResearchAgent
from .agents.reasoning import ReasoningAgent
from .agents.drafting import DraftingAgent
from .agents.escalation import EscalationAgent
import logging

logger = logging.getLogger(__name__)

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
    intake_attempts: int # Track number of turns spent in intake
    escalation_needed: bool
    escalation_reason: Optional[str]

async def intake_node(state: AgentState):
    agent = IntakeAgent()
    # Pass history and optional image to intake
    result = await agent.process(
        state["raw_input"], 
        history=state.get("history"),
        base64_image=state.get("base64_image")
    )
    
    attempts = state.get("intake_attempts", 0) + 1
    
    # If we have clarifying questions, but we've already tried twice, force completion
    ready = result.get("ready_for_research", False)
    questions = result.get("clarifying_questions", [])
    
    if attempts >= 2:
        logger.info(f"Max intake attempts reached for {state['phone_number']}. Moving to research.")
        ready = True
        questions = []
        
    return {
        "extracted_facts": result,
        "legal_domain": result.get("domain"),
        "jurisdiction": result.get("jurisdiction"),
        "user_language": result.get("user_language", "english"),
        "clarifying_questions": questions,
        "is_complete": not ready,
        "intake_attempts": attempts
    }

async def research_node(state: AgentState):
    agent = ResearchAgent()
    result = await agent.process(state["extracted_facts"])
    return {"relevant_statutes": result.get("citations", [])}

async def reasoning_node(state: AgentState):
    agent = ReasoningAgent()
    result = await agent.process(state["extracted_facts"], {"citations": state["relevant_statutes"]})
    return {
        "legal_brief": result,
        "position_strength": result.get("strength", "moderate"),
        "user_facing_response": result.get("user_facing_explanation", "")
    }

async def drafting_node(state: AgentState):
    agent = DraftingAgent()
    result = await agent.process(state["legal_brief"])
    return {"drafted_document": result if result.get("document_markdown") else None}

async def escalation_node(state: AgentState):
    agent = EscalationAgent()
    result = await agent.process(state["extracted_facts"], state["raw_input"])
    return {
        "escalation_needed": result.get("escalation_needed", False),
        "escalation_reason": ", ".join(result.get("reasons", [])) if result.get("escalation_needed") else None,
        "user_facing_response": result.get("user_facing_message") if result.get("escalation_needed") and result.get("urgency") == "immediate" else state.get("user_facing_response")
    }

def should_research(state: AgentState):
    # If the intake agent has questions AND we haven't hit the limit, stay in intake
    if state.get("clarifying_questions") and state.get("intake_attempts", 0) < 2:
        return "end" # In our graph, 'end' at intake means returning questions to the user
    return "research"

def create_laaw_graph():
    workflow = StateGraph(AgentState)
    
    workflow.add_node("intake", intake_node)
    workflow.add_node("research", research_node)
    workflow.add_node("reasoning", reasoning_node)
    workflow.add_node("drafting", drafting_node)
    workflow.add_node("escalation", escalation_node)
    
    workflow.set_entry_point("intake")
    
    workflow.add_conditional_edges(
        "intake",
        should_research,
        {
            "research": "research",
            "end": "escalation" # Route to escalation before returning to user
        }
    )
    
    workflow.add_edge("research", "reasoning")
    workflow.add_edge("reasoning", "drafting")
    workflow.add_edge("drafting", "escalation")
    workflow.add_edge("escalation", END)
    
    return workflow.compile()
