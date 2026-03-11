import asyncio

import pytest
import pytest_asyncio
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import create_async_engine, async_sessionmaker, AsyncSession

from app.core.database import Base, get_db
from app.main import app

# Use a separate test database
TEST_DATABASE_URL = "postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce_test"

test_engine = create_async_engine(TEST_DATABASE_URL, echo=False, pool_size=5, max_overflow=0)
TestSessionLocal = async_sessionmaker(test_engine, class_=AsyncSession, expire_on_commit=False)


async def override_get_db():
    async with TestSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise


app.dependency_overrides[get_db] = override_get_db


@pytest.fixture(scope="session")
def event_loop():
    loop = asyncio.new_event_loop()
    yield loop
    loop.close()


@pytest_asyncio.fixture(autouse=True)
async def setup_db():
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
        await conn.run_sync(Base.metadata.create_all)
    yield
    async with test_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await test_engine.dispose()


@pytest_asyncio.fixture
async def client():
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as ac:
        yield ac


async def test_healthz(client: AsyncClient):
    response = await client.get("/healthz")
    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


async def test_signup(client: AsyncClient):
    response = await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "username": "testuser", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["user"]["email"] == "test@example.com"
    assert data["user"]["username"] == "testuser"
    assert data["user"]["is_admin"] is False


async def test_signup_duplicate_email(client: AsyncClient):
    await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "username": "testuser1", "password": "password123"},
    )
    response = await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "username": "testuser2", "password": "password123"},
    )
    assert response.status_code == 400
    assert "already registered" in response.json()["detail"]


async def test_login(client: AsyncClient):
    # Signup first
    await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "username": "testuser", "password": "password123"},
    )
    # Login
    response = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "password123"},
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data


async def test_login_wrong_password(client: AsyncClient):
    await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "username": "testuser", "password": "password123"},
    )
    response = await client.post(
        "/api/auth/login",
        json={"email": "test@example.com", "password": "wrongpassword"},
    )
    assert response.status_code == 401


async def test_get_me(client: AsyncClient):
    signup_resp = await client.post(
        "/api/auth/signup",
        json={"email": "test@example.com", "username": "testuser", "password": "password123"},
    )
    token = signup_resp.json()["access_token"]
    response = await client.get("/api/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert response.status_code == 200
    assert response.json()["email"] == "test@example.com"


async def test_get_products_empty(client: AsyncClient):
    response = await client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert data["products"] == []
    assert data["total"] == 0


async def test_cart_unauthenticated(client: AsyncClient):
    response = await client.get("/api/cart")
    assert response.status_code == 401


async def test_orders_unauthenticated(client: AsyncClient):
    response = await client.get("/api/orders")
    assert response.status_code == 401


async def test_product_search(client: AsyncClient):
    response = await client.get("/api/products?search=nonexistent")
    assert response.status_code == 200
    assert response.json()["total"] == 0


async def test_product_pagination(client: AsyncClient):
    response = await client.get("/api/products?page=1&page_size=5")
    assert response.status_code == 200
    data = response.json()
    assert data["page"] == 1
    assert data["page_size"] == 5
