# NextShop Backend

E-commerce backend API built with NestJS, PostgreSQL, and Drizzle ORM.

## Features

- ✅ JWT Authentication with Refresh Token
- ✅ Role-based Access Control (Admin, Staff)
- ✅ Product Management with Variants and Images
- ✅ Hierarchical Categories
- ✅ CMS Pages (WordPress-style)
- ✅ Media Library with Image Optimization
- ✅ Banner/Slider Management
- ✅ Store Settings (Multi-currency, Shipping Fee)
- ✅ Event-based Coupons
- ✅ Discount Code System
- ✅ Order Management
- ✅ Shopping Cart Calculation
- ✅ Multi-language Support (Vietnamese, English)
- ✅ Swagger API Documentation
- ✅ Rate Limiting & Security (Helmet.js)

## Tech Stack

- **Framework**: NestJS 10+
- **Database**: PostgreSQL
- **ORM**: Drizzle ORM
- **Validation**: class-validator
- **Authentication**: JWT with Passport
- **Documentation**: Swagger/OpenAPI
- **File Upload**: Multer
- **Image Processing**: Sharp
- **Logging**: Winston
- **Security**: Helmet.js

## Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

## Installation

1. Install dependencies:
```bash
npm install
```

2. Create `.env` file from example:
```bash
cp .env.example .env
```

3. Configure your database and JWT secret in `.env`:
```env
DATABASE_URL=postgresql://username:password@localhost:5432/nextshop
JWT_SECRET=your-super-secret-key
```

4. Generate and run database migrations:
```bash
npm run db:generate
npm run db:migrate
```

5. (Optional) Seed sample data:
```bash
npm run db:seed
```

## Running the Application

### Development
```bash
npm run start:dev
```

### Production
```bash
npm run build
npm run start:prod
```

The API will be available at:
- **API**: http://localhost:3000/api
- **Swagger Docs**: http://localhost:3000/docs

## Database Commands

```bash
# Generate migration from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema changes directly (dev only)
npm run db:push

# Open Drizzle Studio (database GUI)
npm run db:studio

# Seed sample data
npm run db:seed
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new admin/staff user
- `POST /api/auth/login` - Login
- `POST /api/auth/refresh` - Refresh access token
- `POST /api/auth/logout` - Logout

### Products
- `GET /api/products` - Get all products (public, with filters)
- `GET /api/products/featured` - Get featured products (public)
- `GET /api/products/:id` - Get product by ID (public)
- `GET /api/products/slug/:slug` - Get product by slug (public)
- `GET /api/products/:id/related` - Get related products (public)
- `POST /api/products` - Create product (protected)
- `PUT /api/products/:id` - Update product (protected)
- `DELETE /api/products/:id` - Delete product (protected)

### Categories
- `GET /api/categories` - Get all categories (public)
- `GET /api/categories/root` - Get root categories (public)
- `GET /api/categories/:id/children` - Get child categories (public)
- `POST /api/categories` - Create category (protected)
- `PUT /api/categories/:id` - Update category (protected)
- `DELETE /api/categories/:id` - Delete category (protected)

### Media
- `POST /api/media/upload` - Upload media file (protected)
- `GET /api/media` - Get all media files (protected)
- `DELETE /api/media/:id` - Delete media file (protected)

### Pages
- `GET /api/pages` - Get all pages (public)
- `GET /api/pages/slug/:slug` - Get page by slug (public)
- `POST /api/pages` - Create page (protected)
- `PUT /api/pages/:id` - Update page (protected)
- `DELETE /api/pages/:id` - Delete page (protected)

### Banners
- `GET /api/banners/active` - Get active banners (public)
- `POST /api/banners` - Create banner (protected)
- `PUT /api/banners/:id` - Update banner (protected)
- `DELETE /api/banners/:id` - Delete banner (protected)

### Store Info
- `GET /api/store` - Get store information (public)
- `PUT /api/store` - Update store information (protected)

### Coupons
- `GET /api/coupons/active` - Get active coupons (public)
- `GET /api/coupons/validate/:code` - Validate coupon code (public)
- `POST /api/coupons` - Create coupon (protected)
- `PUT /api/coupons/:id` - Update coupon (protected)
- `DELETE /api/coupons/:id` - Delete coupon (protected)

### Discount Codes
- `POST /api/discount-codes/validate` - Validate discount code (public)
- `POST /api/discount-codes` - Create discount code (protected)
- `PUT /api/discount-codes/:id` - Update discount code (protected)
- `DELETE /api/discount-codes/:id` - Delete discount code (protected)

### Orders
- `POST /api/orders` - Create order (public)
- `GET /api/orders` - Get all orders (protected)
- `GET /api/orders/:id` - Get order by ID (protected)
- `PUT /api/orders/:id/status` - Update order status (protected)

### Cart
- `POST /api/cart/calculate` - Calculate cart totals (public)

## Project Structure

```
backend/
├── src/
│   ├── config/              # Configuration files
│   ├── db/
│   │   └── schema/          # Drizzle ORM schemas
│   ├── modules/             # Feature modules
│   │   ├── auth/
│   │   ├── user/
│   │   ├── media/
│   │   ├── category/
│   │   ├── product/
│   │   ├── page/
│   │   ├── banner/
│   │   ├── store/
│   │   ├── coupon/
│   │   ├── discount-code/
│   │   ├── order/
│   │   └── cart/
│   ├── shared/              # Shared utilities
│   │   ├── decorators/
│   │   ├── dto/
│   │   ├── filters/
│   │   ├── guards/
│   │   ├── interceptors/
│   │   └── utils/
│   ├── app.module.ts
│   └── main.ts
├── drizzle/
│   └── migrations/          # Database migrations
├── uploads/                 # Uploaded files
└── package.json
```

## Default Admin Account

After seeding, you can use:
- **Email**: admin@example.com
- **Password**: password123

## Environment Variables

See `.env.example` for all available configuration options.

## License

MIT
