"use client"

import { useState, useMemo } from 'react'
import { useTranslations } from 'next-intl'
import { useRouter, useSearchParams } from 'next/navigation'
import { Search, SlidersHorizontal, X, Package } from 'lucide-react'
import { Product } from '@/lib/types/api'
import { useCartStore } from '@/lib/stores/cart.store'
import { useProducts } from '@/lib/hooks/use-products'
import { useCategories } from '@/lib/hooks/use-categories'
import { useCurrency } from '@/lib/hooks/useCurrency'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { useToast } from '@/hooks/use-toast'
import Image from 'next/image'
import Link from 'next/link'

interface ProductsContentProps {
  locale: string
  searchParams: { [key: string]: string | string[] | undefined }
}

export default function ProductsContent({ locale, searchParams }: ProductsContentProps) {
  const t = useTranslations()
  const router = useRouter()
  const params = useSearchParams()
  const { toast } = useToast()
  const { addItem } = useCartStore()
  const { formatPrice } = useCurrency()

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false)

  // Local search input state (không trigger re-render ngay)
  const [searchInput, setSearchInput] = useState((searchParams.search as string) || '')

  // Filters state
  const [filters, setFilters] = useState({
    search: (searchParams.search as string) || '',
    categoryId: (searchParams.categoryId as string) || '',
    minPrice: searchParams.minPrice ? Number(searchParams.minPrice) : undefined,
    maxPrice: searchParams.maxPrice ? Number(searchParams.maxPrice) : undefined,
    sortBy: (searchParams.sortBy as 'price' | 'name' | 'createdAt') || 'createdAt',
    sortOrder: (searchParams.sortOrder as 'asc' | 'desc') || 'desc',
    page: searchParams.page ? Number(searchParams.page) : 1,
  })

  // Fetch data using TanStack Query
  const { data: categoriesData = [], isLoading: categoriesLoading } = useCategories()
  const { data: productsData, isLoading: productsLoading } = useProducts({
    ...filters,
    limit: 12,
  })

  const categories = (categoriesData || []).filter(cat => cat.isActive !== false)
  const products = productsData?.data || []
  const pagination = productsData?.pagination || {
    page: 1,
    limit: 12,
    total: 0,
    totalPages: 0,
  }
  const loading = productsLoading

  const updateFilters = (newFilters: Partial<typeof filters>) => {
    const updated = { ...filters, ...newFilters, page: 1 }
    setFilters(updated)

    // Update URL
    const params = new URLSearchParams()
    Object.entries(updated).forEach(([key, value]) => {
      if (value !== undefined && value !== '') {
        params.set(key, String(value))
      }
    })
    router.push(`/${locale}/products?${params.toString()}`)
  }

  const clearFilters = () => {
    setSearchInput('')
    setFilters({
      search: '',
      categoryId: '',
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'createdAt',
      sortOrder: 'desc',
      page: 1,
    })
    router.push(`/${locale}/products`)
  }

  const handleAddToCart = async (product: Product) => {
    try {
      const productName = locale === 'vi' 
        ? (product.nameVi || product.name) 
        : (product.nameEn || product.name)
      
      await addItem({ productId: product.id, quantity: 1 })
      toast({
        title: t('products.addedToCart'),
        description: t('products.addedToCartDescription', { 
          quantity: 1, 
          product: productName 
        }),
      })
    } catch (error) {
      toast({
        title: t('common.error'),
        description: t('products.error'),
        variant: 'destructive',
      })
    }
  }

  const handleSearchSubmit = () => {
    updateFilters({ search: searchInput })
  }

  const handleSearchKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearchSubmit()
    }
  }

  const FilterSidebar = useMemo(() => (
    <div className="space-y-6">
      {/* Search */}
      <div>
        <h3 className="font-semibold mb-3">{t('common.search')}</h3>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('search.placeholder')}
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyPress={handleSearchKeyPress}
            className="pl-9 pr-10"
          />
          <button
            type="button"
            onClick={handleSearchSubmit}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Search"
          >
            <Search className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Categories */}
      <div>
        <h3 className="font-semibold mb-3">{t('search.categories')}</h3>
        <div className="space-y-2">
          <Button
            variant={!filters.categoryId ? 'default' : 'ghost'}
            className="w-full justify-start"
            onClick={() => updateFilters({ categoryId: '' })}
          >
            {t('common.viewAll')}
          </Button>
          {categories.map((category) => {
            const categoryName = locale === 'vi'
              ? (category.nameVi || category.name)
              : (category.nameEn || category.name);

            return (
              <Button
                key={category.id}
                variant={filters.categoryId === String(category.id) ? 'default' : 'ghost'}
                className="w-full justify-start"
                onClick={() => updateFilters({ categoryId: String(category.id) })}
              >
                {categoryName}
                {category.productCount !== undefined && (
                  <span className="ml-auto text-xs">({category.productCount})</span>
                )}
              </Button>
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <div>
        <h3 className="font-semibold mb-3">{t('search.priceRange')}</h3>
        <div className="space-y-3">
          <Input
            type="number"
            placeholder={t('products.minPrice')}
            value={filters.minPrice || ''}
            onChange={(e) => updateFilters({ minPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
          <Input
            type="number"
            placeholder={t('products.maxPrice')}
            value={filters.maxPrice || ''}
            onChange={(e) => updateFilters({ maxPrice: e.target.value ? Number(e.target.value) : undefined })}
          />
        </div>
      </div>

      {/* Clear Filters */}
      <Button variant="outline" className="w-full" onClick={clearFilters}>
        <X className="h-4 w-4 mr-2" />
        {t('products.clearFilters')}
      </Button>
    </div>
  ), [searchInput, filters, categories, locale, t, handleSearchKeyPress, handleSearchSubmit, updateFilters, clearFilters])

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">{t('products.title')}</h1>
        <p className="text-muted-foreground">
          {t('search.showingResults', { count: pagination.total, query: filters.search || t('common.viewAll') })}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Desktop Sidebar */}
        <aside className="hidden lg:block lg:col-span-1">
          <Card>
            <CardContent className="p-6">
              {FilterSidebar}
            </CardContent>
          </Card>
        </aside>

        {/* Mobile Filter Button */}
        <div className="lg:hidden mb-4">
          <Button
            variant="outline"
            className="w-full"
            onClick={() => setMobileFilterOpen(!mobileFilterOpen)}
          >
            <SlidersHorizontal className="h-4 w-4 mr-2" />
            {t('products.filters')}
          </Button>

          {mobileFilterOpen && (
            <Card className="mt-4">
              <CardContent className="p-6">
                {FilterSidebar}
              </CardContent>
            </Card>
          )}
        </div>

        {/* Main Content */}
        <main className="lg:col-span-3">
          {/* Sort and View Controls */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">{t('search.sortBy')}:</span>
              <Select
                value={`${filters.sortBy}-${filters.sortOrder}`}
                onValueChange={(value) => {
                  const [sortBy, sortOrder] = value.split('-') as ['price' | 'name' | 'createdAt', 'asc' | 'desc']
                  updateFilters({ sortBy, sortOrder })
                }}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="createdAt-desc">{t('search.newest')}</SelectItem>
                  <SelectItem value="price-asc">{t('search.priceAsc')}</SelectItem>
                  <SelectItem value="price-desc">{t('search.priceDesc')}</SelectItem>
                  <SelectItem value="name-asc">{t('products.sortNameAsc')}</SelectItem>
                  <SelectItem value="name-desc">{t('products.sortNameDesc')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-square w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-6 w-1/2" />
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground">{t('search.noResults')}</p>
              <Button variant="outline" className="mt-4" onClick={clearFilters}>
                {t('products.clearFilters')}
              </Button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {products.map((product) => {
                const productName = locale === 'vi'
                  ? (product.nameVi || product.name)
                  : (product.nameEn || product.name);
                const categoryName = product.category
                  ? (locale === 'vi'
                    ? (product.category.nameVi || product.category.name)
                    : (product.category.nameEn || product.category.name))
                  : '';

                return (
                  <Card key={product.id} className="group overflow-hidden hover:shadow-lg transition-shadow">
                    <Link href={`/${locale}/products/${product.slug}`}>
                      <div className="relative aspect-square overflow-hidden bg-gray-100">
                        {product.images?.[0]?.url ? (
                          <Image
                            src={product.images[0].url!}
                            alt={productName || ''}
                            fill
                            className="object-cover group-hover:scale-105 transition-transform duration-300"
                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-gray-200">
                            <div className="text-center text-gray-400">
                              <Package className="h-16 w-16 mx-auto mb-2" />
                              <p className="text-sm">{t('products.noImage')}</p>
                            </div>
                          </div>
                        )}
                        {(product.isFeatured || product.featured) && (
                          <Badge className="absolute top-2 left-2">
                            {t('products.featured')}
                          </Badge>
                        )}
                        {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                          <Badge variant="destructive" className="absolute top-2 right-2">
                            {Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100)}% OFF
                          </Badge>
                        )}
                        {!product.trackInventory || (product.inventoryQuantity || 0) > 0 || product.allowOutOfStockPurchase ? null : (
                          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold">{t('products.outOfStock')}</span>
                          </div>
                        )}
                      </div>
                    </Link>

                    <CardContent className="p-4">
                      <Link href={`/${locale}/products/${product.slug}`}>
                        <h3 className="font-semibold text-lg line-clamp-2 mb-2 group-hover:text-primary transition-colors">
                          {productName}
                        </h3>
                      </Link>

                      {categoryName && (
                        <p className="text-xs text-muted-foreground mb-2">{categoryName}</p>
                      )}

                    <div className="flex items-center gap-2 mb-3">
                      <p className="text-xl font-bold text-primary">
                        {formatPrice(product.price || 0)}
                      </p>
                      {product.compareAtPrice && product.price && product.compareAtPrice > product.price && (
                        <p className="text-sm text-muted-foreground line-through">
                          {formatPrice(product.compareAtPrice)}
                        </p>
                      )}
                    </div>

                    {product.trackInventory && !product.allowOutOfStockPurchase && (product.inventoryQuantity || 0) <= 10 && (product.inventoryQuantity || 0) > 0 && (
                      <p className="text-xs text-orange-600 mb-2">
                        {t('products.onlyLeft', { count: product.inventoryQuantity })}
                      </p>
                    )}

                    <Button
                      className="w-full"
                      onClick={() => handleAddToCart(product)}
                      disabled={product.trackInventory && !product.allowOutOfStockPurchase && (product.inventoryQuantity || 0) === 0}
                    >
                      {t('products.addToCart')}
                    </Button>
                  </CardContent>
                </Card>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {!loading && products.length > 0 && pagination.totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              <Button
                variant="outline"
                onClick={() => updateFilters({ page: filters.page - 1 })}
                disabled={filters.page === 1}
              >
                {t('products.previous')}
              </Button>

              <div className="flex items-center gap-2">
                {[...Array(pagination.totalPages)].map((_, i) => {
                  const page = i + 1
                  // Show first, last, current, and pages around current
                  if (
                    page === 1 ||
                    page === pagination.totalPages ||
                    (page >= filters.page - 1 && page <= filters.page + 1)
                  ) {
                    return (
                      <Button
                        key={page}
                        variant={page === filters.page ? 'default' : 'outline'}
                        onClick={() => updateFilters({ page })}
                      >
                        {page}
                      </Button>
                    )
                  } else if (page === filters.page - 2 || page === filters.page + 2) {
                    return <span key={page}>...</span>
                  }
                  return null
                })}
              </div>

              <Button
                variant="outline"
                onClick={() => updateFilters({ page: filters.page + 1 })}
                disabled={filters.page === pagination.totalPages}
              >
                {t('products.next')}
              </Button>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
