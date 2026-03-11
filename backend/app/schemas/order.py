from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime


class OrderItemResponse(BaseModel):
    id: int
    product_id: int
    product_name: Optional[str] = None
    quantity: int
    price_at_purchase: float

    model_config = {"from_attributes": True}


class OrderResponse(BaseModel):
    id: int
    user_id: int
    total_amount: float
    status: str
    shipping_address: Optional[str] = None
    created_at: Optional[datetime] = None
    items: List[OrderItemResponse] = []

    model_config = {"from_attributes": True}


class CheckoutRequest(BaseModel):
    shipping_address: str


class OrderListResponse(BaseModel):
    orders: List[OrderResponse]
    total: int
