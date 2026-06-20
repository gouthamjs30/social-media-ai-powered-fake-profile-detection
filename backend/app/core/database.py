import os
import certifi
from motor.motor_asyncio import AsyncIOMotorClient
from beanie import init_beanie
from app.models.user import User
from app.models.profile import SuspiciousProfile
from app.models.report import FraudReport

MONGO_URL = os.getenv("MONGO_URL", "mongodb://mongo:27017")
DB_NAME = os.getenv("DB_NAME", "mayajal")

client: AsyncIOMotorClient = None

async def init_db():
    global client
    tls_opts = {"tlsCAFile": certifi.where()} if MONGO_URL.startswith("mongodb+srv") else {}
    client = AsyncIOMotorClient(MONGO_URL, **tls_opts)
    await init_beanie(
        database=client[DB_NAME],
        document_models=[User, SuspiciousProfile, FraudReport]
    )

async def get_db():
    return client[DB_NAME]
