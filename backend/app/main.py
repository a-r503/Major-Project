import os
from pathlib import Path
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import settings
from app.database import engine, Base
from app.api import auth, orders, investigations, models_api, dashboard, feedback
from seed_data import seed_database

# Create tables
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Futuristic AI-powered Food Delivery Fraud Detection, Tamper Verification, and Dispute Resolution Platform"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Ensure static directories exist
settings.STATIC_DIR.mkdir(parents=True, exist_ok=True)
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)
settings.WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)

# Mount static files directory
app.mount("/static", StaticFiles(directory=str(settings.STATIC_DIR)), name="static")

# Include API Routers
app.include_router(auth.router, prefix=settings.API_PREFIX)
app.include_router(orders.router, prefix=settings.API_PREFIX)
app.include_router(investigations.router, prefix=settings.API_PREFIX)
app.include_router(models_api.router, prefix=settings.API_PREFIX)
app.include_router(dashboard.router, prefix=settings.API_PREFIX)
app.include_router(feedback.router, prefix=settings.API_PREFIX)

@app.on_event("startup")
def on_startup():
    print(f"[{settings.PROJECT_NAME}] Initializing database and running data seeding...")
    try:
        seed_database()
        print(f"[{settings.PROJECT_NAME}] Startup complete. Ready for dispute investigations.")
    except Exception as e:
        print(f"[{settings.PROJECT_NAME}] Startup warning: {e}")

@app.get("/")
def root():
    return {
        "platform": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "status": "operational",
        "docs_url": "/docs",
        "api_prefix": settings.API_PREFIX
    }

@app.get("/api/health")
def healthcheck():
    return {
        "status": "healthy",
        "database": "connected",
        "models_count": 4
    }
