from fastapi import APIRouter, Depends, HTTPException, status
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.api import deps

router = APIRouter()

@router.get("")
def health_check(db: Session = Depends(deps.get_db)):
    try:
        db.execute(text("SELECT 1"))
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Database connection failed"
        )

    return {
        "status": "ok",
        "timestamp": datetime.now(timezone.utc).isoformat()
    }