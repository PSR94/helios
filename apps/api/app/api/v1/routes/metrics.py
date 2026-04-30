from fastapi import APIRouter
from fastapi_cache.decorator import cache
from app.services.semantic_layer.parser import semantic_parser

router = APIRouter()

@router.get("/")
@cache(expire=300)
def list_metrics():
    try:
        data = semantic_parser._load()
        return {"metrics": data.get("metrics", [])}
    except Exception as e:
        return {"metrics": [], "error": str(e)}
