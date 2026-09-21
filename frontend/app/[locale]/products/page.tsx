import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import ProductsContent from './products-content'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'products' })

  return {
    title: t('title'),
    description: t('description'),
  }
}

function ProductsLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar skeleton */}
        <div className="lg:col-span-1">
          <Skeleton className="h-96 w-full" />
        </div>

        {/* Products grid skeleton */}
        <div className="lg:col-span-3">
          <Skeleton className="h-12 w-full mb-6" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-square w-full" />
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default async function ProductsPage({
  params: { locale },
  searchParams,
}: {
  params: { locale: string }
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  return (
    <Suspense fallback={<ProductsLoading />}>
      <ProductsContent locale={locale} searchParams={searchParams} />
    </Suspense>
  )
}
