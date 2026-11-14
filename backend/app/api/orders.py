from typing import List, Optional
import datetime
import uuid
from pathlib import Path
from fastapi import APIRouter, Depends, HTTPException, status, Query, UploadFile, File
from sqlalchemy.orm import Session
from app.config import settings
from app.database import get_db
from app.models.db_models import Order, User, Restaurant, DeliveryPartner
from app.schemas.schemas import OrderOut
from app.services.auth_service import get_current_user

router = APIRouter(prefix="/orders", tags=["Orders"])

@router.get("", response_model=List[OrderOut])
def list_orders(
    search: Optional[str] = Query(None, description="Search by order number"),
    limit: int = 50,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Returns orders filtered strictly by the caller's role:
    - Customer: only their own orders
    - Restaurant: only orders for their kitchen
    - Delivery Partner: only orders assigned to them
    - Admin: all orders
    """
    q = db.query(Order)

    if current_user.role == "customer":
        q = q.filter(Order.customer_id == current_user.id)
    elif current_user.role == "restaurant":
        rest_id = current_user.restaurant_id or 1
        q = q.filter(Order.restaurant_id == rest_id)
    elif current_user.role == "delivery_partner":
        dp_id = current_user.delivery_partner_id or 1
        q = q.filter(Order.delivery_partner_id == dp_id)
    # Admin can view all

    if search:
        q = q.filter(Order.order_number.ilike(f"%{search.strip()}%"))

    orders = q.order_by(Order.id.desc()).limit(limit).all()
    return [OrderOut.from_orm(o) for o in orders]

@router.get("/{order_number}", response_model=OrderOut)
def get_order_by_number(
    order_number: str, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    order = db.query(Order).filter(Order.order_number.ilike(order_number.strip())).first()
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Order '{order_number}' not found."
        )

    # Permission verification
    if current_user.role == "customer" and order.customer_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied: You can only view your own orders.")
    elif current_user.role == "restaurant" and order.restaurant_id != (current_user.restaurant_id or 1):
        raise HTTPException(status_code=403, detail="Access denied: Order belongs to a different restaurant.")
    elif current_user.role == "delivery_partner" and order.delivery_partner_id != (current_user.delivery_partner_id or 1):
        raise HTTPException(status_code=403, detail="Access denied: Order is not assigned to you.")

    return OrderOut.from_orm(order)

@router.post("/{order_number}/dispatch-photo", response_model=OrderOut)
async def upload_restaurant_dispatch_photo(
    order_number: str,
    dispatch_photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Restaurant Kitchen uploads packaging proof before dispatching order to delivery partner.
    """
    if current_user.role not in ["restaurant", "admin"]:
        raise HTTPException(status_code=403, detail="Only restaurants can upload dispatch proof.")

    order = db.query(Order).filter(Order.order_number.ilike(order_number.strip())).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    ext = Path(dispatch_photo.filename).suffix or ".jpg"
    filename = f"rest_disp_{order.order_number}_{uuid.uuid4().hex[:6]}{ext}"
    dest = settings.UPLOAD_DIR / filename
    
    content = await dispatch_photo.read()
    with open(dest, "wb") as f:
        f.write(content)

    order.restaurant_package_image = f"/static/uploads/{filename}"
    order.restaurant_dispatch_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(order)
    return OrderOut.from_orm(order)

@router.post("/{order_number}/handover-photo", response_model=OrderOut)
async def upload_courier_handover_photo(
    order_number: str,
    handover_photo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Delivery Partner uploads delivery proof upon doorstep handover to customer.
    """
    if current_user.role not in ["delivery_partner", "admin"]:
        raise HTTPException(status_code=403, detail="Only delivery partners can upload handover proof.")

    order = db.query(Order).filter(Order.order_number.ilike(order_number.strip())).first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    ext = Path(handover_photo.filename).suffix or ".jpg"
    filename = f"cour_handover_{order.order_number}_{uuid.uuid4().hex[:6]}{ext}"
    dest = settings.UPLOAD_DIR / filename
    
    content = await handover_photo.read()
    with open(dest, "wb") as f:
        f.write(content)

    order.delivery_handover_image = f"/static/uploads/{filename}"
    order.delivery_handover_time = datetime.datetime.utcnow()
    db.commit()
    db.refresh(order)
    return OrderOut.from_orm(order)

@router.post("", response_model=OrderOut)
def create_sample_order(
    customer_id: int,
    restaurant_id: int,
    item_name: str = "Paneer Gourmet Pizza",
    amount: float = 16.99,
    db: Session = Depends(get_db)
):
    order_num = f"ORD-{uuid.uuid4().hex[:4].upper()}-X"
    order = Order(
        order_number=order_num,
        customer_id=customer_id,
        restaurant_id=restaurant_id,
        items_json=[{
            "item": item_name,
            "quantity": 1,
            "ingredients": ["paneer", "cheese", "tomato", "onion", "crust"],
            "price": amount
        }],
        total_amount=amount,
        status="delivered",
        order_date=datetime.datetime.utcnow(),
        restaurant_dispatch_time=datetime.datetime.utcnow() - datetime.timedelta(minutes=45),
        delivery_handover_time=datetime.datetime.utcnow() - datetime.timedelta(minutes=15)
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return OrderOut.from_orm(order)
