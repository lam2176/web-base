import { registerAs } from '@nestjs/config';

const getRequiredEnv = (key: string, fallbackKey?: string): string => {
  const value = process.env[key] || (fallbackKey ? process.env[fallbackKey] : undefined);
  if (!value) {
    throw new Error(`Missing required environment variable: ${key}${fallbackKey ? ` or ${fallbackKey}` : ''}`);
  }
  return value;
};

/**
 * Admin JWT Configuration
 * Used for admin/staff authentication
 */
export const adminJwtConfig = registerAs('adminJwt', () => ({
  secret: getRequiredEnv('ADMIN_JWT_SECRET', 'JWT_SECRET'),
  accessTokenExpiry: process.env.ADMIN_JWT_ACCESS_TOKEN_EXPIRY || '15m',
  refreshTokenExpiry: process.env.ADMIN_JWT_REFRESH_TOKEN_EXPIRY || '7d',
}));

/**
 * Customer JWT Configuration
 * Used for customer authentication
 */
export const customerJwtConfig = registerAs('customerJwt', () => ({
  secret: getRequiredEnv('CUSTOMER_JWT_SECRET', 'JWT_SECRET'),
  accessTokenExpiry: process.env.CUSTOMER_JWT_ACCESS_TOKEN_EXPIRY || '7d',
  refreshTokenExpiry: process.env.CUSTOMER_JWT_REFRESH_TOKEN_EXPIRY || '30d',
}));
