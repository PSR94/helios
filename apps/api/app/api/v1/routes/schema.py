from fastapi import APIRouter, HTTPException
import duckdb
from app.core.config import settings
import os
import re

router = APIRouter()

def get_duckdb_conn():
    if not settings.duckdb_path.exists():
        raise HTTPException(status_code=500, detail="Database file not found. Run seed script.")
    return duckdb.connect(str(settings.duckdb_path), read_only=True)

@router.get("/datasets")
def list_datasets():
    try:
        with get_duckdb_conn() as conn:
            tables = conn.execute("SHOW TABLES").fetchall()
            return {"datasets": [{"id": t[0], "name": t[0], "trust_tier": "gold"} for t in tables]}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/datasets/{id}/columns")
def get_dataset_columns(id: str):
    try:
        if not re.fullmatch(r"[A-Za-z_][A-Za-z0-9_]*", id):
            raise HTTPException(status_code=400, detail="Invalid dataset name")
        with get_duckdb_conn() as conn:
            # Get column info
            columns_info = conn.execute(f"DESCRIBE {id}").fetchall()
            # Get sample data (first 5 rows)
            sample = conn.execute(f"SELECT * FROM {id} LIMIT 5").fetchall()
            
            return {
                "columns": [{"name": c[0], "type": c[1]} for c in columns_info],
                "sample_rows": [list(r) for r in sample]
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
