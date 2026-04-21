import duckdb
import time
import os
from typing import List, Dict, Any
from app.core.config import settings

DUCKDB_PATH = str(settings.duckdb_path)

class QueryRunner:
    """
    Executes validated SQL against the local DuckDB instance safely.
    """
    
    def __init__(self, db_path: str = DUCKDB_PATH):
        self.db_path = db_path
        
    def execute(self, sql: str) -> Dict[str, Any]:
        """
        Executes a SELECT query and returns the column names and row data.
        Enforces read_only mode to prevent injection of state-mutating queries.
        """
        if not os.path.exists(self.db_path):
            raise FileNotFoundError(f"Analytics database not found at {self.db_path}. Run 'make seed' first.")
            
        start_time = time.perf_counter()
        
        try:
            # We connect in read_only mode as an ultimate physical guardrail.
            with duckdb.connect(self.db_path, read_only=True) as conn:
                result = conn.execute(sql)
                
                # Extract columns
                columns = [desc[0] for desc in result.description]
                
                # Fetch all rows (limit should already be enforced by planner guardrails)
                # For safety, fetchdf or fetchmany could be used, but fetchall is fine with a strict limit policy
                rows = result.fetchall()
                
                # Convert tuples to lists for JSON serialization
                json_rows = [list(row) for row in rows]
                
        except Exception as e:
            raise ValueError(f"Execution Error: {str(e)}")
            
        execution_time_ms = round((time.perf_counter() - start_time) * 1000, 2)
        
        return {
            "columns": columns,
            "rows": json_rows,
            "execution_time_ms": execution_time_ms
        }

query_runner = QueryRunner()
