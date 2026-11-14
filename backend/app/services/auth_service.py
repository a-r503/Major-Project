import datetime
import uuid
from typing import Optional, Dict, Any
import jwt
import hashlib
from fastapi import HTTPException, status, Depends
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.db_models import User, LoginActivity
from app.schemas.schemas import TokenData

oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_PREFIX}/auth/login", auto_error=False)

def hash_password(password: str) -> str:
    # Secure salt-based SHA-256 password hashing
    salt = "foodguard_salt_2026"
    return hashlib.sha256(f"{salt}{password}".encode("utf-8")).hexdigest()

def verify_password(plain_password: str, hashed_password: str) -> bool:
    return hash_password(plain_password) == hashed_password

def create_access_token(data: dict, expires_delta: Optional[datetime.timedelta] = None) -> str:
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.datetime.utcnow() + expires_delta
    else:
        expire = datetime.datetime.utcnow() + datetime.timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt

def decode_token(token: str) -> Optional[TokenData]:
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        email: str = payload.get("sub")
        role: str = payload.get("role")
        user_id: int = payload.get("user_id")
        restaurant_id: Optional[int] = payload.get("restaurant_id")
        delivery_partner_id: Optional[int] = payload.get("delivery_partner_id")
        if email is None:
            return None
        return TokenData(
            email=email, 
            role=role, 
            user_id=user_id, 
            restaurant_id=restaurant_id, 
            delivery_partner_id=delivery_partner_id
        )
    except Exception:
        return None

def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)) -> User:
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication required. Please sign in to access this resource."
        )

    token_data = decode_token(token)
    if token_data is None or token_data.email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired authentication session."
        )
    
    user = db.query(User).filter(User.email == token_data.email).first()
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User account no longer exists."
        )
    return user

def record_login_activity(
    db: Session,
    user_id: int,
    success: bool,
    event_type: str = "login",
    ip_address: str = "127.0.0.1",
    user_agent: Optional[str] = "FoodGuard-Client"
) -> LoginActivity:
    session_id = f"sess_{uuid.uuid4().hex[:12]}"
    activity = LoginActivity(
        user_id=user_id,
        session_id=session_id,
        ip_address=ip_address,
        user_agent=user_agent,
        success=success,
        event_type=event_type
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return activity
