from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.order import Order, OrderItem
from app.models.cart import CartItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderResponse, OrderItemResponse, CheckoutRequest, OrderListResponse
from app.services.cart_service import clear_cart


async def checkout(db: AsyncSession, user: User, checkout_data: CheckoutRequest) -> OrderResponse:
    # Get cart items
    result = await db.execute(
        select(CartItem)
        .options(selectinload(CartItem.product))
        .where(CartItem.user_id == user.id)
    )
    cart_items = result.scalars().all()

    if not cart_items:
        raise HTTPException(status_code=400, detail="Cart is empty")

    # Calculate total and validate stock
    total = 0.0
    order_items_data = []
    for item in cart_items:
        if item.product.stock < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {item.product.name}",
            )
        subtotal = item.product.price * item.quantity
        total += subtotal
        order_items_data.append(
            {
                "product_id": item.product_id,
                "quantity": item.quantity,
                "price_at_purchase": item.product.price,
                "product_name": item.product.name,
            }
        )

    # Create order
    order = Order(
        user_id=user.id,
        total_amount=round(total, 2),
        status="confirmed",
        shipping_address=checkout_data.shipping_address,
    )
    db.add(order)
    await db.flush()

    # Create order items and reduce stock
    for item_data in order_items_data:
        product_name = item_data.pop("product_name")
        order_item = OrderItem(order_id=order.id, **item_data)
        db.add(order_item)

        # Reduce stock
        result = await db.execute(
            select(Product).where(Product.id == item_data["product_id"])
        )
        product = result.scalar_one_or_none()
        if product:
            product.stock -= item_data["quantity"]

    await db.flush()

    # Clear cart
    await clear_cart(db, user)

    # Fetch order with items
    return await get_order_by_id(db, order.id, user)


async def get_order_by_id(db: AsyncSession, order_id: int, user: User) -> OrderResponse:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.id == order_id)
    )
    order = result.scalar_one_or_none()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found")

    if not user.is_admin and order.user_id != user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return OrderResponse(
        id=order.id,
        user_id=order.user_id,
        total_amount=order.total_amount,
        status=order.status,
        shipping_address=order.shipping_address,
        created_at=order.created_at,
        items=[
            OrderItemResponse(
                id=item.id,
                product_id=item.product_id,
                product_name=item.product.name if item.product else None,
                quantity=item.quantity,
                price_at_purchase=item.price_at_purchase,
            )
            for item in order.items
        ],
    )


async def get_user_orders(db: AsyncSession, user: User) -> OrderListResponse:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .where(Order.user_id == user.id)
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    order_responses = []
    for order in orders:
        order_responses.append(
            OrderResponse(
                id=order.id,
                user_id=order.user_id,
                total_amount=order.total_amount,
                status=order.status,
                shipping_address=order.shipping_address,
                created_at=order.created_at,
                items=[
                    OrderItemResponse(
                        id=item.id,
                        product_id=item.product_id,
                        product_name=item.product.name if item.product else None,
                        quantity=item.quantity,
                        price_at_purchase=item.price_at_purchase,
                    )
                    for item in order.items
                ],
            )
        )

    return OrderListResponse(orders=order_responses, total=len(order_responses))


async def get_all_orders(db: AsyncSession) -> OrderListResponse:
    result = await db.execute(
        select(Order)
        .options(selectinload(Order.items).selectinload(OrderItem.product))
        .order_by(Order.created_at.desc())
    )
    orders = result.scalars().all()

    order_responses = []
    for order in orders:
        order_responses.append(
            OrderResponse(
                id=order.id,
                user_id=order.user_id,
                total_amount=order.total_amount,
                status=order.status,
                shipping_address=order.shipping_address,
                created_at=order.created_at,
                items=[
                    OrderItemResponse(
                        id=item.id,
                        product_id=item.product_id,
                        product_name=item.product.name if item.product else None,
                        quantity=item.quantity,
                        price_at_purchase=item.price_at_purchase,
                    )
                    for item in order.items
                ],
            )
        )

    return OrderListResponse(orders=order_responses, total=len(order_responses))
