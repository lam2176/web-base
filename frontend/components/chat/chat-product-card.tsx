'use client';

import Link from 'next/link';
import { ImageIcon } from 'lucide-react';
import { ChatProductCard as ChatProductCardData } from '@/lib/api/chat';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface ChatProductCardProps {
  product: ChatProductCardData;
  locale: string;
}

export default function ChatProductCard({ product, locale }: ChatProductCardProps) {
  const { formatPrice } = useCurrency();

  return (
    <Link
      href={`/${locale}/products/${product.slug}`}
      className="flex gap-3 rounded-lg border bg-white p-2 transition-colors hover:border-primary"
    >
      <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-md bg-gray-100">
        {product.image ? (
          // Plain img: product images may come from hosts not listed in next.config images
          // eslint-disable-next-line @next/next/no-img-element
          <img src={product.image} alt={product.name} className="h-full w-full object-cover" />
        ) : (
          <ImageIcon className="h-5 w-5 text-gray-400" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</p>
        <div className="mt-1 flex flex-wrap items-baseline gap-x-2">
          <span className="text-sm font-semibold text-primary">{formatPrice(product.price)}</span>
          {product.compareAtPrice && (
            <span className="text-xs text-gray-400 line-through">
              {formatPrice(product.compareAtPrice)}
            </span>
          )}
        </div>
        {!product.inStock && (
          <span className="text-xs text-red-600">{locale === 'vi' ? 'Hết hàng' : 'Out of stock'}</span>
        )}
      </div>
    </Link>
  );
}
