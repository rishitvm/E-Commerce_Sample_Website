import os
import uuid

from fastapi import APIRouter, Depends, Query, UploadFile, File
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user, get_current_admin
from app.core.config import UPLOAD_DIR
from app.models.user import User
from app.schemas.product import (
    ProductCreate,
    ProductUpdate,
    ProductResponse,
    ProductListResponse,
    RatingCreate,
    RatingResponse,
)
from app.services.product_service import (
    get_products,
    get_product_by_id,
    create_product,
    update_product,
    update_product_image,
    delete_product,
    rate_product,
    get_product_ratings,
    get_categories,
)

router = APIRouter(prefix="/api/products", tags=["products"])


@router.get("", response_model=ProductListResponse)
async def list_products(
    page: int = Query(1, ge=1),
    page_size: int = Query(12, ge=1, le=100),
    search: str = Query(None),
    category: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    return await get_products(db, page=page, page_size=page_size, search=search, category=category)


@router.get("/categories", response_model=list[str])
async def list_categories(db: AsyncSession = Depends(get_db)):
    return await get_categories(db)


@router.get("/{product_id}", response_model=ProductResponse)
async def get_product(product_id: int, db: AsyncSession = Depends(get_db)):
    return await get_product_by_id(db, product_id)


@router.post("", response_model=ProductResponse)
async def add_product(
    product_data: ProductCreate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await create_product(db, product_data)


@router.put("/{product_id}", response_model=ProductResponse)
async def edit_product(
    product_id: int,
    product_data: ProductUpdate,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await update_product(db, product_id, product_data)


@router.delete("/{product_id}")
async def remove_product(
    product_id: int,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    return await delete_product(db, product_id)


@router.post("/{product_id}/image", response_model=ProductResponse)
async def upload_product_image(
    product_id: int,
    file: UploadFile = File(...),
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(get_current_admin),
):
    # Save file
    ext = os.path.splitext(file.filename or "image.png")[1]
    filename = f"{uuid.uuid4()}{ext}"
    filepath = os.path.join(UPLOAD_DIR, filename)

    content = await file.read()
    with open(filepath, "wb") as f:
        f.write(content)

    image_url = f"/uploads/{filename}"
    return await update_product_image(db, product_id, image_url)


@router.post("/{product_id}/ratings", response_model=RatingResponse)
async def add_rating(
    product_id: int,
    rating_data: RatingCreate,
    db: AsyncSession = Depends(get_db),
    user: User = Depends(get_current_user),
):
    return await rate_product(db, product_id, user, rating_data)


@router.get("/{product_id}/ratings", response_model=list[RatingResponse])
async def list_ratings(product_id: int, db: AsyncSession = Depends(get_db)):
    return await get_product_ratings(db, product_id)
