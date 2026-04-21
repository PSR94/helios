# HELIOS: AI Analytics Engineering Copilot
## Comprehensive Design & Implementation Document

### 1. Project Vision
HELIOS was conceived not as a chatbot, but as a **governed intelligence engine**. The mission was to solve the "Toy NL2SQL" problem—where AI generates hallucinated SQL that ignores business definitions—by grounding every query in a formal Semantic Layer.

### 2. Architecture Overview
HELIOS is built as a vertically integrated, local-first analytics platform.

- **Frontend**: Next.js 14 (App Router) using a high-end "Slate-Dark" design system.
- **Backend**: FastAPI (Python) driving the AI orchestration and metadata management.
- **Data Engine**: DuckDB (analytical) and PostgreSQL (metadata).
- **Intelligence Layer**: OpenAI GPT-4 (or compatible) with Multi-Agent refinement.

### 3. The Seven Pillars of HELIOS

#### I. Semantic Grounding (The "Governed" Planner)
Instead of passing the entire raw schema to the LLM, HELIOS uses a `SemanticParser` to inject specific YAML-based metric definitions (`metrics.yaml`) or dbt manifests into the prompt. This ensures the LLM uses the correct formulas for complex business metrics like `churn_rate` or `mrr`.

#### II. Multi-Agent SQL Orchestration
SQL generation is a two-stage process:
1. **The Planner**: Generates the initial SQL based on natural language intent and semantic context.
2. **The Refiner**: A second agent (Senior Data Engineer persona) audits the SQL for performance, NULL handling, and DuckDB compatibility.

#### III. Execution Guardrails (The Trust Layer)
To ensure safety, HELIOS implements:
- **AST Validation**: Using `sqlglot` to verify that generated queries are strictly `SELECT` statements (blocking DDL/DML).
- **Physical Isolation**: The `QueryRunner` connects to DuckDB in `read_only` mode.

#### IV. Data Quality & Observability
- **Data Quality Center**: Real-time audits for freshness, volume, and completeness.
- **Semantic Lineage**: Visual mapping showing how metrics derive from raw tables.
- **Schema Explorer**: Live introspection of physical storage.

#### V. Insight Narration
HELIOS doesn't just return tables; it uses a `Summarizer` agent to translate tabular results into a professional "Business Insight Narrative," identifying trends and answering the user's question directly.

#### VI. Persistence & Workspaces
Every analytical session is permanent. Using PostgreSQL, users can save their work (Intent + SQL + Result + Insight) into a searchable "Saved Workspaces" history.

#### VII. Evaluation Benchmarking
A dedicated `run_eval.py` harness allows engineers to benchmark the AI's performance against a "Golden Set" of questions, providing a quantitative accuracy score.

### 4. Implementation Timeline (Phases 1-8)

| Phase | Milestone | Deliverables |
| :--- | :--- | :--- |
| **1** | **Scaffolding** | Repository structure, Docker Compose, Makefile. |
| **2** | **Data Layer** | Synthetic SaaS data generator (50k+ records), DuckDB seeding. |
| **3** | **Functional Integration** | OpenAI SDK wiring, Semantic Parser, Query Runner. |
| **4** | **Frontend Workspace** | Next.js Workspace, Dynamic Charts (Recharts), Dynamic Tables. |
| **5** | **Governance UI** | Metric Catalog, Schema Explorer, Data Quality Center. |
| **6** | **Narrative & Persistence** | AI Insight Narration, PostgreSQL Workspace storage. |
| **7** | **Observability & Eval** | Semantic Lineage Graph, Evaluation Harness script. |
| **8** | **Advanced Intelligence** | Multi-Agent Refinement, dbt Manifest Adapter. |

### 5. Technical Decisions Rationale
- **DuckDB**: Chosen for its blazing-fast vectorized execution and ability to run locally on Parquet/DuckDB files without a heavy cloud warehouse.
- **FastAPI**: Provides a high-performance, asynchronous backend with automatic OpenAPI documentation.
- **sqlglot**: Used for AST manipulation because it supports multiple SQL dialects and provides robust safety checks.

### 6. Conclusion
HELIOS represents a new standard for AI-assisted analytics—one where **governance comes before generation**. It is a tool designed for teams that require SQL correctness and data trust at scale.

---
**Build Certified by Antigravity AI.** 🚀
