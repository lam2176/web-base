import { drizzle } from 'drizzle-orm/postgres-js';
import * as postgresImport from 'postgres';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

// Import schemas
import { users } from './schema/user.schema';
import { categories } from './schema/category.schema';
import { products, productVariants, productImages } from './schema/product.schema';
import { pages } from './schema/page.schema';
import { banners } from './schema/banner.schema';
import { storeInfo } from './schema/store_info.schema';
import { coupons } from './schema/coupon.schema';
import { discountCodes } from './schema/discount_code.schema';

dotenv.config();

const postgres = (postgresImport as any).default || postgresImport;
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not defined');
}

const client = postgres(connectionString);
const db = drizzle(client);

async function seed() {
  console.log('🌱 Starting seed...');

  // Get admin credentials from environment
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const adminPassword = process.env.ADMIN_PASSWORD;

  if (!adminPassword) {
    console.warn('⚠️  WARNING: ADMIN_PASSWORD not set. Using default password for development only!');
    if (process.env.NODE_ENV === 'production') {
      throw new Error('ADMIN_PASSWORD must be set in production environment');
    }
  }

  try {
    // 1. Create Admin User
    console.log('👤 Creating admin user...');
    const hashedPassword = await bcrypt.hash(adminPassword || 'dev-password-change-me', 10);

    await db.insert(users).values({
      email: adminEmail,
      password: hashedPassword,
      role: 'admin',
    });

    // 2. Create Categories
    console.log('📁 Creating categories...');
    const categoryIds = await db.insert(categories).values([
      {
        nameVi: 'Điện thoại',
        nameEn: 'Smartphones',
        slug: 'smartphones',
        descriptionVi: 'Điện thoại thông minh các loại',
        descriptionEn: 'All kinds of smartphones',
        status: 'active',
        order: 1,
      },
      {
        nameVi: 'Laptop',
        nameEn: 'Laptops',
        slug: 'laptops',
        descriptionVi: 'Máy tính xách tay',
        descriptionEn: 'Portable computers',
        status: 'active',
        order: 2,
      },
      {
        nameVi: 'Phụ kiện',
        nameEn: 'Accessories',
        slug: 'accessories',
        descriptionVi: 'Phụ kiện công nghệ',
        descriptionEn: 'Tech accessories',
        status: 'active',
        order: 3,
      },
    ]).returning();

    // 3. Create Products
    console.log('📦 Creating products...');
    const productIds = await db.insert(products).values([
      {
        nameVi: 'iPhone 15 Pro Max',
        nameEn: 'iPhone 15 Pro Max',
        slug: 'iphone-15-pro-max',
        descriptionVi: 'iPhone 15 Pro Max - Điện thoại cao cấp nhất của Apple',
        descriptionEn: 'iPhone 15 Pro Max - Apple\'s flagship smartphone',
        originalPrice: '29990000',
        salePrice: '27990000',
        categoryId: categoryIds[0].id,
        stockQuantity: 50,
        featured: true,
        status: 'active',
      },
      {
        nameVi: 'MacBook Pro 14"',
        nameEn: 'MacBook Pro 14"',
        slug: 'macbook-pro-14',
        descriptionVi: 'MacBook Pro 14" - Hiệu năng mạnh mẽ với chip M3',
        descriptionEn: 'MacBook Pro 14" - Powerful performance with M3 chip',
        originalPrice: '45990000',
        salePrice: '43990000',
        categoryId: categoryIds[1].id,
        stockQuantity: 30,
        featured: true,
        status: 'active',
      },
    ]).returning();

    // 4. Create Product Variants
    console.log('🎨 Creating product variants...');
    await db.insert(productVariants).values([
      {
        productId: productIds[0].id,
        name: 'Storage',
        value: '256GB - Natural Titanium',
        priceAdjustment: '0',
        stockQuantity: 20,
      },
      {
        productId: productIds[0].id,
        name: 'Storage',
        value: '512GB - Blue Titanium',
        priceAdjustment: '5000000',
        stockQuantity: 15,
      },
    ]);

    // 5. Create Pages
    console.log('📄 Creating CMS pages...');
    await db.insert(pages).values([
      {
        titleVi: 'Về Chúng Tôi',
        titleEn: 'About Us',
        slug: 'about',
        contentVi: '<h1>Về NextShop</h1><p>Chúng tôi là cửa hàng công nghệ hàng đầu...</p>',
        contentEn: '<h1>About NextShop</h1><p>We are a leading tech store...</p>',
        status: 'active',
      },
      {
        titleVi: 'Chính Sách Bảo Hành',
        titleEn: 'Warranty Policy',
        slug: 'warranty',
        contentVi: '<h1>Chính Sách Bảo Hành</h1><p>Tất cả sản phẩm được bảo hành...</p>',
        contentEn: '<h1>Warranty Policy</h1><p>All products are covered by warranty...</p>',
        status: 'active',
      },
    ]);

    // 6. Create Banners
    console.log('🎪 Creating banners...');
    await db.insert(banners).values([
      {
        titleVi: 'Khuyến Mãi Tết 2024',
        titleEn: 'Lunar New Year Sale 2024',
        link: '/products',
        order: 1,
        status: 'active',
      },
    ]);

    // 7. Create Store Info
    console.log('🏪 Creating store information...');
    await db.insert(storeInfo).values({
      nameVi: 'NextShop',
      nameEn: 'NextShop',
      currency: 'VND',
      shippingFee: '30000',
      hotline: '0123456789',
      email: 'contact@nextshop.com',
      address: '123 Đường ABC, Quận 1, TP.HCM',
      descriptionVi: 'Cửa hàng công nghệ hàng đầu Việt Nam',
      descriptionEn: 'Leading tech store in Vietnam',
      bankName: 'Vietcombank',
      bankAccountNumber: '1234567890',
      bankAccountName: 'NEXTSHOP COMPANY',
      socialLinks: {
        facebook: 'https://facebook.com/nextshop',
        instagram: 'https://instagram.com/nextshop',
      },
    });

    // 8. Create Coupons
    console.log('🎫 Creating coupons...');
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 30);

    await db.insert(coupons).values([
      {
        code: 'TET2024',
        nameVi: 'Giảm giá Tết 2024',
        nameEn: 'Lunar New Year Sale 2024',
        discountType: 'percentage',
        discountValue: '10',
        startDate: new Date(),
        endDate: futureDate,
        status: 'active',
      },
    ]);

    // 9. Create Discount Codes
    console.log('💳 Creating discount codes...');
    await db.insert(discountCodes).values([
      {
        code: 'WELCOME10',
        name: 'Welcome discount 10%',
        discountType: 'percentage',
        discountValue: '10',
        maxUsage: 100,
        currentUsage: 0,
        expiryDate: futureDate,
        status: 'active',
      },
      {
        code: 'FREESHIP',
        name: 'Free shipping',
        discountType: 'fixed',
        discountValue: '30000',
        maxUsage: 50,
        currentUsage: 0,
        expiryDate: futureDate,
        status: 'active',
      },
    ]);

    console.log('✅ Seed completed successfully!');
    console.log(`\n📧 Admin user created with email: ${adminEmail}`);

  } catch (error) {
    console.error('❌ Seed failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

seed();
