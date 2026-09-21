import { Suspense } from 'react'
import { notFound } from 'next/navigation'
import { getTranslations } from 'next-intl/server'
import type { Metadata } from 'next'
import ProductDetailContent from './product-detail-content'
import { Skeleton } from '@/components/ui/skeleton'
import { getProductBySlug } from '@/lib/api/endpoints'

export async function generateMetadata({
  params: { locale, slug }
}: {
  params: { locale: string; slug: string }
}): Promise<Metadata> {
  try {
    const product = await getProductBySlug(slug)

    return {
      title: product.name,
      description: product.description || `${product.name} - Product details`,
      openGraph: {
        title: product.name,
        description: product.description || '',
        images: product.images.map(img => ({ url: img.url, alt: img.altText || product.name })),
      },
    }
  } catch (error) {
    return {
      title: 'Product Not Found',
    }
  }
}

function ProductDetailLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-6 w-64 mb-6" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <Skeleton className="aspect-square w-full" />
        <div className="space-y-4">
          <Skeleton className="h-8 w-3/4" />
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-12 w-full" />
          <Skeleton className="h-12 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function ProductDetailPage({
  params: { locale, slug },
}: {
  params: { locale: string; slug: string }
}) {
  return (
    <Suspense fallback={<ProductDetailLoading />}>
      <ProductDetailContent locale={locale} slug={slug} />
    </Suspense>
  )
}
