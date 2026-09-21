import { Suspense } from 'react'
import { getTranslations } from 'next-intl/server'
import CheckoutContent from './checkout-content'
import { Skeleton } from '@/components/ui/skeleton'
import type { Metadata } from 'next'

export async function generateMetadata({
  params: { locale }
}: {
  params: { locale: string }
}): Promise<Metadata> {
  const t = await getTranslations({ locale, namespace: 'checkout' })

  return {
    title: t('title'),
    description: t('title'),
  }
}

function CheckoutLoading() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Skeleton className="h-10 w-48 mb-6" />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <Skeleton className="h-96 w-full" />
        </div>
        <div>
          <Skeleton className="h-64 w-full" />
        </div>
      </div>
    </div>
  )
}

export default async function CheckoutPage({
  params: { locale },
}: {
  params: { locale: string }
}) {
  return (
    <Suspense fallback={<CheckoutLoading />}>
      <CheckoutContent locale={locale} />
    </Suspense>
  )
}
