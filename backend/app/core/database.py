import os
import ssl
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
    if MONGO_URL.startswith("mongodb+srv"):
        ssl_ctx = ssl.create_default_context(cafile=certifi.where())
        ssl_ctx.set_ciphers("DEFAULT@SECLEVEL=1")
        client = AsyncIOMotorClient(MONGO_URL, ssl_context=ssl_ctx)
    else:
        client = AsyncIOMotorClient(MONGO_URL)
    await init_beanie(
        database=client[DB_NAME],
        document_models=[User, SuspiciousProfile, FraudReport]
    )

async def get_db():
    return client[DB_NAME]
