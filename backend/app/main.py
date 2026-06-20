from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, profiles, analysis, reports
from app.core.database import init_db
from app.core.seed import seed_demo_data

app = FastAPI(
    title="MAYAJAL API",
    description="AI-Powered Fake Profile & Scam Detection Framework",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup():
    await init_db()
    await seed_demo_data()

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(profiles.router, prefix="/api/profiles", tags=["Profiles"])
app.include_router(analysis.router, prefix="/api/analysis", tags=["Analysis"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])

@app.get("/")
async def root():
    return {"message": "MAYAJAL API is running", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}
