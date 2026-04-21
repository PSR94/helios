import os
import sys
import json
import time
import duckdb
from typing import List, Dict

# Setup paths
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
sys.path.append(os.path.join(BASE_DIR, "apps", "api"))

from app.services.query_planning.planner import Nl2SqlPlanner
from app.core.config import settings

# Golden Set: Natural Language -> Expected Intent/SQL
GOLDEN_SET = [
    {
        "intent": "Total active users for the pro tier this month",
        "expected_logic": ["events", "subscriptions", "active_users", "pro"]
    },
    {
        "intent": "What is our total MRR by plan tier?",
        "expected_logic": ["subscriptions", "total_mrr", "plan_tier"]
    },
    {
        "intent": "List 10 users who churned in the last 7 days",
        "expected_logic": ["subscriptions", "churn", "limit 10"]
    }
]

def run_benchmarks():
    print("🚀 HELIOS Evaluation Harness: Starting Benchmarks...")
    planner = Nl2SqlPlanner()
    results = []
    
    passed = 0
    
    for test in GOLDEN_SET:
        print(f"Testing Intent: {test['intent']}")
        start_time = time.perf_counter()
        
        plan = planner.plan(test['intent'])
        duration = time.perf_counter() - start_time
        
        # Simple logical check: Does the generated SQL contain the expected keywords?
        found_logic = []
        for word in test['expected_logic']:
            if word.lower() in plan.candidate_sql.lower():
                found_logic.append(word)
        
        accuracy = len(found_logic) / len(test['expected_logic'])
        is_passed = accuracy > 0.7 # Threshold for logic match
        
        if is_passed:
            passed += 1
            
        results.append({
            "intent": test['intent'],
            "generated_sql": plan.candidate_sql,
            "accuracy_score": accuracy,
            "latency_sec": round(duration, 2),
            "passed": is_passed
        })
        
    summary = {
        "total_tests": len(GOLDEN_SET),
        "passed": passed,
        "success_rate": f"{round((passed/len(GOLDEN_SET))*100, 1)}%",
        "avg_latency": f"{round(sum(r['latency_sec'] for r in results)/len(results), 2)}s"
    }
    
    output = {
        "summary": summary,
        "results": results
    }
    
    # Write results
    output_path = os.path.join(BASE_DIR, "eval_results.json")
    with open(output_path, "w") as f:
        json.dump(output, f, indent=2)
        
    print("\n✅ Benchmarks Complete!")
    print(f"Success Rate: {summary['success_rate']}")
    print(f"Results saved to: {output_path}")

if __name__ == "__main__":
    run_benchmarks()
