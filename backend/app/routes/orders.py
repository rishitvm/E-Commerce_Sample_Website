from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.models.user import User
from app.schemas.order import OrderResponse, CheckoutRequest, OrderListResponse
from app.services.order_service import checkout, get_user_orders, get_all_orders, get_order_by_id

router = APIRouter(prefix="/api/orders", tags=["orders"])


@router.post("/checkout", response_model=OrderResponse)
async def place_order(
    checkout_data: CheckoutRequest,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await checkout(db, user, checkout_data)


@router.get("", response_model=OrderListResponse)
async def my_orders(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_user_orders(db, user)


@router.get("/all", response_model=OrderListResponse)
async def all_orders(
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await get_all_orders(db)


@router.get("/{order_id}", response_model=OrderResponse)
async def get_order(
    order_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_order_by_id(db, order_id, user)
