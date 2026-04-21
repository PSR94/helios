from fastapi import APIRouter
from app.services.data_quality.checker import quality_checker

router = APIRouter()

@router.get("/status")
def get_quality_status():
    return quality_checker.run_checks()
