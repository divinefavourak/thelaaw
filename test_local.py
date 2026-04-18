import asyncio
import json
import os
import base64
from dotenv import load_dotenv
from backend.orchestrator import create_laaw_graph
from backend.database import init_db

load_dotenv()

async def run_test_scenario(name: str, raw_input: str, base64_image: str = None):
    print(f"\n{'='*20} TESTING SCENARIO: {name} {'='*20}")
    print(f"INPUT: {raw_input if raw_input else '[IMAGE UPLOADED]'}")
    
    graph = create_laaw_graph()
    
    initial_state = {
        "phone_number": "test_user_123",
        "raw_input": raw_input,
        "base64_image": base64_image,
        "message_type": "text",
        "extracted_facts": {},
        "history": [],
        "relevant_statutes": [],
        "clarifying_questions": [],
        "intake_attempts": 0,
        "user_facing_response": ""
    }
    
    try:
        print("\n--- Pipeline Execution ---")
        final_result = await graph.ainvoke(initial_state)
        
        print("\n--- Final Results ---")
        print(f"DOMAIN: {final_result.get('legal_domain')}")
        print(f"JURISDICTION: {final_result.get('jurisdiction')}")
        print(f"STRENGTH: {final_result.get('position_strength')}")
        print(f"\nRESPONSE TO USER:\n{final_result.get('user_facing_response')}")
        
        if final_result.get('clarifying_questions'):
            print(f"QUESTIONS: {final_result.get('clarifying_questions')}")
            
        if final_result.get('relevant_statutes'):
            print(f"\nCITATIONS FOUND: {len(final_result['relevant_statutes'])}")
            for cit in final_result['relevant_statutes'][:2]:
                print(f"- {cit['statute_name']} ({cit['section']})")
        
        if final_result.get('drafted_document'):
            print(f"\nDOCUMENT DRAFTED: {final_result['drafted_document'].get('document_type')}")
            print(f"FILENAME: {final_result['drafted_document'].get('suggested_filename')}")
            
    except Exception as e:
        print(f"ERROR: {e}")

async def main():
    init_db()
    
    scenarios = [
        {
            "name": "Labour - Unpaid Wages",
            "raw_input": "My employer for Lagos hasn't paid my salary for 3 months now. He told me to leave immediately."
        },
        {
            "name": "Tenancy - Illegal Eviction",
            "raw_input": "Landlord says I must pack out by next Saturday because he wants to renovate. I am a yearly tenant."
        }
    ]
    
    # Check if we have a test image to simulate Vision extraction
    # If not, we'll just skip the vision test
    test_image_path = "test_tenancy_agreement.jpg"
    if os.path.exists(test_image_path):
        with open(test_image_path, "rb") as f:
            b64 = base64.b64encode(f.read()).decode("utf-8")
        scenarios.append({
            "name": "Adversarial Review - Tenancy Agreement",
            "raw_input": "Please review my agreement for any illegal clauses.",
            "base64_image": b64
        })
    
    for scenario in scenarios:
        await run_test_scenario(
            scenario["name"], 
            scenario["raw_input"], 
            scenario.get("base64_image")
        )

if __name__ == "__main__":
    asyncio.run(main())
