'use client'

import { usePathname } from 'next/navigation'
import ShopLayout from '@/components/layout/shop-layout'

export default function Template({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()

  // Don't wrap admin pages with shop layout
  if (pathname?.includes('/admin')) {
    return <>{children}</>
  }

  // Extract locale from pathname (e.g., /vi/products -> vi)
  const locale = pathname?.split('/')[1] || 'vi'

  return <ShopLayout locale={locale}>{children}</ShopLayout>
}
