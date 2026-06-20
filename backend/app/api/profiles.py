from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import List
from datetime import datetime
from app.models.profile import SuspiciousProfile, ProfileSubmit, AnalysisStatus
from app.models.user import User
from app.core.security import get_current_user

router = APIRouter()


class FetchRequest(BaseModel):
    platform: str
    username: str


@router.post("/fetch-profile")
async def fetch_profile(data: FetchRequest, current_user: User = Depends(get_current_user)):
    """Attempt to auto-fetch public profile data for the given platform/username."""
    import asyncio
    from app.services.profile_fetch import fetch_profile as do_fetch
    loop = asyncio.get_event_loop()
    result = await loop.run_in_executor(None, do_fetch, data.platform, data.username)
    return result


@router.post("/submit", status_code=201)
async def submit_profile(data: ProfileSubmit, current_user: User = Depends(get_current_user)):
    profile = SuspiciousProfile(
        submitted_by=str(current_user.id),
        **data.dict()
    )
    await profile.insert()

    # Auto-run AI analysis immediately after submission
    try:
        from app.services.ai_analysis import analyze_profile
        from app.models.report import FraudReport

        profile.status = AnalysisStatus.analyzing
        await profile.save()

        results = analyze_profile(profile.dict())

        profile.fraud_score = results["fraud_score"]
        profile.risk_level = results["risk_level"]
        profile.analysis_results = results
        profile.status = AnalysisStatus.completed
        profile.analyzed_at = datetime.utcnow()
        await profile.save()

        report = FraudReport(
            profile_id=str(profile.id),
            generated_by=str(current_user.id),
            fraud_score=results["fraud_score"],
            risk_level=results["risk_level"],
            image_analysis=results.get("image_analysis"),
            text_analysis=results.get("text_analysis"),
            behavioral_analysis=results.get("behavioral_analysis"),
            network_analysis=results.get("network_analysis"),
            summary=results.get("summary", ""),
            recommendations=results.get("recommendations", []),
        )
        await report.insert()

        return {
            "id": str(profile.id),
            "status": "completed",
            "fraud_score": results["fraud_score"],
            "risk_level": results["risk_level"],
        }
    except Exception as e:
        print(f"Auto-analysis failed: {e}")
        profile.status = AnalysisStatus.pending
        await profile.save()
        return {"id": str(profile.id), "status": "pending"}


@router.get("/my", response_model=List[dict])
async def my_profiles(current_user: User = Depends(get_current_user)):
    profiles = await SuspiciousProfile.find(
        SuspiciousProfile.submitted_by == str(current_user.id)
    ).to_list()
    return [
        {
            "id": str(p.id),
            "platform": p.platform,
            "username": p.username,
            "display_name": p.display_name,
            "status": p.status,
            "fraud_score": p.fraud_score,
            "risk_level": p.risk_level,
            "created_at": p.created_at,
            "analyzed_at": p.analyzed_at,
        }
        for p in profiles
    ]


@router.get("/all")
async def all_profiles(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "investigator", "organization"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")
    profiles = await SuspiciousProfile.find_all().to_list()
    return [
        {
            "id": str(p.id),
            "platform": p.platform,
            "username": p.username,
            "display_name": p.display_name,
            "submitted_by": p.submitted_by,
            "status": p.status,
            "fraud_score": p.fraud_score,
            "risk_level": p.risk_level,
            "created_at": p.created_at,
            "analyzed_at": p.analyzed_at,
        }
        for p in profiles
    ]


@router.get("/{profile_id}")
async def get_profile(profile_id: str, current_user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    profile = await SuspiciousProfile.get(PydanticObjectId(profile_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if str(profile.submitted_by) != str(current_user.id) and current_user.role not in ("admin", "investigator"):
        raise HTTPException(status_code=403, detail="Access denied")
    return profile


@router.delete("/{profile_id}")
async def delete_profile(profile_id: str, current_user: User = Depends(get_current_user)):
    from beanie import PydanticObjectId
    profile = await SuspiciousProfile.get(PydanticObjectId(profile_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")
    if str(profile.submitted_by) != str(current_user.id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Access denied")
    await profile.delete()
    return {"message": "Profile deleted"}
