# Zustand Stores Documentation

This directory contains Zustand state management stores for the Next.js frontend.

## Structure

```
store/
├── index.ts         # Export all stores
├── authStore.ts     # Authentication state
├── cartStore.ts     # Shopping cart state
├── storeStore.ts    # Store info state
└── README.md
```

## Stores Overview

### Auth Store (`useAuthStore`)

Manages user authentication state with localStorage persistence.

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
- `setUser(user)` - Set user object
- `setTokens(accessToken, refreshToken)` - Set tokens
- `loadUser()` - Load current user from API
- `updateUser(data)` - Update user profile
- `clearError()` - Clear error message

### Cart Store (`useCartStore`)

Manages shopping cart with localStorage persistence.

**State:**
- `items` - Array of cart items
- `isLoading` - Loading state
- `error` - Error message

**Actions:**
- `addItem(product, quantity, variant)` - Add item to cart
- `removeItem(productId, variantId)` - Remove item from cart
- `updateQuantity(productId, quantity, variantId)` - Update item quantity
- `clearCart()` - Clear all items
- `getTotalItems()` - Get total number of items
- `getSubtotal()` - Calculate subtotal
- `getItemCount(productId, variantId)` - Get item quantity
- `isInCart(productId, variantId)` - Check if item in cart
- `setError(error)` - Set error message

### Store Store (`useStoreStore`)

Manages store information with caching.

**State:**
- `storeInfo` - Store information object
- `isLoading` - Loading state
- `error` - Error message
- `lastFetched` - Last fetch timestamp

**Actions:**
- `fetchStoreInfo(force)` - Fetch store info (cached for 5 minutes)
- `setStoreInfo(storeInfo)` - Set store info
- `clearError()` - Clear error message

## Usage Examples

### Auth Store

```typescript
'use client';

import { useAuthStore } from '@/store';

export default function LoginPage() {
  const { login, logout, user, isAuthenticated, isLoading, error } = useAuthStore();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password123');
      console.log('Login successful!');
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <div>
          <p>Welcome, {user?.fullName}</p>
          <button onClick={logout}>Logout</button>
        </div>
      ) : (
        <button onClick={handleLogin} disabled={isLoading}>
          Login
        </button>
      )}
      {error && <p className="error">{error}</p>}
    </div>
  );
}
```

### Cart Store

```typescript
'use client';

import { useCartStore } from '@/store';
import { Product } from '@/types';

export default function ProductCard({ product }: { product: Product }) {
  const { addItem, removeItem, getItemCount, getTotalItems, getSubtotal } = useCartStore();

  const itemCount = getItemCount(product.id);
  const totalItems = getTotalItems();
  const subtotal = getSubtotal();

  const handleAddToCart = () => {
    addItem(product, 1);
  };

  const handleRemove = () => {
    removeItem(product.id);
  };

  return (
    <div>
      <h3>{product.name}</h3>
      <p>{product.price.toLocaleString('vi-VN')} VND</p>

      {itemCount > 0 ? (
        <div>
          <span>In cart: {itemCount}</span>
          <button onClick={handleRemove}>Remove</button>
        </div>
      ) : (
        <button onClick={handleAddToCart}>Add to Cart</button>
      )}

      <div className="cart-summary">
        <p>Total items: {totalItems}</p>
        <p>Subtotal: {subtotal.toLocaleString('vi-VN')} VND</p>
      </div>
    </div>
  );
}
```

### Cart with Variants

```typescript
'use client';

import { useCartStore } from '@/store';
import { Product, ProductVariant } from '@/types';

export default function ProductWithVariants({
  product,
  variants
}: {
  product: Product;
  variants: ProductVariant[];
}) {
  const { addItem, updateQuantity, getItemCount } = useCartStore();
  const [selectedVariant, setSelectedVariant] = useState(variants[0]);

  const itemCount = getItemCount(product.id, selectedVariant.id);

  const handleAddToCart = () => {
    addItem(product, 1, selectedVariant);
  };

  const handleQuantityChange = (newQuantity: number) => {
    updateQuantity(product.id, newQuantity, selectedVariant.id);
  };

  return (
    <div>
      <h3>{product.name}</h3>

      <select
        value={selectedVariant.id}
        onChange={(e) => {
          const variant = variants.find(v => v.id === e.target.value);
          if (variant) setSelectedVariant(variant);
        }}
      >
        {variants.map(variant => (
          <option key={variant.id} value={variant.id}>
            {variant.name} - {variant.price.toLocaleString('vi-VN')} VND
          </option>
        ))}
      </select>

      {itemCount > 0 ? (
        <div>
          <button onClick={() => handleQuantityChange(itemCount - 1)}>-</button>
          <span>{itemCount}</span>
          <button onClick={() => handleQuantityChange(itemCount + 1)}>+</button>
        </div>
      ) : (
        <button onClick={handleAddToCart}>Add to Cart</button>
      )}
    </div>
  );
}
```

### Store Store

```typescript
'use client';

import { useEffect } from 'react';
import { useStoreStore } from '@/store';

export default function Footer() {
  const { storeInfo, fetchStoreInfo, isLoading } = useStoreStore();

  useEffect(() => {
    fetchStoreInfo(); // Cached for 5 minutes
  }, [fetchStoreInfo]);

  if (isLoading) return <div>Loading...</div>;
  if (!storeInfo) return null;

  return (
    <footer>
      <div>
        <h3>{storeInfo.name}</h3>
        <p>{storeInfo.description}</p>
        <p>Email: {storeInfo.contactEmail}</p>
        <p>Phone: {storeInfo.contactPhone}</p>
      </div>

      <div>
        {storeInfo.socialLinks?.facebook && (
          <a href={storeInfo.socialLinks.facebook}>Facebook</a>
        )}
        {storeInfo.socialLinks?.instagram && (
          <a href={storeInfo.socialLinks.instagram}>Instagram</a>
        )}
      </div>
    </footer>
  );
}
```

### Protected Route with Auth

```typescript
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store';

export default function ProtectedPage() {
  const router = useRouter();
  const { isAuthenticated, isLoading, loadUser } = useAuthStore();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  if (isLoading) return <div>Loading...</div>;
  if (!isAuthenticated) return null;

  return <div>Protected content</div>;
}
```

### Clear Cart After Order

```typescript
'use client';

import { useCartStore } from '@/store';
import { createOrder } from '@/lib/api/endpoints';

export default function CheckoutPage() {
  const { items, clearCart, getSubtotal } = useCartStore();

  const handleCheckout = async () => {
    try {
      const orderData = {
        items: items.map(item => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
          unitPrice: item.variant?.price || item.product!.price
        })),
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
        shippingMethodId: 'shipping-id',
        paymentMethodId: 'payment-id'
      };

      const order = await createOrder(orderData);

      // Clear cart after successful order
      clearCart();

      console.log('Order created:', order.orderNumber);
    } catch (error) {
      console.error('Checkout failed:', error);
    }
  };

  return (
    <div>
      <h2>Checkout</h2>
      <p>Total items: {items.length}</p>
      <p>Subtotal: {getSubtotal().toLocaleString('vi-VN')} VND</p>
      <button onClick={handleCheckout}>Place Order</button>
    </div>
  );
}
```

## Persistence

- **Auth Store**: Persists `user`, `accessToken`, `refreshToken`, and `isAuthenticated` to localStorage
- **Cart Store**: Persists `items` to localStorage
- **Store Store**: No persistence (uses memory cache with 5-minute expiry)

## Best Practices

1. **Always use stores in client components** - Add `'use client'` directive
2. **Handle loading states** - Check `isLoading` before rendering
3. **Handle errors** - Display error messages from `error` state
4. **Clear cart after order** - Call `clearCart()` after successful checkout
5. **Load user on app start** - Call `loadUser()` in root layout
6. **Cache store info** - `fetchStoreInfo()` automatically caches for 5 minutes

## Type Safety

All stores are fully typed with TypeScript. Import types from `@/types`:

```typescript
import { Product, User, CartItem, StoreInfo } from '@/types';
```
