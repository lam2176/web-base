"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowRight, Copy, Check, UserPlus } from "lucide-react";
import { getOrderByNumber, getStoreInfo } from "@/lib/api/endpoints";
import { Order, StoreInfo } from "@/lib/types/api";
import { useCurrency } from "@/lib/hooks/useCurrency";
import { useCustomerAuthStore } from "@/lib/store/customerAuthStore";
import { guestCheckoutStorage } from "@/lib/utils/localStorage";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { CustomerAuthModal } from "@/components/customer/customer-auth-modal";
import Link from "next/link";
import { useParams } from "next/navigation";
import Image from "next/image";

export default function CheckoutSuccessPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const searchParams = useSearchParams();
  const locale = params.locale as string;
  const { formatPrice } = useCurrency();

  const { toast } = useToast();
  const { isAuthenticated } = useCustomerAuthStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [storeInfo, setStoreInfo] = useState<StoreInfo | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showRegisterPrompt, setShowRegisterPrompt] = useState(false);

  const orderNumber = searchParams.get("orderNumber");

  // Check if should show register prompt for guest users
  useEffect(() => {
    if (!isAuthenticated && guestCheckoutStorage.hasSavedInfo()) {
      setShowRegisterPrompt(true);
    }
  }, [isAuthenticated]);

  const copyOrderNumber = async () => {
    if (!order) return;

    try {
      await navigator.clipboard.writeText(order.orderNumber || "");
      setCopied(true);
      toast({
        title: t("order.success.orderCopied"),
        description: t("order.success.orderCopiedDesc"),
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast({
        title: t("order.success.copyError"),
        description: t("order.success.copyErrorDesc"),
        variant: "destructive",
      });
    }
  };

  const formatDate = (dateString: string | Date) => {
    if (!dateString) return "";
    const date = new Date(dateString);
    if (isNaN(date.getTime())) return dateString?.toString() || "";
    return new Intl.DateTimeFormat(locale === "vi" ? "vi-VN" : "en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    }).format(date);
  };

  useEffect(() => {
    if (!orderNumber) {
      router.push(`/${locale}`);
      return;
    }

    fetchData();
  }, [orderNumber]);

  const fetchData = async () => {
    if (!orderNumber) return;

    setLoading(true);
    try {
      // Fetch both order and store info in parallel
      const [orderData, storeData] = await Promise.all([
        getOrderByNumber(orderNumber),
        getStoreInfo(),
      ]);
      setOrder(orderData as unknown as Order);
      setStoreInfo(storeData as unknown as StoreInfo);
    } catch (error) {
      console.error("Failed to fetch data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <Skeleton className="h-12 w-3/4 mx-auto mb-4" />
          <Skeleton className="h-96 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container mx-auto px-4 py-16">
        <Card className="max-w-md mx-auto text-center py-12">
          <CardContent>
            <h2 className="text-2xl font-bold mb-4">{t("order.notFound")}</h2>
            <Button asChild>
              <Link href={`/${locale}`}>{t("order.goToHomepage")}</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-2xl mx-auto">
        {/* Success Message */}
        <div className="text-center mb-8">
          <CheckCircle2 className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold mb-2">
            {t("order.success.title")}
          </h1>
          <p className="text-muted-foreground mb-6">
            {t("order.success.message")}
          </p>

          {/* Order Number Highlight */}
          <Card className="bg-primary/5 border-primary/20 max-w-md mx-auto">
            <CardContent className="py-4">
              <p className="text-sm text-muted-foreground mb-2">
                {t("order.success.yourOrderNumber")}
              </p>
              <div className="flex items-center justify-center gap-3">
                <p className="text-lg font-bold text-primary">
                  {order.orderNumber}
                </p>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyOrderNumber}
                  className="h-10 w-10"
                >
                  {copied ? (
                    <Check className="h-5 w-5 text-green-600" />
                  ) : (
                    <Copy className="h-5 w-5" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {t("order.success.saveOrderNumber")}
              </p>
            </CardContent>
          </Card>

          {/* Bank Transfer Information - Only show if bank info is complete OR QR image exists */}
          {((storeInfo?.bankName &&
            storeInfo?.bankAccountNumber &&
            storeInfo?.bankAccountName) ||
            storeInfo?.bankQr) && (
            <Card className="bg-blue-50 dark:bg-blue-950 border-blue-200 dark:border-blue-800 max-w-md mx-auto mt-6">
              <CardContent className="py-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-lg">💳</span>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-blue-900 dark:text-blue-100 mb-1">
                      ⚡ {t("order.bankTransfer.title")}
                    </h3>
                    <p className="text-xs text-blue-700 dark:text-blue-300">
                      {t("order.bankTransfer.priority")}
                    </p>
                  </div>
                </div>

                <div className="bg-white dark:bg-gray-900 rounded-lg p-3 space-y-3 border border-blue-200 dark:border-blue-800">
                  {/* Bank QR Image */}
                  {storeInfo?.bankQr?.url && (
                    <div className="flex justify-center">
                      <div className="relative w-48 h-48 rounded-lg overflow-hidden border-2 border-gray-200 bg-white">
                        <Image
                          src={storeInfo.bankQr.url}
                          alt={
                            locale === "vi" ? "Mã QR Ngân hàng" : "Bank QR Code"
                          }
                          fill
                          className="object-contain p-2"
                        />
                      </div>
                    </div>
                  )}

                  {/* Bank Details */}
                  {storeInfo?.bankName && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {t("order.bankTransfer.bank")}:
                      </span>
                      <span className="font-semibold">
                        {storeInfo.bankName}
                      </span>
                    </div>
                  )}
                  {storeInfo?.bankAccountNumber && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {t("order.bankTransfer.accountNumber")}:
                      </span>
                      <span className="font-semibold font-mono">
                        {storeInfo.bankAccountNumber}
                      </span>
                    </div>
                  )}
                  {storeInfo?.bankAccountName && (
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-muted-foreground">
                        {t("order.bankTransfer.accountName")}:
                      </span>
                      <span className="font-semibold">
                        {storeInfo.bankAccountName}
                      </span>
                    </div>
                  )}

                  {/* Transfer Amount */}
                  <div className="flex justify-between items-center text-sm bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded">
                    <span className="text-muted-foreground font-medium">
                      {t("order.bankTransfer.amount")}:
                    </span>
                    <span className="font-bold text-lg text-primary">
                      {formatPrice(parseFloat(order.total))}
                    </span>
                  </div>

                  {/* Transfer Note */}
                  <div className="border-t pt-2 mt-2">
                    <p className="text-xs text-muted-foreground mb-1">
                      {t("order.bankTransfer.transferNote")}
                    </p>
                    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-800 rounded px-2 py-1">
                      <code className="text-xs font-mono font-semibold">
                        {order.orderNumber}
                      </code>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={copyOrderNumber}
                      >
                        {copied ? (
                          <Check className="h-3 w-3 text-green-600" />
                        ) : (
                          <Copy className="h-3 w-3" />
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Registration Prompt for Guest Users */}
          {showRegisterPrompt && !isAuthenticated && (
            <Card className="bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 border-purple-200 dark:border-purple-800 max-w-md mx-auto mt-6">
              <CardContent className="py-4">
                <div className="flex items-start gap-3 mb-3">
                  <div className="flex-shrink-0 w-8 h-8 bg-gradient-to-br from-purple-600 to-pink-600 rounded-full flex items-center justify-center">
                    <UserPlus className="h-4 w-4 text-white" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-purple-900 dark:text-purple-100 mb-1">
                      {locale === "vi"
                        ? "🎉 Tạo tài khoản để quản lý đơn hàng!"
                        : "🎉 Create an account to manage your orders!"}
                    </h3>
                    <p className="text-xs text-purple-700 dark:text-purple-300 mb-3">
                      {locale === "vi"
                        ? "Đăng ký ngay để theo dõi đơn hàng, lưu địa chỉ và mua sắm nhanh hơn lần sau!"
                        : "Register now to track orders, save addresses and shop faster next time!"}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => setShowAuthModal(true)}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                      >
                        {locale === "vi" ? "Đăng ký ngay" : "Register Now"}
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setShowRegisterPrompt(false)}
                      >
                        {locale === "vi" ? "Để sau" : "Maybe Later"}
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Order Details */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>{t("order.orderDetails")}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("order.orderDate")}
                </p>
                <p className="font-semibold">{formatDate(order.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("order.status")}
                </p>
                <p className="font-semibold capitalize">
                  {t(`order.${order.status}`)}
                </p>
              </div>
            </div>

            <Separator />

            {/* Customer Info */}
            <div>
              <h3 className="font-semibold mb-2">{t("order.customerInfo")}</h3>
              <div className="space-y-1 text-sm">
                <p>{order.customerName}</p>
                <p>{order.customerEmail}</p>
                <p>{order.customerPhone}</p>
              </div>
            </div>

            <Separator />

            {/* Shipping Address */}
            <div>
              <h3 className="font-semibold mb-2">
                {t("checkout.shippingAddress")}
              </h3>
              <p className="text-sm">
                {order.customerAddress || '-'}
              </p>
            </div>

            <Separator />

            {/* Order Items */}
            <div>
              <h3 className="font-semibold mb-3">{t("order.items")}</h3>
              <div className="space-y-3">
                {order.items?.map((item: any) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <div>
                      <p className="font-medium">{item.productName}</p>
                      {item.variantName && (
                        <p className="text-muted-foreground">
                          {item.variantName}
                        </p>
                      )}
                      <p className="text-muted-foreground">
                        {t("order.quantity")}: {item.quantity}
                      </p>
                    </div>
                    <p className="font-semibold">
                      {formatPrice(parseFloat(item.total))}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <Separator />

            {/* Order Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("cart.subtotal")}
                </span>
                <span>{formatPrice(parseFloat(order.subtotal))}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t("cart.shipping")}
                </span>
                <span>{formatPrice(parseFloat(order.shippingFee))}</span>
              </div>
              {order.discountAmount && parseFloat(order.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-600">
                  <span>{t("products.discount")}</span>
                  <span>-{formatPrice(parseFloat(order.discountAmount))}</span>
                </div>
              )}
              <Separator />
              <div className="flex justify-between text-lg font-bold">
                <span>{t("cart.total")}</span>
                <span className="text-primary">
                  {formatPrice(parseFloat(order.total))}
                </span>
              </div>
            </div>

            {order.note && (
              <>
                <Separator />
                <div>
                  <h3 className="font-semibold mb-2">{t("checkout.notes")}</h3>
                  <p className="text-sm text-muted-foreground">{order.note}</p>
                </div>
              </>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <div className="flex gap-4">
          <Button asChild variant="outline" className="flex-1">
            <Link href={`/${locale}`}>{t("order.goToHomepage")}</Link>
          </Button>
          <Button asChild className="flex-1">
            <Link href={`/${locale}/products`}>
              {t("order.continueShopping")}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>

      {/* Auth Modal */}
      <CustomerAuthModal
        open={showAuthModal}
        onOpenChange={setShowAuthModal}
        defaultMode="register"
        onSuccess={() => {
          setShowAuthModal(false);
          setShowRegisterPrompt(false);
          toast({
            title:
              locale === "vi"
                ? "Đăng ký thành công!"
                : "Registration successful!",
            description:
              locale === "vi"
                ? "Bạn có thể theo dõi đơn hàng trong trang hồ sơ."
                : "You can track your orders in your profile.",
          });
        }}
      />
    </div>
  );
}
