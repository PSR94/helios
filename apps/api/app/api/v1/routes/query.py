from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from app.services.query_planning.planner import Nl2SqlPlanner
from app.services.query_execution.runner import query_runner
from app.services.insights.summarizer import insight_summarizer

router = APIRouter()
planner = Nl2SqlPlanner()

class QueryPlanRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000)
    dataset_context: str | None = None

class QueryRunRequest(BaseModel):
    sql: str = Field(min_length=1, max_length=10000)

class QueryExplainRequest(BaseModel):
    query: str = Field(min_length=3, max_length=1000)
    sql: str = Field(min_length=1, max_length=10000)
    columns: list[str]
    rows: list[list]

@router.post("/plan")
def plan_query(request: QueryPlanRequest):
    result = planner.plan(request.query)
    
    if not result.candidate_sql:
        raise HTTPException(status_code=400, detail="Failed to generate safe SQL from intent. " + str(result.validation_warnings))
        
    return {
        "candidate_sql": result.candidate_sql,
        "confidence": result.confidence,
        "validation_warnings": result.validation_warnings
    }

@router.post("/run")
def run_query(request: QueryRunRequest):
    try:
        # Before running, validate it again just in case it bypassed the planner
        # (Runner also enforces read-only connection)
        execution_result = query_runner.execute(request.sql)
        return execution_result
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.post("/explain")
def explain_query(request: QueryExplainRequest):
    try:
        insight = insight_summarizer.summarize(
            query=request.query,
            sql=request.sql,
            columns=request.columns,
            rows=request.rows
        )
        return {"insight": insight}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
