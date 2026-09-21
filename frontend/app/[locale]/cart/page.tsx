import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import CartContent from './cart-content'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'cart' })

  return {
    title: t('title'),
    description: t('title'),
  }
}

function CartLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function CartPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  return (
    <Suspense fallback={<CartLoading />}>
      <CartContent locale={locale} />
    </Suspense>
  )
}
