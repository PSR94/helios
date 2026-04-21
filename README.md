<p align="center">
  <img src="./docs/assets/banner.svg" alt="HELIOS banner" width="100%" />
</p>

<h1 align="center">HELIOS</h1>

<p align="center">
  <strong>Governed AI analytics engineering platform for semantic NL-to-SQL, trust-aware execution, and explainable insights.</strong>
</p>

<p align="center">
  <a href="https://www.python.org/downloads/release/python-3110/"><img alt="Python 3.11" src="https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white"></a>
  <a href="https://nextjs.org/"><img alt="Next.js 14" src="https://img.shields.io/badge/Next.js-14-000000?style=for-the-badge&logo=nextdotjs&logoColor=white"></a>
  <a href="https://fastapi.tiangolo.com/"><img alt="FastAPI" src="https://img.shields.io/badge/FastAPI-API-009688?style=for-the-badge&logo=fastapi&logoColor=white"></a>
  <a href="https://duckdb.org/"><img alt="DuckDB" src="https://img.shields.io/badge/DuckDB-Analytics-FDCB2F?style=for-the-badge&logo=duckdb&logoColor=1a1a1a"></a>
  <a href="https://openai.com/"><img alt="OpenAI-compatible" src="https://img.shields.io/badge/OpenAI-Compatible-412991?style=for-the-badge&logo=openai&logoColor=white"></a>
  <img alt="Status" src="https://img.shields.io/badge/Status-Production%20Baseline-0F766E?style=for-the-badge">
</p>

<p align="center">
  <img alt="Frontend" src="https://img.shields.io/badge/Frontend-Next.js%20App%20Router-111827?style=flat-square">
  <img alt="Backend" src="https://img.shields.io/badge/Backend-FastAPI-059669?style=flat-square">
  <img alt="Validation" src="https://img.shields.io/badge/Validation-sqlglot%20AST-2563EB?style=flat-square">
  <img alt="Charts" src="https://img.shields.io/badge/Charts-Recharts-E11D48?style=flat-square">
  <img alt="Metadata" src="https://img.shields.io/badge/Metadata-SQLite%20or%20Postgres-7C3AED?style=flat-square">
  <img alt="Testing" src="https://img.shields.io/badge/Tests-pytest-CA8A04?style=flat-square">
</p>

---

## What HELIOS Is

HELIOS is an analytics engineering platform designed around a simple idea:

> AI should not generate analytics answers by guessing.

Instead, HELIOS grounds SQL generation in a semantic layer, validates queries before execution, runs them in a read-only analytical engine, and returns both tabular results and business-facing insights. It is built as a serious engineering project, not a thin chat wrapper around a model API.

This repository currently represents a **production-oriented baseline** for a single-tenant deployment:

- governed NL-to-SQL planning
- semantic metric definitions
- local DuckDB execution
- health-aware API runtime
- typed backend contracts
- schema, quality, lineage, and workspace UI
- route-level backend coverage
- real local development workflow

It is **not yet a finished enterprise platform**. Authentication, RBAC, migrations, CI/CD, and production observability still need to be added.

---

## Why This Project Is Interesting

Most AI analytics demos stop at prompt engineering. HELIOS tries to address the harder system-design questions:

- How do you prevent hallucinated joins and invented columns?
- How do you keep SQL execution safe?
- How do you expose trust signals to the end user?
- How do you structure an analytics copilot as an actual product surface instead of a single chat box?
- How do you create a clean separation between semantic modeling, orchestration, execution, and UX?

That makes this repository useful for engineers interested in:

- AI product architecture
- analytics engineering
- semantic layer design
- trust and governance for LLM systems
- local-first data tooling
- full-stack system composition with Next.js and FastAPI

---

## Core Capabilities

| Area | What HELIOS Does | Why It Matters |
|---|---|---|
| Semantic grounding | Loads YAML-defined metrics, tables, and joins | Prevents the model from inventing business logic |
| SQL planning | Converts business intent into DuckDB-compatible SQL | Gives analysts a natural-language entry point |
| Guardrails | Uses `sqlglot` AST validation plus read-only DuckDB connections | Blocks destructive or unsafe queries |
| Execution | Runs governed SQL on local DuckDB datasets | Fast analytical iteration without cloud dependency |
| Insight narration | Summarizes results into business language | Makes outputs usable beyond raw tables |
| Trust surfaces | Exposes schema, lineage, and data quality views | Helps users decide whether to trust the output |
| Workspace history | Persists analytical sessions for later review | Makes the app feel like a system, not a toy demo |

---

## System Architecture

### 1. Product Architecture

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'background':'#0b1020',
  'primaryColor':'#13203a',
  'primaryTextColor':'#e5eefc',
  'primaryBorderColor':'#60a5fa',
  'lineColor':'#7dd3fc',
  'secondaryColor':'#0f1b33',
  'secondaryTextColor':'#dbeafe',
  'tertiaryColor':'#0b1328',
  'tertiaryTextColor':'#c7d2fe'
}}}%%
graph TD
    User["User / Analyst"] --> Web["Next.js Workspace"]
    Web --> API["FastAPI Platform API"]
    API --> Planner["NL-to-SQL Planner"]
    Planner --> Semantic["Semantic Layer Parser"]
    Planner --> Validator["sqlglot AST Guardrails"]
    Validator --> Runner["DuckDB Query Runner"]
    API --> Summarizer["Insight Summarizer"]
    API --> Quality["Data Quality Checks"]
    API --> Workspace["Workspace Persistence"]
    Runner --> DuckDB["DuckDB Dataset"]
    Workspace --> Meta["SQLite or Postgres Metadata"]

    classDef user fill:#1d4ed8,stroke:#93c5fd,color:#eff6ff,stroke-width:2px;
    classDef frontend fill:#7c3aed,stroke:#c4b5fd,color:#f5f3ff,stroke-width:2px;
    classDef backend fill:#0f766e,stroke:#5eead4,color:#ecfeff,stroke-width:2px;
    classDef logic fill:#7c2d12,stroke:#fdba74,color:#fff7ed,stroke-width:2px;
    classDef trust fill:#14532d,stroke:#86efac,color:#f0fdf4,stroke-width:2px;
    classDef storage fill:#312e81,stroke:#a5b4fc,color:#eef2ff,stroke-width:2px;

    class User user;
    class Web frontend;
    class API backend;
    class Planner,Semantic,Validator,Summarizer logic;
    class Quality trust;
    class Runner,Workspace backend;
    class DuckDB,Meta storage;
```

### 2. Request Lifecycle

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'background':'#0b1020',
  'primaryColor':'#111827',
  'primaryTextColor':'#f8fafc',
  'primaryBorderColor':'#60a5fa',
  'lineColor':'#38bdf8',
  'secondaryColor':'#172554',
  'secondaryTextColor':'#dbeafe',
  'tertiaryColor':'#0f172a',
  'tertiaryTextColor':'#e2e8f0'
}}}%%
flowchart LR
    A["User asks business question"] --> B["Frontend sends query intent"]
    B --> C["Planner receives semantic context"]
    C --> D["Planner returns candidate SQL"]
    D --> E["AST validation and read-only guardrails"]
    E --> F["DuckDB executes query"]
    F --> G["Rows, columns, execution timing"]
    G --> H["Insight summarizer explains result"]
    H --> I["Workspace can be persisted"]
    I --> J["User reviews SQL, charts, table, and trust signals"]

    classDef ask fill:#2563eb,stroke:#93c5fd,color:#eff6ff,stroke-width:2px;
    classDef app fill:#7c3aed,stroke:#c4b5fd,color:#f5f3ff,stroke-width:2px;
    classDef compute fill:#0f766e,stroke:#5eead4,color:#ecfeff,stroke-width:2px;
    classDef trust fill:#b45309,stroke:#fcd34d,color:#fffbeb,stroke-width:2px;
    classDef outcome fill:#be185d,stroke:#f9a8d4,color:#fff1f2,stroke-width:2px;

    class A ask;
    class B,C,D,E,F,G compute;
    class H,I app;
    class J outcome;
```

### 3. Trust and Governance Model

```mermaid
%%{init: {'theme':'base','themeVariables':{
  'background':'#0b1020',
  'primaryColor':'#13203a',
  'primaryTextColor':'#e5eefc',
  'primaryBorderColor':'#60a5fa',
  'lineColor':'#34d399',
  'secondaryColor':'#0f1b33',
  'secondaryTextColor':'#dbeafe',
  'tertiaryColor':'#0b1328',
  'tertiaryTextColor':'#c7d2fe'
}}}%%
graph LR
    Metric["Metric definitions"] --> Plan["Planned SQL"]
    Schema["Known tables and columns"] --> Plan
    Joins["Approved join paths"] --> Plan
    Plan --> AST["sqlglot validation"]
    AST --> Safe["Read-only execution"]
    Safe --> Result["Result table"]
    Result --> Narrative["Narrative insight"]
    Result --> Quality["Quality status"]
    Result --> Lineage["Lineage visibility"]

    classDef governance fill:#7c2d12,stroke:#fdba74,color:#fff7ed,stroke-width:2px;
    classDef safety fill:#14532d,stroke:#86efac,color:#f0fdf4,stroke-width:2px;
    classDef output fill:#1d4ed8,stroke:#93c5fd,color:#eff6ff,stroke-width:2px;

    class Metric,Schema,Joins governance;
    class Plan,AST,Safe safety;
    class Result,Narrative,Quality,Lineage output;
```

---

## Step-by-Step Product Breakdown

### 1. Semantic Layer

HELIOS starts with `datasets/semantic/metrics.yaml`, which defines:

- physical tables
- columns and descriptions
- join paths
- governed metrics such as `active_users`, `total_mrr`, and `churn_rate`

This semantic layer is injected into the planning process so the model is constrained by defined business logic instead of raw guesswork.

### 2. Planning Layer

The planner:

- accepts natural-language business questions
- builds an LLM prompt using semantic context
- extracts candidate SQL
- validates the result using `sqlglot`
- applies a local fallback mode when no LLM key is configured

### 3. Execution Layer

The execution engine:

- connects to DuckDB in read-only mode
- runs validated SQL
- returns columns, rows, and execution timing
- keeps the analytical path local-first and fast

### 4. Trust Layer

HELIOS includes explicit user-facing trust surfaces:

- **Schema Explorer** for physical datasets and samples
- **Metric Catalog** for governed business metrics
- **Semantic Lineage** for metric-to-table visibility
- **Data Quality Center** for freshness, completeness, and volume checks

### 5. Experience Layer

The workspace UI lets users:

- type business questions
- inspect generated SQL
- run and visualize results
- request an explanation
- save the session for later review

---

## Sample Outcomes

### Example 1: Daily Active Users

**Business question**

```text
Show daily active users
```

**Candidate SQL**

```sql
SELECT event_date,
       COUNT(DISTINCT user_id) AS active_users
FROM events
WHERE event_type = 'login'
GROUP BY 1
ORDER BY 1
LIMIT 100
```

**Representative response shape**

```json
{
  "columns": ["event_date", "active_users"],
  "rows": [
    ["2023-01-01T00:00:00", 60],
    ["2023-01-02T00:00:00", 55]
  ],
  "execution_time_ms": 3.2
}
```

**Narrative outcome**

```text
The query returned 100 rows. The first result is event_date=2023-01-01T00:00:00, active_users=60.
Configure LLM_API_KEY to enable richer AI narration.
```

### Example 2: Metric Governance

If the user asks for a governed metric such as total MRR, HELIOS is designed to prefer semantic definitions over ad hoc SQL fragments. That makes the system more useful for analytics engineering workflows than generic text-to-SQL demos.

---

## Tech Stack

### Platform Stack

| Layer | Technologies |
|---|---|
| Frontend | Next.js 14, React 18, Tailwind CSS, Recharts, Lucide |
| Backend | FastAPI, Pydantic, SQLAlchemy |
| Query Validation | sqlglot |
| Analytical Engine | DuckDB, Parquet |
| Model Integration | OpenAI-compatible APIs |
| Persistence | SQLite by default, Postgres configurable |
| Testing | pytest |
| Local Runtime | Makefile, Docker Compose |

### Stack Icons

<p>
  <img alt="Python" src="https://skillicons.dev/icons?i=python" />
  <img alt="FastAPI" src="https://go-skill-icons.vercel.app/api/icons?i=fastapi" height="48" />
  <img alt="Next.js" src="https://skillicons.dev/icons?i=nextjs" />
  <img alt="React" src="https://skillicons.dev/icons?i=react" />
  <img alt="Tailwind" src="https://skillicons.dev/icons?i=tailwind" />
  <img alt="Postgres" src="https://skillicons.dev/icons?i=postgres" />
  <img alt="Docker" src="https://skillicons.dev/icons?i=docker" />
  <img alt="Git" src="https://skillicons.dev/icons?i=git" />
</p>

---

## Repository Walkthrough

```text
helios/
├── apps/
│   ├── api/                  # FastAPI backend
│   │   ├── app/
│   │   │   ├── api/v1/routes/
│   │   │   ├── core/
│   │   │   ├── db/
│   │   │   ├── models/
│   │   │   └── services/
│   │   └── tests/
│   └── web/                  # Next.js frontend
│       ├── app/
│       ├── components/
│       └── lib/
├── datasets/
│   ├── raw/                  # Seeded parquet files
│   └── semantic/             # Metric and schema definitions
├── docs/                     # Architecture references and assets
├── scripts/
│   ├── seed/
│   └── eval/
└── docker-compose.yml
```

---

## Local Development

### Prerequisites

- Python 3.11
- Node.js 18+
- Optional: Docker Compose for Postgres and Redis
- Optional: OpenAI-compatible key for model-backed planning and narration

### Quickstart

```bash
cp .env.example .env
make setup
make seed
make api-dev
make web-dev
```

### Validation

```bash
make test
```

### Runtime Notes

- Metadata uses local SQLite by default via `datasets/helios_meta.db`
- You can switch metadata to Postgres with `DATABASE_URL`
- `LLM_API_KEY` enables richer planning and narration
- host and origin configuration are explicitly validated for production mode

---

## Engineering Details Worth Learning From

This repository is useful because it shows several practical engineering patterns in one place:

### Semantic grounding over prompt-only systems

The project shows how to reduce hallucination risk by grounding the planner in a structured metric catalog instead of relying on broad schema dumps alone.

### Trust-aware LLM product design

The product surface does not stop at model output. It exposes:

- the generated SQL
- data quality status
- schema details
- semantic lineage
- persisted workspaces

That is a more realistic product pattern for AI in analytics.

### Safe execution design

The combination of `sqlglot` validation and read-only DuckDB connections is a strong example of defense in depth for generated SQL execution.

### Full-stack system composition

The project also shows how a modern AI feature can be composed across:

- frontend UX
- backend orchestration
- semantic metadata
- analytical runtime
- persistence
- testing

---

## Current Platform Status

### What is already solid

- local-first end-to-end flow
- clear semantic layer entry point
- production-style FastAPI middleware baseline
- route-level backend tests
- frontend production build
- coherent GitHub-ready repository structure

### What is still missing for a full production program

- authentication and RBAC
- Alembic migrations
- CI/CD pipeline
- deploy manifests and container images
- metrics, tracing, and centralized logging
- multi-tenant isolation

---

## Roadmap

### Near-Term

1. Add authentication and session control
2. Replace `create_all` with migrations
3. Add structured observability and error dashboards
4. Add CI for backend tests and frontend build
5. Add deployment manifests for managed runtime environments

### Longer-Term

1. Expand semantic modeling beyond the current YAML shape
2. Add richer eval datasets and benchmark scoring
3. Introduce background jobs for heavier orchestration
4. Add warehouse connectors beyond local DuckDB
5. Support multi-workspace or multi-tenant isolation

---

## Supporting Documents

- [Architecture Notes](./docs/architecture.md)
- [Platform Overview](./Design%20Doc/platform_overview.md)
- [Full Design Specification](./Design%20Doc/HELIOS_Full_Design_Specification.md)

---

## License

Choose and add an explicit public license before treating this repository as open source. Right now the repository does not include a license grant.
