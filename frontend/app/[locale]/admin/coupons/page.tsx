"use client";

import { useState } from "react";
import Link from "next/link";
import { Plus, Search, Edit, Trash2, Copy } from "lucide-react";
import { useAdminCoupons, useDeleteCoupon } from "@/lib/hooks/use-admin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Coupon } from "@/lib/types/api";
import { useCurrency } from "@/lib/hooks/useCurrency";

export default function AdminCouponsPage({
  params: { locale },
}: {
  params: { locale: string };
}) {
  const [search, setSearch] = useState("");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<Coupon | null>(null);

  const { data: coupons = [], isLoading: loading } = useAdminCoupons();
  const { mutate: deleteCoupon } = useDeleteCoupon();
  const { formatPrice } = useCurrency();

  const handleDelete = () => {
    if (!couponToDelete) return;

    deleteCoupon(couponToDelete.id, {
      onSuccess: () => {
        setDeleteDialogOpen(false);
        setCouponToDelete(null);
      },
      onError: (error) => {
        console.error("Failed to delete coupon:", error);
        alert(
          locale === "vi" ? "Không thể xóa coupon" : "Failed to delete coupon"
        );
      },
    });
  };

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    alert(locale === "vi" ? "Đã copy mã!" : "Code copied!");
  };

  const getName = (coupon: Coupon) => {
    return locale === "vi" ? coupon.nameVi : coupon.nameEn;
  };

  const getDiscountDisplay = (coupon: Coupon) => {
    if (coupon.discountType === "percentage") {
      return `${coupon.discountValue}%`;
    }
    return formatPrice(parseFloat(coupon.discountValue));
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  };

  const getStatusLabel = (status: string) => {
    if (locale === "vi") {
      return status === "active"
        ? "Đang hoạt động"
        : status === "expired"
        ? "Hết hạn"
        : "Không hoạt động";
    }
    return status === "active"
      ? "Active"
      : status === "expired"
      ? "Expired"
      : "Inactive";
  };

  const getCouponStatus = (
    coupon: Coupon
  ): "active" | "expired" | "inactive" => {
    const now = new Date();
    const endDate = new Date(coupon.endDate);
    const startDate = new Date(coupon.startDate);

    // Kiểm tra hết hạn
    if (endDate < now) {
      return "expired";
    }

    // Kiểm tra chưa bắt đầu
    if (startDate > now) {
      return "inactive";
    }

    // Đang trong thời gian: kiểm tra trạng thái
    const isActive = coupon.status === "active" || coupon.isActive === true;
    if (isActive) {
      return "active";
    }

    return "inactive";
  };

  const filteredCoupons = coupons.filter(
    (coupon) =>
      coupon.code.toLowerCase().includes(search.toLowerCase()) ||
      getName(coupon).toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">
            {locale === "vi" ? "Đang tải..." : "Loading..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {locale === "vi" ? "Chương Trình Giảm Giá" : "Discount Programs"}
          </h1>
          <p className="text-sm text-gray-600">
            {locale === "vi"
              ? "Quản lý chương trình giảm giá cho khách hàng"
              : "Manage discount programs for customers"}
          </p>
        </div>
        <Link href={`/${locale}/admin/coupons/new`}>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            {locale === "vi" ? "Thêm chương trình" : "Add Program"}
          </Button>
        </Link>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <Input
            placeholder={
              locale === "vi"
                ? "Tìm kiếm chương trình..."
                : "Search programs..."
            }
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      {/* Coupons Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-gray-50">
              <tr>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Mã" : "Code"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Tên" : "Name"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Giảm giá" : "Discount"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Thời gian" : "Duration"}
                </th>
                <th className="p-4 text-left text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Trạng thái" : "Status"}
                </th>
                <th className="p-4 text-right text-sm font-medium text-gray-600">
                  {locale === "vi" ? "Thao tác" : "Actions"}
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredCoupons.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-gray-500">
                    {locale === "vi"
                      ? "Không có coupon nào"
                      : "No coupons found"}
                  </td>
                </tr>
              ) : (
                filteredCoupons.map((coupon) => (
                  <tr
                    key={coupon.id}
                    className="border-b last:border-0 hover:bg-gray-50"
                  >
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-blue-600">
                          {coupon.code}
                        </span>
                        <button
                          onClick={() => handleCopyCode(coupon.code)}
                          className="text-gray-400 hover:text-gray-600"
                        >
                          <Copy className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                    <td className="p-4 text-sm text-gray-900">
                      {getName(coupon)}
                    </td>
                    <td className="p-4">
                      <span className="font-semibold text-green-600">
                        {getDiscountDisplay(coupon)}
                      </span>
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      <div>
                        <p>{formatDate(coupon.startDate)}</p>
                        <p className="text-xs text-gray-500">
                          {locale === "vi" ? "đến" : "to"}{" "}
                          {formatDate(coupon.endDate)}
                        </p>
                      </div>
                    </td>
                    <td className="p-4">
                      {(() => {
                        const status = getCouponStatus(coupon);
                        return (
                          <span
                            className={`inline-flex rounded-full px-2 py-1 text-xs font-semibold ${
                              status === "active"
                                ? "bg-green-100 text-green-800"
                                : status === "expired"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {getStatusLabel(status)}
                          </span>
                        );
                      })()}
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        <Link
                          href={`/${locale}/admin/coupons/${coupon.id}/edit`}
                        >
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </Link>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setCouponToDelete(coupon);
                            setDeleteDialogOpen(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4 text-red-600" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {locale === "vi" ? "Xác nhận xóa" : "Confirm Delete"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "vi"
                ? `Bạn có chắc chắn muốn xóa coupon "${couponToDelete?.code}"? Hành động này không thể hoàn tác.`
                : `Are you sure you want to delete coupon "${couponToDelete?.code}"? This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>
              {locale === "vi" ? "Hủy" : "Cancel"}
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              {locale === "vi" ? "Xóa" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
