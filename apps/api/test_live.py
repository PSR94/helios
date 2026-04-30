import sys
import json
from app.services.query_planning.planner import Nl2SqlPlanner
from app.services.query_execution.runner import query_runner

def main():
    print("User: Show me daily active users")
    
    planner = Nl2SqlPlanner()
    plan_result = planner.plan("Show me daily active users")
    
    print("\n[AI Planner output]")
    print(f"Generated SQL: \n{plan_result.candidate_sql}")
    print(f"Warnings: {plan_result.validation_warnings}")
    
    print("\n[Executing against DuckDB (helios_analytics.duckdb)...]")
    results = query_runner.execute(plan_result.candidate_sql)
    
    print(f"Execution time: {results['execution_time_ms']}ms")
    print(f"Columns: {results['columns']}")
    print("Top 5 Rows:")
    for row in results['rows'][:5]:
        print(row)

if __name__ == "__main__":
    main()
