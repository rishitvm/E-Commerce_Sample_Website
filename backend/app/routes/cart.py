from fastapi import APIRouter, Depends
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartResponse
from app.services.cart_service import get_cart, add_to_cart, update_cart_item, remove_from_cart

router = APIRouter(prefix="/api/cart", tags=["cart"])


@router.get("", response_model=CartResponse)
async def view_cart(
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await get_cart(db, user)


@router.post("", response_model=CartResponse)
async def add_item(
    cart_data: CartItemAdd,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await add_to_cart(db, user, cart_data)


@router.put("/{item_id}", response_model=CartResponse)
async def update_item(
    item_id: int,
    update_data: CartItemUpdate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await update_cart_item(db, user, item_id, update_data)


@router.delete("/{item_id}", response_model=CartResponse)
async def remove_item(
    item_id: int,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await remove_from_cart(db, user, item_id)
