from datetime import datetime

from fastapi import APIRouter, Depends
from pydantic import BaseModel, ConfigDict, Field
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.workspace import SavedWorkspace

router = APIRouter()

class WorkspaceCreate(BaseModel):
    user_query: str = Field(min_length=3, max_length=1000)
    generated_sql: str = Field(min_length=1, max_length=10000)
    insight_narrative: str | None = None
    results_json: str | None = None

class WorkspaceRead(WorkspaceCreate):
    model_config = ConfigDict(from_attributes=True)

    id: int
    created_at: datetime

@router.post("/", response_model=WorkspaceRead, status_code=201)
def save_workspace(data: WorkspaceCreate, db: Session = Depends(get_db)):
    db_workspace = SavedWorkspace(
        user_query=data.user_query,
        generated_sql=data.generated_sql,
        insight_narrative=data.insight_narrative,
        results_json=data.results_json
    )
    db.add(db_workspace)
    db.commit()
    db.refresh(db_workspace)
    return db_workspace

@router.get("/", response_model=list[WorkspaceRead])
def list_workspaces(db: Session = Depends(get_db)):
    workspaces = db.query(SavedWorkspace).order_by(SavedWorkspace.created_at.desc()).all()
    return workspaces
