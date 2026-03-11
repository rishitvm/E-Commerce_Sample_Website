from pydantic import BaseModel
from typing import Optional, List


class CartItemAdd(BaseModel):
    product_id: int
    quantity: int = 1


class CartItemUpdate(BaseModel):
    quantity: int


class CartItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: str
    product_price: float
    product_image: Optional[str] = None
    quantity: int
    subtotal: float

    model_config = {"from_attributes": True}


class CartResponse(BaseModel):
    items: List[CartItemResponse]
    total: float
