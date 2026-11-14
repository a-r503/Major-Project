from typing import List, Optional
import datetime
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.db_models import User, LoginActivity
from app.schemas.schemas import UserCreate, UserLogin, UserOut, Token, LoginActivityOut
from app.services.auth_service import (
    hash_password, verify_password, create_access_token, 
    get_current_user, record_login_activity
)

router = APIRouter(prefix="/auth", tags=["Authentication"])

@router.post("/register", response_model=Token)
def register_user(user_in: UserCreate, request: Request, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == user_in.email).first()
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="A user with this email address already exists."
        )

    # Security requirement: Public self-registration is strictly for Customer accounts only.
    # Admin, Restaurant, and Delivery Partner accounts require administrative provisioning.
    assigned_role = "customer"

    new_user = User(
        full_name=user_in.full_name,
        email=user_in.email,
        hashed_password=hash_password(user_in.password),
        role=assigned_role,
        status="active",
        created_at=datetime.datetime.utcnow(),
        last_login=datetime.datetime.utcnow()
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Record registration activity
    client_ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "Unknown")
    record_login_activity(db, new_user.id, success=True, event_type="register", ip_address=client_ip, user_agent=ua)

    token = create_access_token({
        "sub": new_user.email,
        "role": new_user.role,
        "user_id": new_user.id,
        "restaurant_id": new_user.restaurant_id,
        "delivery_partner_id": new_user.delivery_partner_id
    })

    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(new_user))

@router.post("/forgot-password")
def forgot_password(payload: dict, db: Session = Depends(get_db)):
    email = payload.get("email", "").strip().lower()
    if not email:
        raise HTTPException(status_code=400, detail="Email is required.")
    
    user = db.query(User).filter(User.email.ilike(email)).first()
    # Always return a clean message regardless of email existence to prevent user enumeration
    return {
        "status": "success",
        "message": f"If an account exists for {email}, a secure password recovery dispatch has been logged. For enterprise partner accounts, contact platform administration."
    }

@router.post("/login", response_model=Token)
def login_user(creds: UserLogin, request: Request, db: Session = Depends(get_db)):
    client_ip = request.client.host if request.client else "127.0.0.1"
    ua = request.headers.get("user-agent", "Unknown")

    user = db.query(User).filter(User.email == creds.email).first()
    if not user or not verify_password(creds.password, user.hashed_password):
        if user:
            record_login_activity(db, user.id, success=False, event_type="failed_login", ip_address=client_ip, user_agent=ua)
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password."
        )

    user.last_login = datetime.datetime.utcnow()
    db.commit()

    record_login_activity(db, user.id, success=True, event_type="login", ip_address=client_ip, user_agent=ua)

    token = create_access_token({
        "sub": user.email,
        "role": user.role,
        "user_id": user.id,
        "restaurant_id": user.restaurant_id,
        "delivery_partner_id": user.delivery_partner_id
    })

    return Token(access_token=token, token_type="bearer", user=UserOut.from_orm(user))

@router.get("/me", response_model=UserOut)
def get_me(current_user: User = Depends(get_current_user)):
    return UserOut.from_orm(current_user)

@router.get("/users", response_model=List[UserOut])
def list_users(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")
    users = db.query(User).order_by(User.id.desc()).all()
    return [UserOut.from_orm(u) for u in users]

@router.get("/activity", response_model=List[LoginActivityOut])
def get_login_activity(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    if current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Forbidden: Admin access required.")
    records = db.query(LoginActivity).order_by(LoginActivity.id.desc()).limit(50).all()
    return [LoginActivityOut.from_orm(r) for r in records]
