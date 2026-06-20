from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime
from enum import Enum

class Platform(str, Enum):
    instagram = "instagram"
    facebook = "facebook"
    linkedin = "linkedin"
    twitter = "twitter"
    telegram = "telegram"
    whatsapp = "whatsapp"
    other = "other"

class AnalysisStatus(str, Enum):
    pending = "pending"
    analyzing = "analyzing"
    completed = "completed"
    failed = "failed"

class SuspiciousProfile(Document):
    submitted_by: str
    platform: Platform
    username: Optional[str] = None
    profile_url: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    post_count: Optional[int] = None
    account_age_days: Optional[int] = None
    profile_image_url: Optional[str] = None
    sample_posts: Optional[List[str]] = []
    notes: Optional[str] = None
    status: AnalysisStatus = AnalysisStatus.pending
    fraud_score: Optional[float] = None
    risk_level: Optional[str] = None
    analysis_results: Optional[dict] = None
    created_at: datetime = datetime.utcnow()
    analyzed_at: Optional[datetime] = None

    class Settings:
        name = "suspicious_profiles"

class ProfileSubmit(BaseModel):
    platform: Platform
    username: Optional[str] = None
    profile_url: Optional[str] = None
    display_name: Optional[str] = None
    bio: Optional[str] = None
    follower_count: Optional[int] = None
    following_count: Optional[int] = None
    post_count: Optional[int] = None
    account_age_days: Optional[int] = None
    profile_image_url: Optional[str] = None
    sample_posts: Optional[List[str]] = []
    notes: Optional[str] = None
