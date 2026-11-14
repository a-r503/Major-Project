import os
from pathlib import Path
from pydantic import BaseModel

BASE_DIR = Path(__file__).resolve().parent.parent

class Settings(BaseModel):
    PROJECT_NAME: str = "FoodGuard AI"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    
    # Security
    SECRET_KEY: str = os.getenv("SECRET_KEY", "foodguard-super-secret-key-32chars-2026-hypersecure")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24  # 24 hours
    
    # Database
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        f"sqlite:///{BASE_DIR / 'foodguard.db'}"
    )
    
    # Paths
    STATIC_DIR: Path = BASE_DIR / "static"
    UPLOAD_DIR: Path = BASE_DIR / "static" / "uploads"
    ANNOTATED_DIR: Path = BASE_DIR / "static" / "annotated"
    WEIGHTS_DIR: Path = BASE_DIR / "models" / "weights"
    
    # LLM & AI Keys (Optional)
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")
    
    # Inference settings
    CONFIDENCE_THRESHOLD: float = 0.25
    TAMPER_SIMILARITY_THRESHOLD: float = 0.72

settings = Settings()

# Ensure directories exist
settings.UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
settings.ANNOTATED_DIR.mkdir(parents=True, exist_ok=True)
settings.WEIGHTS_DIR.mkdir(parents=True, exist_ok=True)
