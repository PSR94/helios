from fastapi import APIRouter
from app.core.config import settings
import duckdb
from sqlalchemy import text
from app.db.session import engine

router = APIRouter()

@router.get("/health")
def health_check():
    dependencies = dependencies_health()["dependencies"]
    status = "ok" if all(value in {"ok", "not_configured"} for value in dependencies.values()) else "degraded"
    return {
        "status": status,
        "environment": settings.ENVIRONMENT,
        "app_name": settings.APP_NAME,
        "version": settings.APP_VERSION,
        "dependencies": dependencies,
    }

@router.get("/health/dependencies")
def dependencies_health():
    deps = {"postgres": "unhealthy", "duckdb": "unhealthy"}
    
    # Check Postgres
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            deps["postgres"] = "ok" if settings.DATABASE_URL.startswith("postgresql") else "not_configured"
    except Exception as e:
        deps["postgres"] = str(e)
        
    # Check DuckDB
    try:
        with duckdb.connect(str(settings.duckdb_path), read_only=True) as conn:
            conn.execute("SELECT 1")
            deps["duckdb"] = "ok"
    except Exception as e:
        deps["duckdb"] = str(e)
        
    return {"dependencies": deps}
