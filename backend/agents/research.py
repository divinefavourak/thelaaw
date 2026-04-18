import os
import chromadb
from typing import Dict, Any, List
import logging
import json
from langchain_anthropic import ChatAnthropic
from langchain_core.messages import HumanMessage, SystemMessage

logger = logging.getLogger(__name__)

QUERY_GEN_PROMPT = """
You are the LEGAL RESEARCH ASSISTANT for TheLaaw.
Your job is to generate a highly optimized search query for a vector database of Nigerian statutes based on structured facts.

Facts provided:
{facts}

Generate a concise search query (1-2 sentences) that captures the core legal issue, including terms like "eviction notice period", "unpaid wages termination", "illegal police search dreadlocks", etc. 
ONLY output the query string, nothing else.
"""

class ResearchAgent:
    def __init__(self, chroma_path: str = None):
        if chroma_path is None:
            chroma_path = os.getenv("CHROMA_DB_PATH", "backend/data/chroma")
        self.client = chromadb.PersistentClient(path=chroma_path)
        self.collection = self.client.get_collection("nigerian_statutes")
        # Use Haiku for cheap/fast query generation
        self.llm = ChatAnthropic(
            model="claude-3-5-haiku-20241022",
            temperature=0,
            anthropic_api_key=os.getenv("ANTHROPIC_API_KEY")
        )

    async def generate_search_query(self, facts: Dict[str, Any]) -> str:
        """
        Uses Claude to turn messy facts into a sharp vector search query.
        """
        try:
            prompt = QUERY_GEN_PROMPT.format(facts=json.dumps(facts))
            response = await self.llm.ainvoke([HumanMessage(content=prompt)])
            return response.content.strip()
        except Exception as e:
            logger.error(f"Query Gen Error: {e}")
            # Fallback to key events join
            return " ".join(facts.get("key_events", ["rights", "law"]))

    def search_statutes(self, domain: str, jurisdiction: str, query: str = None) -> List[Dict[str, Any]]:
        """
        Retrieves relevant statutes based on the domain, jurisdiction, and query.
        """
        # Jurisdiction filter: prioritize state law, then federal
        # Note: In a real app, we'd do two queries and merge them
        where_clause = {"jurisdiction": jurisdiction} if jurisdiction else {}
        
        results = self.collection.query(
            query_texts=[query] if query else ["rights", "protection"],
            n_results=6,
            where=where_clause
        )
        
        citations = []
        if results['documents']:
            for i in range(len(results['documents'][0])):
                # Filter by domain manually if it doesn't match perfectly in vector space
                # but keep a few generic results
                citations.append({
                    "statute_name": results['metadatas'][0][i].get("source"),
                    "section": results['metadatas'][0][i].get("section"),
                    "text": results['documents'][0][i],
                    "jurisdiction": results['metadatas'][0][i].get("jurisdiction"),
                    "relevance_score": 1.0 - results['distances'][0][i] if results['distances'] else 0.5
                })
        
        # Sort by relevance
        citations.sort(key=lambda x: x['relevance_score'], reverse=True)
        return citations

    async def process(self, intake_data: Dict[str, Any]) -> Dict[str, Any]:
        domain = intake_data.get("domain", "other")
        jurisdiction = intake_data.get("jurisdiction", "lagos")
        
        # 1. Generate optimized query
        search_query = await self.generate_search_query(intake_data)
        logger.info(f"Generated Search Query: {search_query}")
        
        # 2. Search statutes
        citations = self.search_statutes(domain, jurisdiction, search_query)
        
        return {
            "citations": citations,
            "notes_for_reasoning_agent": f"Retrieved {len(citations)} citations using query: '{search_query}'"
        }
