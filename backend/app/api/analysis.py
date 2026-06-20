from fastapi import APIRouter, Depends, HTTPException
from datetime import datetime, timedelta
from beanie import PydanticObjectId
from app.models.profile import SuspiciousProfile, AnalysisStatus
from app.models.report import FraudReport
from app.models.user import User
from app.core.security import get_current_user
from app.services.ai_analysis import analyze_profile

router = APIRouter()


@router.post("/analyze/{profile_id}")
async def run_analysis(profile_id: str, current_user: User = Depends(get_current_user)):
    profile = await SuspiciousProfile.get(PydanticObjectId(profile_id))
    if not profile:
        raise HTTPException(status_code=404, detail="Profile not found")

    if str(profile.submitted_by) != str(current_user.id) and current_user.role not in ("admin", "investigator"):
        raise HTTPException(status_code=403, detail="Access denied")

    profile.status = AnalysisStatus.analyzing
    await profile.save()

    try:
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
            "profile_id": profile_id,
            "report_id": str(report.id),
            "fraud_score": results["fraud_score"],
            "risk_level": results["risk_level"],
            "summary": results.get("summary"),
            "recommendations": results.get("recommendations", []),
        }
    except Exception as e:
        profile.status = AnalysisStatus.failed
        await profile.save()
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")


@router.get("/stats")
async def get_stats(current_user: User = Depends(get_current_user)):
    if current_user.role not in ("admin", "investigator", "organization"):
        raise HTTPException(status_code=403, detail="Insufficient permissions")

    total = await SuspiciousProfile.count()
    completed = await SuspiciousProfile.find(SuspiciousProfile.status == AnalysisStatus.completed).count()
    pending = await SuspiciousProfile.find(SuspiciousProfile.status == AnalysisStatus.pending).count()
    total_users = await User.count()

    # Risk distribution — ai_analysis.py returns "High" / "Medium" / "Low"
    all_profiles = await SuspiciousProfile.find_all().to_list()
    high = sum(1 for p in all_profiles if (p.risk_level or "").lower() == "high")
    medium = sum(1 for p in all_profiles if (p.risk_level or "").lower() == "medium")
    safe = sum(1 for p in all_profiles if (p.risk_level or "").lower() == "low")

    # Platform distribution
    platform_dist: dict = {}
    for p in all_profiles:
        key = p.platform.value if hasattr(p.platform, 'value') else str(p.platform)
        platform_dist[key] = platform_dist.get(key, 0) + 1

    # Daily analysis counts for the last 7 days
    now = datetime.utcnow()
    daily = []
    for i in range(6, -1, -1):
        day = now - timedelta(days=i)
        start = day.replace(hour=0, minute=0, second=0, microsecond=0)
        end = day.replace(hour=23, minute=59, second=59, microsecond=999999)
        count = sum(
            1 for p in all_profiles
            if start <= p.created_at <= end
        )
        daily.append({"date": day.strftime("%b %d"), "count": count})

    return {
        "total_profiles": total,
        "total_users": total_users,
        "completed_analyses": completed,
        "pending_analyses": pending,
        "risk_distribution": {"high": high, "medium": medium, "low": safe},
        "platform_distribution": platform_dist,
        "daily_analyses": daily,
    }
