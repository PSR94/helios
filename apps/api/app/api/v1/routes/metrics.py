from fastapi import APIRouter
from app.services.semantic_layer.parser import semantic_parser

router = APIRouter()

@router.get("/")
def list_metrics():
    try:
        data = semantic_parser._load()
        return {"metrics": data.get("metrics", [])}
    except Exception as e:
        return {"metrics": [], "error": str(e)}
