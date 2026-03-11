from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.cart import CartItemAdd, CartItemUpdate, CartItemResponse, CartResponse


async def get_cart(db: AsyncSession, user: User) -> CartResponse:
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.user_id == user.id)
    )
    items = result.scalars().all()

    cart_items = []
    total = 0.0
    for item in items:
        subtotal = item.product.price * item.quantity
        total += subtotal
        cart_items.append(
            CartItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name,
                product_price=item.product.price,
                product_image=item.product.image_url,
                quantity=item.quantity,
                subtotal=round(subtotal, 2),
            )
        )

    return CartResponse(items=cart_items, total=round(total, 2))


async def add_to_cart(db: AsyncSession, user: User, cart_data: CartItemAdd) -> CartResponse:
    # Check product exists and has stock
    result = await db.execute(select(Product).where(Product.id == cart_data.product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    if product.stock < cart_data.quantity:
        raise HTTPException(status_code=400, detail="Insufficient stock")

    # Check if item already in cart
    result = await db.execute(
        select(CartItem).where(
            CartItem.user_id == user.id,
            CartItem.product_id == cart_data.product_id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.quantity += cart_data.quantity
        if existing.quantity > product.stock:
            raise HTTPException(status_code=400, detail="Insufficient stock")
    else:
        cart_item = CartItem(
            user_id=user.id,
            product_id=cart_data.product_id,
            quantity=cart_data.quantity,
        )
        db.add(cart_item)

    await db.flush()
    return await get_cart(db, user)


async def update_cart_item(
    db: AsyncSession, user: User, item_id: int, update_data: CartItemUpdate
) -> CartResponse:
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    if update_data.quantity <= 0:
        await db.delete(item)
    else:
        # Check stock
        result = await db.execute(select(Product).where(Product.id == item.product_id))
        product = result.scalar_one_or_none()
        if product and update_data.quantity > product.stock:
            raise HTTPException(status_code=400, detail="Insufficient stock")
        item.quantity = update_data.quantity

    await db.flush()
    return await get_cart(db, user)


async def remove_from_cart(db: AsyncSession, user: User, item_id: int) -> CartResponse:
    result = await db.execute(
        select(CartItem).where(CartItem.id == item_id, CartItem.user_id == user.id)
    )
    item = result.scalar_one_or_none()
    if not item:
        raise HTTPException(status_code=404, detail="Cart item not found")

    await db.delete(item)
    await db.flush()
    return await get_cart(db, user)


async def clear_cart(db: AsyncSession, user: User) -> None:
    result = await db.execute(
        select(CartItem).where(CartItem.user_id == user.id)
    )
    items = result.scalars().all()
    for item in items:
        await db.delete(item)
    await db.flush()
