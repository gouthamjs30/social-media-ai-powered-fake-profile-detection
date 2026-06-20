from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from typing import List
from beanie import PydanticObjectId
from app.models.report import FraudReport
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()

@router.get("/profile/{profile_id}")
async def get_report_by_profile(profile_id: str, current_user: User = Depends(get_current_user)):
    report = await FraudReport.find_one(FraudReport.profile_id == profile_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report

@router.get("/all")
async def get_all_reports(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "investigator", "organization"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    reports = await FraudReport.find_all().to_list()
    return reports

@router.get("/{report_id}")
async def get_report(report_id: str, current_user: User = Depends(get_current_user)):
    report = await FraudReport.get(PydanticObjectId(report_id))
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report
