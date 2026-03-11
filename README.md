# ShopHub - E-Commerce Application

A full-stack e-commerce marketplace built with React, FastAPI, and PostgreSQL. Users can browse products, add items to a cart, place orders, and leave ratings. Admins can manage products and view all orders.

## Tech Stack

- **Frontend:** React 18 + TypeScript, Tailwind CSS, React Router, Axios
- **Backend:** Python FastAPI, SQLAlchemy ORM (async), JWT authentication
- **Database:** PostgreSQL

## Features

### User Features
- User signup and login (JWT authentication)
- Browse products with grid layout
- Product search and category filtering
- Product detail page with ratings/reviews
- Add/remove products from cart
- Checkout simulation with shipping address
- View order history

### Admin Features
- Admin dashboard
- Add, edit, delete products
- Upload product images
- View all orders

### Additional
- Product image upload
- Pagination for product listings
- Basic product rating system (1-5 stars with reviews)

## Project Structure

```
ecommerce-app/
├── backend/
│   ├── app/
│   │   ├── core/          # Config, database, security
│   │   ├── models/        # SQLAlchemy models
│   │   ├── schemas/       # Pydantic schemas
│   │   ├── services/      # Business logic
│   │   ├── routes/        # API endpoints
│   │   ├── uploads/       # Product image uploads
│   │   └── main.py        # FastAPI application
│   ├── tests/             # Unit tests
│   └── pyproject.toml
├── frontend/
│   ├── src/
│   │   ├── api/           # API client functions
│   │   ├── components/    # Reusable components
│   │   ├── context/       # Auth and Cart context
│   │   ├── pages/         # Page components
│   │   └── types/         # TypeScript types
│   └── package.json
└── README.md
```

## Prerequisites

- Python 3.12+
- Node.js 18+
- PostgreSQL 14+
- Poetry (Python package manager)

## Setup Instructions

### 1. Clone the repository

```bash
git clone <repo-url>
cd ecommerce-app
```

### 2. Set up PostgreSQL

```bash
# Start PostgreSQL service
sudo service postgresql start

# Create the database
sudo -u postgres psql -c "ALTER USER postgres PASSWORD 'postgres';"
sudo -u postgres psql -c "CREATE DATABASE ecommerce;"

# For running tests, also create:
sudo -u postgres psql -c "CREATE DATABASE ecommerce_test;"
```

### 3. Backend Setup

```bash
cd backend

# Install dependencies
poetry install

# Create .env file
cat > .env << EOF
DATABASE_URL=postgresql+asyncpg://postgres:postgres@localhost:5432/ecommerce
SECRET_KEY=super-secret-key-change-in-production
EOF

# Start the development server
poetry run fastapi dev app/main.py
```

The backend API will be available at http://localhost:8000

### 4. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Create .env file
echo "VITE_API_URL=http://localhost:8000" > .env

# Start the development server
npm run dev
```

The frontend will be available at http://localhost:5173

### 5. Create an Admin User

After starting both servers, sign up as a regular user via the UI. Then promote the user to admin:

```bash
sudo -u postgres psql -d ecommerce -c "UPDATE users SET is_admin = true WHERE email = 'your-email@example.com';"
```

Log out and back in to see the Admin dashboard.

## Running Tests

```bash
cd backend
poetry run pytest tests/ -v
```

## API Endpoints

### Auth
- `POST /api/auth/signup` - Register a new user
- `POST /api/auth/login` - Login and get JWT token
- `GET /api/auth/me` - Get current user info

### Products
- `GET /api/products` - List products (supports pagination, search, category filter)
- `GET /api/products/{id}` - Get product details
- `POST /api/products` - Create product (admin)
- `PUT /api/products/{id}` - Update product (admin)
- `DELETE /api/products/{id}` - Delete product (admin)
- `POST /api/products/{id}/image` - Upload product image (admin)
- `POST /api/products/{id}/ratings` - Rate a product (authenticated)
- `GET /api/products/{id}/ratings` - Get product ratings
- `GET /api/products/categories` - List all categories

### Cart
- `GET /api/cart` - View cart
- `POST /api/cart` - Add item to cart
- `PUT /api/cart/{item_id}` - Update cart item quantity
- `DELETE /api/cart/{item_id}` - Remove item from cart

### Orders
- `POST /api/orders/checkout` - Place an order from cart
- `GET /api/orders` - Get user's order history
- `GET /api/orders/all` - Get all orders (admin)
- `GET /api/orders/{id}` - Get order details
