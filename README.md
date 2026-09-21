# NextShop - Modern E-commerce Platform

A full-stack e-commerce platform built with modern technologies, featuring a robust backend API and a dynamic frontend interface. This project demonstrates best practices in web development, including TypeScript, clean architecture, and Docker containerization.

## Overview

NextShop is a comprehensive e-commerce solution designed for scalability and maintainability. It provides a complete shopping experience with product management, shopping cart, order processing, discount codes, and multi-store support.

## Features

### Backend Features
- **Authentication & Authorization**: JWT-based auth with refresh tokens
- **Product Management**: Full CRUD operations with categories and variants
- **Media Management**: Image upload with Sharp processing and optimization
- **Shopping Cart**: Persistent cart with automatic calculations
- **Order Management**: Complete order lifecycle with status tracking
- **Discount System**: Flexible coupon and discount code management
- **Multi-Store Support**: Support for multiple stores with individual settings
- **Banner Management**: Dynamic banner system for promotions
- **Page Management**: Custom page creation with slug-based routing
- **Rate Limiting**: API protection with throttling
- **Security**: Helmet.js integration, CORS configuration
- **Logging**: Winston-based logging system
- **Database**: PostgreSQL with Drizzle ORM
- **API Documentation**: Swagger/OpenAPI documentation

### Frontend Features
- **Internationalization**: Multi-language support with next-intl
- **Responsive Design**: Mobile-first design with Tailwind CSS
- **State Management**: Zustand for efficient state handling
- **Form Validation**: React Hook Form with Zod schemas
- **UI Components**: Radix UI primitives with custom styling
- **Image Optimization**: Next.js Image component
- **SEO Optimized**: Meta tags and OpenGraph support
- **Product Catalog**: Advanced filtering and search
- **Shopping Cart**: Real-time cart updates
- **User Dashboard**: Order history and profile management
- **Checkout Process**: Multi-step checkout flow
- **Dark Mode Ready**: Theme support infrastructure

## Tech Stack

### Backend
- **Framework**: NestJS 10.3
- **Language**: TypeScript 5.3
- **Database**: PostgreSQL 14
- **ORM**: Drizzle ORM 0.29
- **Authentication**: Passport.js + JWT
- **Validation**: class-validator + class-transformer
- **Image Processing**: Sharp
- **Security**: Helmet, bcrypt
- **Logging**: Winston
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 4.5
- **Forms**: React Hook Form 7.50 + Zod 3.22
- **UI Components**: Radix UI
- **HTTP Client**: Axios 1.6
- **Internationalization**: next-intl 3.11
- **Icons**: Lucide React
- **Carousel**: Embla Carousel

### Infrastructure
- **Containerization**: Docker & Docker Compose
- **Database**: PostgreSQL 14
- **Reverse Proxy**: (Can be configured with Nginx)

## Prerequisites

Before you begin, ensure you have the following installed:
- **Node.js**: v18 or higher
- **npm**: v9 or higher
- **Docker**: v20 or higher (for containerized setup)
- **Docker Compose**: v2 or higher (for containerized setup)
- **PostgreSQL**: v14 or higher (for manual setup)

## Quick Start with Docker Compose

The easiest way to run the entire application stack:

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd base-sale-website
   ```

2. **Start all services**
   ```bash
   docker-compose up -d
   ```

3. **Check service health**
   ```bash
   docker-compose ps
   ```

4. **Access the application**
   - Frontend: http://localhost:3001
   - Backend API: http://localhost:3000/api
   - API Documentation: http://localhost:3000/api/docs
   - PostgreSQL: localhost:5432

5. **View logs**
   ```bash
   # All services
   docker-compose logs -f

   # Specific service
   docker-compose logs -f backend
   docker-compose logs -f frontend
   ```

6. **Stop services**
   ```bash
   docker-compose down

   # Stop and remove volumes (WARNING: deletes database data)
   docker-compose down -v
   ```

## Manual Setup Instructions

### Backend Setup

1. **Navigate to backend directory**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Setup database**
   ```bash
   # Make sure PostgreSQL is running
   # Create database: nextshop

   # Generate migrations
   npm run db:generate

   # Run migrations
   npm run db:migrate

   # (Optional) Seed database
   npm run db:seed
   ```

5. **Start backend server**
   ```bash
   # Development mode
   npm run start:dev

   # Production mode
   npm run build
   npm run start:prod
   ```

6. **Access API**
   - API: http://localhost:3000/api
   - Swagger Docs: http://localhost:3000/api/docs

### Frontend Setup

1. **Navigate to frontend directory**
   ```bash
   cd frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment**
   ```bash
   cp .env.example .env.local
   # Edit .env.local with your configuration
   ```

4. **Start frontend server**
   ```bash
   # Development mode
   npm run dev

   # Production mode
   npm run build
   npm run start
   ```

5. **Access application**
   - Frontend: http://localhost:3001

## Project Structure

```
base-sale-website/
├── backend/                    # NestJS backend application
│   ├── src/
│   │   ├── config/            # Configuration files
│   │   ├── db/                # Database schema and migrations
│   │   ├── modules/           # Feature modules
│   │   │   ├── auth/          # Authentication module
│   │   │   ├── user/          # User management
│   │   │   ├── product/       # Product management
│   │   │   ├── category/      # Category management
│   │   │   ├── cart/          # Shopping cart
│   │   │   ├── order/         # Order processing
│   │   │   ├── coupon/        # Coupon management
│   │   │   ├── discount-code/ # Discount codes
│   │   │   ├── banner/        # Banner management
│   │   │   ├── page/          # Page management
│   │   │   ├── store/         # Store management
│   │   │   └── media/         # Media upload
│   │   ├── shared/            # Shared utilities
│   │   ├── app.module.ts      # Root module
│   │   └── main.ts            # Application entry point
│   ├── uploads/               # Uploaded files
│   ├── Dockerfile             # Docker configuration
│   ├── .dockerignore          # Docker ignore rules
│   └── package.json           # Dependencies
│
├── frontend/                   # Next.js frontend application
│   ├── app/                   # Next.js App Router
│   │   └── [locale]/          # Internationalized routes
│   ├── components/            # React components
│   │   ├── layout/            # Layout components
│   │   ├── product/           # Product components
│   │   └── ui/                # UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utility functions
│   ├── store/                 # Zustand stores
│   ├── types/                 # TypeScript types
│   ├── messages/              # i18n translation files
│   ├── public/                # Static assets
│   ├── Dockerfile             # Docker configuration
│   ├── .dockerignore          # Docker ignore rules
│   └── package.json           # Dependencies
│
├── docker-compose.yml          # Docker Compose configuration
└── README.md                   # This file
```

## Environment Variables

### Backend Environment Variables

Create a `.env` file in the `backend/` directory:

```env
# Application
NODE_ENV=development
PORT=3000
API_PREFIX=api

# CORS
CORS_ORIGINS=http://localhost:3001,http://localhost:3000

# Database
DATABASE_URL=postgresql://username:password@localhost:5432/nextshop

# JWT
JWT_SECRET=your-super-secret-key-change-this-in-production
JWT_ACCESS_TOKEN_EXPIRY=15m
JWT_REFRESH_TOKEN_EXPIRY=7d
```

### Frontend Environment Variables

Create a `.env.local` file in the `frontend/` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000/api
NEXT_PUBLIC_IMAGE_URL=http://localhost:3000

# App Configuration
NEXT_PUBLIC_APP_NAME=NextShop
NEXT_PUBLIC_APP_URL=http://localhost:3001

# Feature Flags (optional)
NEXT_PUBLIC_ENABLE_ANALYTICS=false
NEXT_PUBLIC_ENABLE_CHAT_SUPPORT=false
```

## API Documentation

Once the backend is running, you can access the interactive API documentation:

- **Swagger UI**: http://localhost:3000/api/docs
- **OpenAPI JSON**: http://localhost:3000/api/docs-json

The API documentation includes:
- All available endpoints
- Request/response schemas
- Authentication requirements
- Example requests and responses
- Try-it-out functionality

## Development

### Backend Development

```bash
cd backend

# Run in watch mode
npm run start:dev

# Run linting
npm run lint

# Run tests
npm run test

# Run tests with coverage
npm run test:cov

# Generate database migrations
npm run db:generate

# Run migrations
npm run db:migrate

# Open Drizzle Studio (Database GUI)
npm run db:studio
```

### Frontend Development

```bash
cd frontend

# Run development server
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## Database Management

### Using Drizzle Kit

```bash
cd backend

# Generate migrations from schema changes
npm run db:generate

# Run migrations
npm run db:migrate

# Push schema directly (development only)
npm run db:push

# Open Drizzle Studio
npm run db:studio
```

### Database Backup

```bash
# Backup database
docker-compose exec postgres pg_dump -U nextshop nextshop > backup.sql

# Restore database
docker-compose exec -T postgres psql -U nextshop nextshop < backup.sql
```

## Production Deployment

### Using Docker Compose

1. Update environment variables in `docker-compose.yml`
2. Set strong passwords and secrets
3. Configure proper CORS origins
4. Deploy with:

```bash
docker-compose -f docker-compose.yml up -d
```

### Manual Deployment

1. Build backend:
   ```bash
   cd backend
   npm run build
   ```

2. Build frontend:
   ```bash
   cd frontend
   npm run build
   ```

3. Deploy built files to your server
4. Configure reverse proxy (Nginx/Apache)
5. Setup SSL certificates
6. Configure environment variables
7. Start applications with process manager (PM2)

## Performance Optimization

### Backend
- Connection pooling configured
- Query optimization with Drizzle ORM
- Redis caching (can be added)
- Rate limiting enabled
- Compression middleware
- Static file serving

### Frontend
- Next.js Image optimization
- Code splitting
- Dynamic imports
- Static page generation where possible
- Asset optimization
- Bundle size optimization

## Security Best Practices

- JWT token rotation
- Password hashing with bcrypt
- CORS configuration
- Rate limiting
- Helmet.js security headers
- Input validation
- SQL injection prevention (via ORM)
- XSS protection
- Environment variable protection

## Troubleshooting

### Docker Issues

**Services not starting:**
```bash
docker-compose down
docker-compose up -d --force-recreate
```

**Database connection errors:**
- Check PostgreSQL is running: `docker-compose ps`
- Verify DATABASE_URL in backend environment
- Check network connectivity

**Port already in use:**
```bash
# Find and kill process using port
lsof -i :3000  # or 3001
kill -9 <PID>
```

### Development Issues

**Module not found:**
```bash
# Clean install
rm -rf node_modules package-lock.json
npm install
```

**Database migration issues:**
```bash
# Reset database (WARNING: deletes all data)
npm run db:push
```

**Frontend build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

## Screenshots

_Screenshots and demo images will be added here_

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Acknowledgments

- NestJS team for the amazing framework
- Next.js team for the powerful React framework
- Drizzle team for the excellent ORM
- All contributors and open-source libraries used in this project
