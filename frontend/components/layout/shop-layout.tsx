import Header from './header'
import Footer from './footer'

interface ShopLayoutProps {
  children: React.ReactNode
  locale: string
}

export default function ShopLayout({ children, locale }: ShopLayoutProps) {
  return (
    <div className="flex flex-col min-h-screen">
      <Header locale={locale} />
      <main className="flex-1">{children}</main>
      <Footer locale={locale} />
    </div>
  )
}
