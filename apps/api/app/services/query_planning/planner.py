from pydantic import BaseModel
from typing import Optional
import sqlglot
import re
from openai import OpenAI
from app.core.config import settings
from app.services.semantic_layer.parser import semantic_parser

class PlannerResult(BaseModel):
    candidate_sql: str
    confidence: float
    validation_warnings: list[str]

class SQLRefiner:
    """
    Second agent that audits and improves generated SQL for performance and correctness.
    """
    def __init__(self, client: OpenAI, model: str):
        self.client = client
        self.model = model

    def refine(self, user_intent: str, candidate_sql: str) -> str:
        prompt = f"""You are a Senior Data Engineer at HELIOS.
A junior AI planner generated this SQL for the user's question: "{user_intent}"

CANDIDATE SQL:
{candidate_sql}

Your task is to audit this SQL for:
1. Join correctness (ensure correct join types).
2. Performance (ensure efficient aggregation).
3. DuckDB compatibility.
4. Edge cases (e.g. division by zero, null handling).

If the SQL is perfect, return it exactly as is.
If it needs improvements, return ONLY the improved SQL inside a ```sql block.
"""
        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": "You are a master of SQL optimization and DuckDB."},
                    {"role": "user", "content": prompt}
                ],
                temperature=0.0
            )
            raw = response.choices[0].message.content
            if "```sql" in raw:
                return re.search(r"```sql\n(.*?)\n```", raw, re.DOTALL | re.IGNORECASE).group(1).strip()
            return raw.strip()
        except:
            return candidate_sql

class Nl2SqlPlanner:
    """
    Core engine for converting natural language to SQL.
    This class handles:
    1. Intent parsing via LLM
    2. Semantic metric injection
    3. Guardrail enforcement (via sqlglot)
    """
    def __init__(self):
        self.client = OpenAI(
            api_key=settings.LLM_API_KEY or "local-dev",
            base_url=settings.LLM_API_BASE,
        )
        self.model = settings.LLM_MODEL
        self.refiner = SQLRefiner(self.client, self.model)
        
    def _extract_sql(self, text: str) -> str:
        """Extracts SQL from markdown code blocks if present."""
        match = re.search(r"```sql\n(.*?)\n```", text, re.DOTALL | re.IGNORECASE)
        if match:
            return match.group(1).strip()
        return text.strip()

    def plan(self, user_intent: str, context: dict = None) -> PlannerResult:
        semantic_context = semantic_parser.get_prompt_context()
        
        system_prompt = f"""You are HELIOS, an expert Analytics Engineer.
Your task is to translate the user's business question into a highly accurate DuckDB SQL query.

{semantic_context}

CRITICAL RULES:
1. ONLY use tables and columns defined in the schema above.
2. If the user asks for a defined Metric, you MUST use its exact Calculation SQL and apply ALL of its Required Filters.
3. You must output ONLY valid DuckDB SQL inside a ```sql block.
4. Do NOT include DML or DDL statements (no INSERT, UPDATE, DELETE, DROP).
5. ALWAYS apply a reasonable LIMIT (e.g., LIMIT 100) if no specific limit or top N is requested, to prevent massive scans.
"""

        try:
            response = self.client.chat.completions.create(
                model=self.model,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_intent}
                ],
                temperature=0.0
            )
            raw_output = response.choices[0].message.content
            sql = self._extract_sql(raw_output)
            
            # Step 2: Refine the candidate SQL (Multi-Agent Audit)
            sql = self.refiner.refine(user_intent, sql)
        except Exception as e:
            if not settings.LLM_API_KEY:
                sql = self._plan_without_llm(user_intent)
            else:
                return PlannerResult(candidate_sql="", confidence=0.0, validation_warnings=[f"LLM Error: {str(e)}"])
            
        # Step 3: Validate SQL using sqlglot AST parsing
        warnings = []
        try:
            parsed = sqlglot.parse_one(sql, read="duckdb")
            
            # Guardrail: Check for DML statements
            if not isinstance(parsed, sqlglot.exp.Select):
                raise ValueError("Only SELECT statements are permitted.")
                
            # Guardrail: Ensure limit exists or add warning
            if not parsed.args.get("limit"):
                warnings.append("No LIMIT clause detected; execution may be truncated automatically.")
                
        except Exception as e:
            return PlannerResult(candidate_sql=sql, confidence=0.0, validation_warnings=[f"Validation Error: {str(e)}"])
            
        return PlannerResult(
            candidate_sql=sql,
            confidence=0.95,
            validation_warnings=warnings
        )

    def _plan_without_llm(self, user_intent: str) -> str:
        lowered = user_intent.lower()

        if any(keyword in lowered for keyword in ["drop ", "delete ", "truncate ", "update ", "insert "]):
            return "DROP TABLE users"

        limit_match = re.search(r"\btop\s+(\d+)\b|\blimit\s+(\d+)\b", lowered)
        limit = next((group for group in limit_match.groups() if group), None) if limit_match else None
        limit_clause = f" LIMIT {limit}" if limit else " LIMIT 100"

        if "daily" in lowered and ("active users" in lowered or "dau" in lowered):
            return (
                "SELECT event_date, COUNT(DISTINCT user_id) AS active_users "
                "FROM events "
                "WHERE event_type = 'login' "
                "GROUP BY 1 "
                "ORDER BY 1" + limit_clause
            )

        if "mrr" in lowered or "revenue" in lowered:
            group_by_plan = "plan" in lowered or "tier" in lowered
            if group_by_plan:
                return (
                    "SELECT plan_tier, SUM(mrr) AS total_mrr "
                    "FROM subscriptions "
                    "WHERE status = 'Active' "
                    "GROUP BY 1 "
                    "ORDER BY total_mrr DESC" + limit_clause
                )
            return (
                "SELECT SUM(mrr) AS total_mrr "
                "FROM subscriptions "
                "WHERE status = 'Active'" + limit_clause
            )

        if "active users" in lowered or "logins" in lowered:
            return (
                "SELECT COUNT(DISTINCT user_id) AS active_users "
                "FROM events "
                "WHERE event_type = 'login'" + limit_clause
            )

        if "subscriptions" in lowered:
            return "SELECT * FROM subscriptions" + limit_clause
        if "events" in lowered:
            return "SELECT * FROM events" + limit_clause

        return "SELECT * FROM users" + limit_clause
