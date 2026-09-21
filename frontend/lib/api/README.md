# API Client Documentation

This directory contains the API client configuration and endpoint functions for the Next.js frontend.

## Structure

```
lib/api/
├── axios.ts              # Axios instance with interceptors
├── endpoints/
│   ├── index.ts         # Export all endpoints
│   ├── auth.ts          # Authentication endpoints
│   ├── products.ts      # Product endpoints
│   ├── categories.ts    # Category endpoints
│   ├── cart.ts          # Cart endpoints
│   ├── orders.ts        # Order endpoints
│   ├── store.ts         # Store info endpoints
│   └── banners.ts       # Banner endpoints
└── README.md
```

## Configuration

### Environment Variables

Set the API base URL in `.env.local`:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000/api
```

### Axios Instance

The axios instance is configured with:
- Base URL from environment variable
- 30 second timeout
- JSON content type
- Automatic auth token injection
- Token refresh on 401 errors
- Error handling and formatting

## Usage

### Import Endpoints

```typescript
import { login, register } from '@/lib/api/endpoints';
// or
import * as authApi from '@/lib/api/endpoints/auth';
```

### Example: Login

```typescript
import { login } from '@/lib/api/endpoints';

try {
  const response = await login({
    email: 'user@example.com',
    password: 'password123'
  });

  console.log('User:', response.user);
  console.log('Access Token:', response.accessToken);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Example: Fetch Products

```typescript
import { getProducts } from '@/lib/api/endpoints';

const products = await getProducts({
  page: 1,
  limit: 20,
  categoryId: 'category-id',
  minPrice: 100000,
  maxPrice: 500000,
  sortBy: 'price',
  sortOrder: 'asc'
});

console.log('Products:', products.data);
console.log('Pagination:', products.pagination);
```

### Example: Create Order

```typescript
import { createOrder } from '@/lib/api/endpoints';

const order = await createOrder({
  items: [
    {
      productId: 'product-id',
      quantity: 2,
      unitPrice: 100000
    }
  ],
  customerInfo: {
    fullName: 'John Doe',
    email: 'john@example.com',
    phoneNumber: '0123456789'
  },
  shippingAddress: {
    address: '123 Main St',
    ward: 'Ward 1',
    district: 'District 1',
    province: 'Ho Chi Minh'
  },
  shippingMethodId: 'shipping-method-id',
  paymentMethodId: 'payment-method-id'
});
```

## Error Handling

All API functions throw errors on failure. Use try-catch blocks:

```typescript
import { handleApiError } from '@/lib/api/axios';

try {
  await someApiCall();
} catch (error) {
  const errorMessage = handleApiError(error);
  console.error(errorMessage);
}
```

## Authentication

The axios instance automatically:
1. Adds the access token to all requests
2. Refreshes the token when it expires (401 error)
3. Redirects to login if refresh fails

Tokens are stored in localStorage and managed by the auth store.

## Available Endpoints

### Auth
- `login(credentials)` - Login user
- `register(data)` - Register new user
- `logout()` - Logout user
- `getCurrentUser()` - Get current user profile
- `updateProfile(data)` - Update user profile
- `changePassword(data)` - Change password

### Products
- `getProducts(params)` - Get products with filters
- `getProductBySlug(slug)` - Get product by slug
- `getFeaturedProducts(limit)` - Get featured products
- `getRelatedProducts(productId, limit)` - Get related products
- `searchProducts(query, limit)` - Search products

### Categories
- `getCategories()` - Get all categories
- `getCategoryBySlug(slug)` - Get category by slug
- `getCategoryTree()` - Get category tree

### Cart
- `calculateCart(data)` - Calculate cart totals
- `validateCartItems(items)` - Validate cart items
- `applyVoucher(code, cartTotal)` - Apply voucher code

### Orders
- `createOrder(data)` - Create new order
- `getUserOrders(params)` - Get user's orders
- `getOrderById(orderId)` - Get order by ID
- `cancelOrder(orderId)` - Cancel order
- `getShippingMethods()` - Get shipping methods
- `getPaymentMethods()` - Get payment methods

### Store
- `getStoreInfo()` - Get store information
- `subscribeNewsletter(email)` - Subscribe to newsletter
- `submitContactForm(data)` - Submit contact form

### Banners
- `getActiveBanners()` - Get active banners
