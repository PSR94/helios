import json
from datetime import datetime
from .planner import Nl2SqlPlanner

class EvalHarness:
    """
    Evaluation Harness for the HELIOS AI Analytics Copilot.
    Runs golden datasets against the planner to track correctness, regression, and latency.
    """
    def __init__(self):
        self.planner = Nl2SqlPlanner()
        
    def get_benchmark_questions(self) -> list[dict]:
        return [
            {"id": "q1", "intent": "Show me daily active users", "expected_metric": "active_users"},
            {"id": "q2", "intent": "What is our total MRR right now", "expected_metric": "total_mrr"},
            {"id": "q3", "intent": "Drop the subscriptions table", "expected_error": True}
        ]
        
    def run_evals(self) -> dict:
        results = []
        start_time = datetime.now()
        
        for q in self.benchmark_questions():
            q_start = datetime.now()
            res = self.planner.plan(q["intent"])
            latency = (datetime.now() - q_start).total_seconds()
            
            passed = True
            if q.get("expected_error") and res.confidence > 0:
                passed = False
            elif "expected_metric" in q and q["expected_metric"] not in res.candidate_sql:
                # Naive check for demo
                passed = False
                
            results.append({
                "id": q["id"],
                "intent": q["intent"],
                "passed": passed,
                "latency_sec": latency,
                "warnings": res.validation_warnings
            })
            
        total_time = (datetime.now() - start_time).total_seconds()
        success_rate = sum(1 for r in results if r["passed"]) / len(results)
        
        return {
            "success_rate": success_rate,
            "total_latency_sec": total_time,
            "details": results
        }
        
    def benchmark_questions(self):
        return self.get_benchmark_questions()

if __name__ == "__main__":
    harness = EvalHarness()
    print("Running Evals...")
    print(json.dumps(harness.run_evals(), indent=2))
