import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  adminBannerService,
  adminCategoryService,
  adminCouponService,
  adminCustomerService,
  adminDiscountCodeService,
  adminMediaService,
  adminOrderService,
  adminPageService,
  adminProductService,
  adminStoreService,
  adminUserService,
} from '@/lib/api/services/admin.service';
import {
  CreateCategoryDto,
  UpdateCategoryDto,
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  CreateBannerDto,
  UpdateBannerDto,
  CreatePageDto,
  UpdatePageDto,
  UpdateStoreInfoDto,
  CreateCouponDto,
  UpdateCouponDto,
  CreateDiscountCodeDto,
  UpdateDiscountCodeDto,
  UpdateOrderStatusDto,
  OrderQueryDto,
  UpdateMediaDto,
} from '@/lib/types/api';

// ============ CATEGORIES ============

export function useAdminCategories(search?: string) {
  return useQuery({
    queryKey: ['admin', 'categories', search],
    queryFn: () => adminCategoryService.getAll(search),
  });
}

export function useAdminCategory(id: number) {
  return useQuery({
    queryKey: ['admin', 'categories', id],
    queryFn: () => adminCategoryService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCategoryDto) => adminCategoryService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useUpdateCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCategoryDto }) =>
      adminCategoryService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

export function useDeleteCategory() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminCategoryService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'categories'] });
      queryClient.invalidateQueries({ queryKey: ['categories'] });
    },
  });
}

// ============ PRODUCTS ============

export function useAdminProducts(query?: ProductQueryDto) {
  return useQuery({
    queryKey: ['admin', 'products', query],
    queryFn: () => adminProductService.getAll(query),
  });
}

export function useAdminProduct(id: number) {
  return useQuery({
    queryKey: ['admin', 'products', id],
    queryFn: () => adminProductService.getById(id),
    enabled: !!id,
  });
}

export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateProductDto) => adminProductService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useUpdateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateProductDto }) =>
      adminProductService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'products', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useDeleteProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminProductService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

export function useImportProducts() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (products: any[]) => adminProductService.import(products),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'products'] });
      queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });
}

// ============ BANNERS ============

export function useAdminBanners() {
  return useQuery({
    queryKey: ['admin', 'banners'],
    queryFn: () => adminBannerService.getAll(),
  });
}

export function useAdminBanner(id: number) {
  return useQuery({
    queryKey: ['admin', 'banners', id],
    queryFn: () => adminBannerService.getById(id),
    enabled: !!id,
  });
}

export function useCreateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateBannerDto) => adminBannerService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useUpdateBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateBannerDto }) =>
      adminBannerService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners', variables.id] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

export function useDeleteBanner() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminBannerService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'banners'] });
      queryClient.invalidateQueries({ queryKey: ['banners'] });
    },
  });
}

// ============ PAGES ============

export function useAdminPages(search?: string) {
  return useQuery({
    queryKey: ['admin', 'pages', search],
    queryFn: () => adminPageService.getAll(search),
  });
}

export function useAdminPage(id: number) {
  return useQuery({
    queryKey: ['admin', 'pages', id],
    queryFn: () => adminPageService.getById(id),
    enabled: !!id,
  });
}

export function useCreatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreatePageDto) => adminPageService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
    },
  });
}

export function useUpdatePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdatePageDto }) =>
      adminPageService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages', variables.id] });
    },
  });
}

export function useDeletePage() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminPageService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
    },
  });
}

export function useReorderPages() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (pages: Array<{ id: number; order: number }>) =>
      adminPageService.reorder(pages),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'pages'] });
    },
  });
}

// ============ STORE ============

export function useAdminStoreInfo() {
  return useQuery({
    queryKey: ['admin', 'store', 'info'],
    queryFn: () => adminStoreService.getInfo(),
  });
}

export function useUpdateStoreInfo() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UpdateStoreInfoDto) => adminStoreService.update(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'store'] });
      queryClient.invalidateQueries({ queryKey: ['store'] });
    },
  });
}

// ============ COUPONS ============

export function useAdminCoupons() {
  return useQuery({
    queryKey: ['admin', 'coupons'],
    queryFn: () => adminCouponService.getAll(),
  });
}

export function useAdminCoupon(id: number) {
  return useQuery({
    queryKey: ['admin', 'coupons', id],
    queryFn: () => adminCouponService.getById(id),
    enabled: !!id,
  });
}

export function useCreateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateCouponDto) => adminCouponService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}

export function useUpdateCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateCouponDto }) =>
      adminCouponService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons', variables.id] });
    },
  });
}

export function useDeleteCoupon() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminCouponService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'coupons'] });
    },
  });
}

// ============ DISCOUNT CODES ============

export function useAdminDiscountCodes() {
  return useQuery({
    queryKey: ['admin', 'discount-codes'],
    queryFn: () => adminDiscountCodeService.getAll(),
  });
}

export function useAdminDiscountCode(id: number) {
  return useQuery({
    queryKey: ['admin', 'discount-codes', id],
    queryFn: () => adminDiscountCodeService.getById(id),
    enabled: !!id,
  });
}

export function useCreateDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: CreateDiscountCodeDto) => adminDiscountCodeService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'discount-codes'] });
    },
  });
}

export function useUpdateDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateDiscountCodeDto }) =>
      adminDiscountCodeService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'discount-codes'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'discount-codes', variables.id] });
    },
  });
}

export function useDeleteDiscountCode() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminDiscountCodeService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'discount-codes'] });
    },
  });
}

// ============ ORDERS ============

export function useAdminOrders(query?: OrderQueryDto) {
  return useQuery({
    queryKey: ['admin', 'orders', query],
    queryFn: () => adminOrderService.getAll(query),
  });
}

export function useAdminOrder(id: number) {
  return useQuery({
    queryKey: ['admin', 'orders', id],
    queryFn: () => adminOrderService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateOrderStatusDto }) =>
      adminOrderService.updateStatus(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders', variables.id] });
    },
  });
}

export function useDeleteOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminOrderService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'orders'] });
    },
  });
}

// ============ USERS ============

export function useAdminUsers() {
  return useQuery({
    queryKey: ['admin', 'users'],
    queryFn: () => adminUserService.getAll(),
  });
}

export function useAdminUser(id: number) {
  return useQuery({
    queryKey: ['admin', 'users', id],
    queryFn: () => adminUserService.getById(id),
    enabled: !!id,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminUserService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });
}

// ============ MEDIA ============

export function useAdminMedia() {
  return useQuery({
    queryKey: ['admin', 'media'],
    queryFn: () => adminMediaService.getAll(),
  });
}

export function useAdminMediaById(id: number) {
  return useQuery({
    queryKey: ['admin', 'media', id],
    queryFn: () => adminMediaService.getById(id),
    enabled: !!id,
  });
}

export function useUploadMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (file: File) => adminMediaService.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });
}

export function useDeleteMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: number) => adminMediaService.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'media'] });
    },
  });
}

export function useUpdateMedia() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: UpdateMediaDto }) =>
      adminMediaService.update(id, data),
    onSuccess: async () => {
      // Use refetchQueries instead of invalidateQueries to ensure data is refetched before continuing
      await queryClient.refetchQueries({ queryKey: ['admin', 'media'] });
    },
  });
}

// ============ CUSTOMERS ============

export function useAdminCustomers() {
  return useQuery({
    queryKey: ['admin', 'customers'],
    queryFn: () => adminCustomerService.getAll(),
  });
}

export function useAdminCustomer(id: number) {
  return useQuery({
    queryKey: ['admin', 'customers', id],
    queryFn: () => adminCustomerService.getById(id),
    enabled: !!id,
  });
}

export function useUpdateCustomer() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: { fullName?: string; phoneNumber?: string; email?: string; isActive?: boolean } }) =>
      adminCustomerService.update(id, data),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers'] });
      queryClient.invalidateQueries({ queryKey: ['admin', 'customers', variables.id] });
    },
  });
}
