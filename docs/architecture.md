# Architecture: Semantic Grounding & Governance

HELIOS solves the "AI Hallucination" problem in analytics by strictly grounding the LLM in a governed semantic layer.

## 1. Semantic Grounding
The system does not allow the LLM to "guess" column names or join logic.
1. **Parser**: The `SemanticParser` reads `metrics.yaml`.
2. **Context Injection**: The parser generates a structured string representing the schema, join paths, and metric formulas.
3. **Prompting**: This context is injected into the LLM system prompt, forcing the LLM to use only the defined definitions.

## 2. The Execution Guardrail
Even with a high-quality prompt, raw SQL generation is risky.
1. **Validator**: Every SQL string from the LLM is parsed by `sqlglot`.
2. **AST Inspection**: We inspect the Abstract Syntax Tree to ensure:
   - It is a `SELECT` statement.
   - It contains no DML (INSERT/UPDATE/DELETE).
   - It contains no DDL (DROP/ALTER).
3. **Physical Safety**: The `QueryRunner` connects to DuckDB using the `read_only=True` flag.

## 3. Local-First Analytical Engine
HELIOS uses DuckDB as its primary execution engine.
- **Speed**: Vectorized execution on local parquet/duckdb files.
- **Local-First**: No need to ship data to a cloud warehouse during development.
- **Compatibility**: Supports standard Postgres-flavor SQL.

## 4. Trust & Observability
- **Data Quality**: Background checks monitor data freshness and completeness.
- **Lineage**: Automated mapping of Metrics to Tables ensures analysts know where their data comes from.
- **Evaluation**: The `run_eval.py` script provides a continuous feedback loop on LLM performance.
