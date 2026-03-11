import math
from typing import Optional

from sqlalchemy import select, func, or_
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
from fastapi import HTTPException

from app.models.product import Product, ProductRating
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    RatingCreate,
    RatingResponse,
)


def _product_to_response(product: Product) -> ProductResponse:
    ratings = product.ratings if product.ratings else []
    avg_rating = sum(r.rating for r in ratings) / len(ratings) if ratings else None
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        category=product.category,
        image_url=product.image_url,
        created_at=product.created_at,
        updated_at=product.updated_at,
        average_rating=round(avg_rating, 1) if avg_rating else None,
        rating_count=len(ratings),
    )


async def get_products(
    db: AsyncSession,
    page: int = 1,
    page_size: int = 12,
    search: Optional[str] = None,
    category: Optional[str] = None,
) -> ProductListResponse:
    query = select(Product).options(selectinload(Product.ratings))

    if search:
        query = query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )
    if category:
        query = query.where(Product.category == category)

    # Count total
    count_query = select(func.count(Product.id))
    if search:
        count_query = count_query.where(
            or_(
                Product.name.ilike(f"%{search}%"),
                Product.description.ilike(f"%{search}%"),
            )
        )
    if category:
        count_query = count_query.where(Product.category == category)

    total_result = await db.execute(count_query)
    total = total_result.scalar() or 0

    # Paginate
    offset = (page - 1) * page_size
    query = query.offset(offset).limit(page_size).order_by(Product.created_at.desc())
    result = await db.execute(query)
    products = result.scalars().all()

    return ProductListResponse(
        products=[_product_to_response(p) for p in products],
        total=total,
        page=page,
        page_size=page_size,
        total_pages=math.ceil(total / page_size) if total > 0 else 0,
    )


async def get_product_by_id(db: AsyncSession, product_id: int) -> ProductResponse:
    result = await db.execute(
        select(Product).options(selectinload(Product.ratings)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")
    return _product_to_response(product)


async def create_product(db: AsyncSession, product_data: ProductCreate) -> ProductResponse:
    product = Product(**product_data.model_dump())
    db.add(product)
    await db.flush()
    await db.refresh(product)
    return ProductResponse(
        id=product.id,
        name=product.name,
        description=product.description,
        price=product.price,
        stock=product.stock,
        category=product.category,
        image_url=product.image_url,
        created_at=product.created_at,
        updated_at=product.updated_at,
        average_rating=None,
        rating_count=0,
    )


async def update_product(
    db: AsyncSession, product_id: int, product_data: ProductUpdate
) -> ProductResponse:
    result = await db.execute(
        select(Product).options(selectinload(Product.ratings)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    update_data = product_data.model_dump(exclude_unset=True)
    for key, value in update_data.items():
        setattr(product, key, value)

    await db.flush()
    await db.refresh(product)
    return _product_to_response(product)


async def update_product_image(db: AsyncSession, product_id: int, image_url: str) -> ProductResponse:
    result = await db.execute(
        select(Product).options(selectinload(Product.ratings)).where(Product.id == product_id)
    )
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    product.image_url = image_url
    await db.flush()
    await db.refresh(product)
    return _product_to_response(product)


async def delete_product(db: AsyncSession, product_id: int) -> dict:
    result = await db.execute(select(Product).where(Product.id == product_id))
    product = result.scalar_one_or_none()
    if not product:
        raise HTTPException(status_code=404, detail="Product not found")

    await db.delete(product)
    await db.flush()
    return {"message": "Product deleted successfully"}


async def rate_product(
    db: AsyncSession, product_id: int, user: User, rating_data: RatingCreate
) -> RatingResponse:
    if rating_data.rating < 1 or rating_data.rating > 5:
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")

    # Check product exists
    result = await db.execute(select(Product).where(Product.id == product_id))
    if not result.scalar_one_or_none():
        raise HTTPException(status_code=404, detail="Product not found")

    # Check if user already rated
    result = await db.execute(
        select(ProductRating).where(
            ProductRating.product_id == product_id,
            ProductRating.user_id == user.id,
        )
    )
    existing = result.scalar_one_or_none()

    if existing:
        existing.rating = rating_data.rating
        existing.review = rating_data.review
        await db.flush()
        await db.refresh(existing)
        return RatingResponse.model_validate(existing)
    else:
        rating = ProductRating(
            product_id=product_id,
            user_id=user.id,
            rating=rating_data.rating,
            review=rating_data.review,
        )
        db.add(rating)
        await db.flush()
        await db.refresh(rating)
        return RatingResponse.model_validate(rating)


async def get_product_ratings(db: AsyncSession, product_id: int) -> list[RatingResponse]:
    result = await db.execute(
        select(ProductRating).where(ProductRating.product_id == product_id)
    )
    ratings = result.scalars().all()
    return [RatingResponse.model_validate(r) for r in ratings]


async def get_categories(db: AsyncSession) -> list[str]:
    result = await db.execute(
        select(Product.category).where(Product.category.isnot(None)).distinct()
    )
    return [row[0] for row in result.all() if row[0]]
