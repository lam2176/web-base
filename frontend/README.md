# NextShop Frontend

Modern e-commerce frontend built with Next.js 14, featuring internationalization, responsive design, and efficient state management.

## Tech Stack

- **Framework**: Next.js 14.2 (App Router)
- **Language**: TypeScript 5.3
- **Styling**: Tailwind CSS 3.4
- **State Management**: Zustand 4.5
- **Form Handling**: React Hook Form 7.50 + Zod 3.22
- **UI Components**: Radix UI
- **HTTP Client**: Axios 1.6
- **Internationalization**: next-intl 3.11
- **Icons**: Lucide React
- **Carousel**: Embla Carousel
- **Date Utilities**: date-fns

## Features

- Multi-language support (English, Vietnamese)
- Responsive design with mobile-first approach
- Product catalog with filtering and search
- Shopping cart with persistent storage
- User authentication and profile management
- Admin dashboard for product management
- SEO optimized pages
- Image optimization with Next.js Image
- Form validation with comprehensive error handling
- Toast notifications
- Dark mode ready infrastructure

## Project Structure

```
frontend/
├── app/                          # Next.js App Router
│   ├── [locale]/                 # Internationalized routes
│   │   ├── layout.tsx            # Root layout with i18n
│   │   ├── page.tsx              # Home page
│   │   ├── products/             # Product pages
│   │   │   ├── page.tsx          # Products listing
│   │   │   └── products-content.tsx
│   │   └── admin/                # Admin pages
│   │       ├── layout.tsx        # Admin layout
│   │       ├── page.tsx          # Admin dashboard
│   │       └── products/         # Product management
│   └── globals.css               # Global styles
│
├── components/                   # React components
│   ├── layout/                   # Layout components
│   │   ├── Header.tsx            # Site header
│   │   ├── Footer.tsx            # Site footer
│   │   └── Navigation.tsx        # Navigation menu
│   ├── product/                  # Product components
│   │   ├── ProductCard.tsx       # Product card
│   │   ├── ProductGrid.tsx       # Product grid layout
│   │   └── ProductFilter.tsx     # Filter component
│   └── ui/                       # UI components (shadcn/ui)
│       ├── button.tsx            # Button component
│       ├── input.tsx             # Input component
│       ├── toast.tsx             # Toast notifications
│       └── ...                   # Other UI components
│
├── hooks/                        # Custom React hooks
│   └── use-toast.ts              # Toast notification hook
│
├── lib/                          # Utility functions
│   ├── api/                      # API client
│   │   ├── client.ts             # Axios instance
│   │   └── endpoints.ts          # API endpoints
│   └── utils.ts                  # General utilities
│
├── store/                        # Zustand state stores
│   ├── authStore.ts              # Authentication state
│   ├── cartStore.ts              # Shopping cart state
│   ├── storeStore.ts             # Store info state
│   └── index.ts                  # Store exports
│
├── types/                        # TypeScript types
│   ├── index.ts                  # Type definitions
│   └── api.ts                    # API types
│
├── messages/                     # i18n translations
│   ├── en.json                   # English translations
│   └── vi.json                   # Vietnamese translations
│
├── public/                       # Static assets
│   ├── images/                   # Image files
│   └── ...                       # Other assets
│
├── middleware.ts                 # Next.js middleware (i18n)
├── next.config.js                # Next.js configuration
├── tailwind.config.ts            # Tailwind configuration
├── tsconfig.json                 # TypeScript configuration
├── Dockerfile                    # Docker configuration
└── package.json                  # Dependencies
```

## Prerequisites

- Node.js 18 or higher
- npm 9 or higher
- Backend API running (see main README.md)

## Installation

1. **Install dependencies**
   ```bash
   npm install
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env.local
   ```

3. **Update environment variables**
   Edit `.env.local`:
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

## Available Scripts

### Development

```bash
# Start development server
npm run dev

# Development server runs at http://localhost:3001
```

### Production

```bash
# Build for production
npm run build

# Start production server
npm run start

# Production server runs at http://localhost:3001
```

### Code Quality

```bash
# Run ESLint
npm run lint

# Run TypeScript type checking
npm run type-check
```

## Environment Variables

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `NEXT_PUBLIC_API_URL` | Backend API base URL | `http://localhost:3000/api` |
| `NEXT_PUBLIC_IMAGE_URL` | Backend image server URL | `http://localhost:3000` |

### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_APP_NAME` | Application name | `NextShop` |
| `NEXT_PUBLIC_APP_URL` | Application URL | `http://localhost:3001` |
| `NEXT_PUBLIC_ENABLE_ANALYTICS` | Enable analytics | `false` |
| `NEXT_PUBLIC_ENABLE_CHAT_SUPPORT` | Enable chat support | `false` |

## Internationalization (i18n)

The application supports multiple languages using `next-intl`.

### Supported Languages

- English (en)
- Vietnamese (vi)

### Adding Translations

1. Add translations to `messages/en.json` and `messages/vi.json`
2. Use the `useTranslations` hook in components

### Usage Example

```typescript
'use client';

import { useTranslations } from 'next-intl';

export default function MyComponent() {
  const t = useTranslations('ComponentName');

  return (
    <div>
      <h1>{t('title')}</h1>
      <p>{t('description')}</p>
    </div>
  );
}
```

### Translation File Structure

```json
{
  "Common": {
    "appName": "NextShop",
    "home": "Home",
    "products": "Products",
    "cart": "Cart",
    "login": "Login",
    "logout": "Logout"
  },
  "HomePage": {
    "welcome": "Welcome to NextShop",
    "description": "Your one-stop shop for everything"
  },
  "ProductsPage": {
    "title": "Products",
    "filter": "Filter",
    "sort": "Sort"
  }
}
```

### Language Switching

```typescript
'use client';

import { useRouter, usePathname } from 'next/navigation';
import { useLocale } from 'next-intl';

export default function LanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const locale = useLocale();

  const switchLocale = (newLocale: string) => {
    const path = pathname.replace(`/${locale}`, `/${newLocale}`);
    router.push(path);
  };

  return (
    <div>
      <button onClick={() => switchLocale('en')}>English</button>
      <button onClick={() => switchLocale('vi')}>Tiếng Việt</button>
    </div>
  );
}
```

## State Management

The application uses Zustand for state management with localStorage persistence.

### Available Stores

#### Auth Store (`useAuthStore`)

Manages user authentication and profile.

```typescript
import { useAuthStore } from '@/store';

const { user, isAuthenticated, login, logout } = useAuthStore();
```

**State:**
- `user` - Current user object
- `accessToken` - JWT access token
- `refreshToken` - JWT refresh token
- `isAuthenticated` - Authentication status
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `login(email, password)` - Login user
- `register(data)` - Register new user
- `logout()` - Logout user
- `loadUser()` - Load current user from API
- `updateUser(data)` - Update user profile

#### Cart Store (`useCartStore`)

Manages shopping cart with persistence.

```typescript
import { useCartStore } from '@/store';

const { items, addItem, removeItem, clearCart, getSubtotal } = useCartStore();
```

**State:**
- `items` - Array of cart items
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `addItem(product, quantity, variant)` - Add item to cart
- `removeItem(productId, variantId)` - Remove item
- `updateQuantity(productId, quantity, variantId)` - Update quantity
- `clearCart()` - Clear all items
- `getTotalItems()` - Get total number of items
- `getSubtotal()` - Calculate subtotal

#### Store Store (`useStoreStore`)

Manages store information with caching.

```typescript
import { useStoreStore } from '@/store';

const { storeInfo, fetchStoreInfo } = useStoreStore();
```

**State:**
- `storeInfo` - Store information object
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `fetchStoreInfo(force)` - Fetch store info (cached for 5 minutes)

See [store/README.md](./store/README.md) for detailed documentation.

## Component Documentation

### UI Components (shadcn/ui)

The project uses [shadcn/ui](https://ui.shadcn.com/) components built on Radix UI primitives.

#### Button Component

```typescript
import { Button } from '@/components/ui/button';

<Button variant="default" size="md">
  Click me
</Button>

// Variants: default, destructive, outline, secondary, ghost, link
// Sizes: default, sm, lg, icon
```

#### Input Component

```typescript
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

<div>
  <Label htmlFor="email">Email</Label>
  <Input id="email" type="email" placeholder="Enter email" />
</div>
```

#### Toast Notifications

```typescript
import { useToast } from '@/hooks/use-toast';

const { toast } = useToast();

toast({
  title: "Success",
  description: "Item added to cart",
  variant: "default" // default, destructive
});
```

### Layout Components

#### Header Component

```typescript
import { Header } from '@/components/layout/Header';

// Features:
// - Logo and site name
// - Navigation menu
// - Language switcher
// - Cart icon with item count
// - User menu
```

#### Footer Component

```typescript
import { Footer } from '@/components/layout/Footer';

// Features:
// - Store information
// - Contact details
// - Social media links
// - Newsletter subscription
```

### Product Components

#### Product Card

```typescript
import { ProductCard } from '@/components/product/ProductCard';

<ProductCard product={product} />

// Features:
// - Product image
// - Name and price
// - Add to cart button
// - Quick view
```

#### Product Grid

```typescript
import { ProductGrid } from '@/components/product/ProductGrid';

<ProductGrid products={products} />

// Features:
// - Responsive grid layout
// - Product cards
// - Loading states
// - Empty states
```

## API Integration

### API Client Setup

The application uses Axios with interceptors for API communication.

```typescript
// lib/api/client.ts
import axios from 'axios';

const apiClient = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor for auth token
apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized
    }
    return Promise.reject(error);
  }
);
```

### API Endpoints

```typescript
// lib/api/endpoints.ts
import { apiClient } from './client';

// Products
export const getProducts = (params?: any) =>
  apiClient.get('/products', { params });

export const getProduct = (id: string) =>
  apiClient.get(`/products/${id}`);

// Cart
export const addToCart = (data: any) =>
  apiClient.post('/cart/items', data);

// Orders
export const createOrder = (data: any) =>
  apiClient.post('/orders', data);

// Auth
export const login = (email: string, password: string) =>
  apiClient.post('/auth/login', { email, password });

export const register = (data: any) =>
  apiClient.post('/auth/register', data);
```

### Using API in Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { getProducts } from '@/lib/api/endpoints';
import { Product } from '@/types';

export default function ProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const response = await getProducts();
        setProducts(response.data.data);
      } catch (error) {
        console.error('Failed to fetch products:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      {products.map(product => (
        <div key={product.id}>{product.name}</div>
      ))}
    </div>
  );
}
```

## Form Handling

The application uses React Hook Form with Zod for validation.

### Form Example

```typescript
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const formSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type FormData = z.infer<typeof formSchema>;

export default function LoginForm() {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  const onSubmit = async (data: FormData) => {
    try {
      // Handle form submission
      console.log(data);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          type="email"
          {...register('email')}
        />
        {errors.email && (
          <p className="text-sm text-red-500">{errors.email.message}</p>
        )}
      </div>

      <div>
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          {...register('password')}
        />
        {errors.password && (
          <p className="text-sm text-red-500">{errors.password.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? 'Submitting...' : 'Login'}
      </Button>
    </form>
  );
}
```

## Styling

### Tailwind CSS

The project uses Tailwind CSS for styling with a custom configuration.

```typescript
// tailwind.config.ts
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        // Custom colors
      },
    },
  },
  plugins: [],
};
```

### CSS Classes Example

```typescript
<div className="container mx-auto px-4">
  <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
    Title
  </h1>
  <p className="mt-2 text-gray-600 dark:text-gray-300">
    Description
  </p>
  <Button className="mt-4 bg-blue-500 hover:bg-blue-600">
    Click me
  </Button>
</div>
```

### Responsive Design

```typescript
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
  {/* Responsive grid */}
</div>

<div className="flex flex-col md:flex-row gap-4">
  {/* Responsive flex */}
</div>

<img
  src="/image.jpg"
  className="w-full md:w-1/2 lg:w-1/3"
  alt="Responsive image"
/>
```

## TypeScript Types

### Product Types

```typescript
export interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice?: number;
  categoryId: string;
  images: string[];
  status: 'active' | 'inactive' | 'draft';
  stock: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  name: string;
  price: number;
  stock: number;
  attributes: Record<string, string>;
}
```

### Cart Types

```typescript
export interface CartItem {
  id: string;
  productId: string;
  variantId?: string;
  quantity: number;
  product?: Product;
  variant?: ProductVariant;
}
```

### User Types

```typescript
export interface User {
  id: string;
  email: string;
  fullName: string;
  phoneNumber?: string;
  role: 'admin' | 'customer';
  createdAt: string;
  updatedAt: string;
}
```

## Docker Support

### Build Docker Image

```bash
docker build -t nextshop-frontend .
```

### Run Docker Container

```bash
docker run -p 3001:3001 \
  -e NEXT_PUBLIC_API_URL=http://localhost:3000/api \
  -e NEXT_PUBLIC_IMAGE_URL=http://localhost:3000 \
  nextshop-frontend
```

### Docker Compose

See root `docker-compose.yml` for full stack deployment.

## Performance Optimization

### Image Optimization

```typescript
import Image from 'next/image';

<Image
  src="/product.jpg"
  alt="Product"
  width={300}
  height={300}
  priority // For above-the-fold images
/>
```

### Code Splitting

```typescript
import dynamic from 'next/dynamic';

const DynamicComponent = dynamic(() => import('./HeavyComponent'), {
  loading: () => <div>Loading...</div>,
  ssr: false // Disable SSR if needed
});
```

### Lazy Loading

```typescript
'use client';

import { lazy, Suspense } from 'react';

const LazyComponent = lazy(() => import('./Component'));

<Suspense fallback={<div>Loading...</div>}>
  <LazyComponent />
</Suspense>
```

## Troubleshooting

### Common Issues

**Module not found error:**
```bash
rm -rf node_modules package-lock.json .next
npm install
```

**Environment variables not working:**
- Ensure variables start with `NEXT_PUBLIC_` for client-side access
- Restart dev server after changing `.env.local`

**Build errors:**
```bash
# Clear Next.js cache
rm -rf .next
npm run build
```

**TypeScript errors:**
```bash
npm run type-check
```

## Best Practices

1. **Always use 'use client' for client components**
2. **Use TypeScript for type safety**
3. **Implement error boundaries**
4. **Handle loading states**
5. **Optimize images with Next.js Image**
6. **Use server components when possible**
7. **Implement proper SEO metadata**
8. **Follow Next.js App Router conventions**
9. **Keep components small and focused**
10. **Use proper accessibility attributes**

## Contributing

Please follow the project's coding standards and guidelines when contributing.

## License

MIT License - see LICENSE file for details.
