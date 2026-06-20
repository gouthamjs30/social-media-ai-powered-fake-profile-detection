from beanie import Document
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime

class FraudReport(Document):
    profile_id: str
    generated_by: str
    fraud_score: float
    risk_level: str
    image_analysis: Optional[dict] = None
    text_analysis: Optional[dict] = None
    behavioral_analysis: Optional[dict] = None
    network_analysis: Optional[dict] = None
    summary: str
    recommendations: List[str] = []
    created_at: datetime = datetime.utcnow()

    class Settings:
        name = "fraud_reports"
