"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter, useParams } from "next/navigation";
import { useCustomerAuthStore } from "@/lib/store/customerAuthStore";
import { customerAddressApi, type Address, type CreateAddressData } from "@/lib/api/customerAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { MapPin, Plus, Edit, Trash2, Star, Loader2, ArrowLeft } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { Checkbox } from "@/components/ui/checkbox";

export default function AddressesPage() {
  const t = useTranslations();
  const router = useRouter();
  const params = useParams();
  const locale = params.locale as string;
  const { toast } = useToast();
  const { customer, accessToken, isAuthenticated } = useCustomerAuthStore();

  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [deleteAddressId, setDeleteAddressId] = useState<number | null>(null);
  const [authChecked, setAuthChecked] = useState(false);

  // Address form state
  const [addressData, setAddressData] = useState<CreateAddressData>({
    addressName: "",
    fullName: "",
    phoneNumber: "",
    address: "",
    ward: "",
    district: "",
    province: "",
    isDefault: false,
  });

  // Wait for auth store to initialize
  useEffect(() => {
    const timer = setTimeout(() => {
      setAuthChecked(true);
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (!authChecked) return;
    
    if (!isAuthenticated) {
      router.push(`/${locale}`);
      return;
    }

    loadAddresses();
  }, [authChecked, isAuthenticated, router, locale]);

  const loadAddresses = async () => {
    if (!accessToken) return;

    setLoading(true);
    try {
      const data = await customerAddressApi.getAll(accessToken);
      setAddresses(data);
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenAddModal = () => {
    setEditingAddress(null);
    setAddressData({
      addressName: "",
      fullName: customer?.fullName || "",
      phoneNumber: customer?.phoneNumber || "",
      address: "",
      ward: "",
      district: "",
      province: "",
      isDefault: addresses.length === 0, // First address is default
    });
    setShowAddressModal(true);
  };

  const handleOpenEditModal = (address: Address) => {
    setEditingAddress(address);
    setAddressData({
      addressName: address.addressName || "",
      fullName: address.fullName,
      phoneNumber: address.phoneNumber,
      address: address.address,
      ward: address.ward,
      district: address.district,
      province: address.province,
      isDefault: address.isDefault,
    });
    setShowAddressModal(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accessToken) return;

    setLoading(true);
    try {
      if (editingAddress) {
        // Update existing address
        await customerAddressApi.update(accessToken, editingAddress.id, addressData);
        toast({
          title: t("common.success"),
          description: locale === "vi" ? "Cập nhật địa chỉ thành công" : "Address updated successfully",
        });
      } else {
        // Create new address
        await customerAddressApi.create(accessToken, addressData);
        toast({
          title: t("common.success"),
          description: locale === "vi" ? "Thêm địa chỉ thành công" : "Address added successfully",
        });
      }

      setShowAddressModal(false);
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (id: number) => {
    if (!accessToken) return;

    setLoading(true);
    try {
      await customerAddressApi.setDefault(accessToken, id);
      toast({
        title: t("common.success"),
        description: locale === "vi" ? "Đã đặt làm địa chỉ mặc định" : "Set as default address",
      });
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddress = async () => {
    if (!accessToken || !deleteAddressId) return;

    setLoading(true);
    try {
      await customerAddressApi.delete(accessToken, deleteAddressId);
      toast({
        title: t("common.success"),
        description: locale === "vi" ? "Xóa địa chỉ thành công" : "Address deleted successfully",
      });
      setDeleteAddressId(null);
      await loadAddresses();
    } catch (error: any) {
      toast({
        title: t("common.error"),
        description: error.response?.data?.message || t("common.error"),
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (!customer) {
    return null;
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => router.push(`/${locale}/profile`)}
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h1 className="text-3xl font-bold">{t("customer.addresses")}</h1>
        </div>

        <div className="mb-6">
          <Button onClick={handleOpenAddModal}>
            <Plus className="mr-2 h-4 w-4" />
            {t("customer.addNewAddress")}
          </Button>
        </div>

        {loading && addresses.length === 0 ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : addresses.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">
              <MapPin className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>{t("customer.noAddressesYet")}</p>
              <p className="text-sm mt-2">
                {t("customer.addAddressDescription")}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 gap-4">
            {addresses.map((address) => (
              <Card key={address.id} className={address.isDefault ? "border-primary" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg flex items-center gap-2">
                        {address.addressName && (
                          <span className="text-primary">{address.addressName}</span>
                        )}
                        {address.addressName && <span className="text-muted-foreground">•</span>}
                        {address.fullName}
                        {address.isDefault && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-primary text-primary-foreground">
                            <Star className="h-3 w-3 fill-current" />
                            {t("customer.defaultBadge")}
                          </span>
                        )}
                      </CardTitle>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleOpenEditModal(address)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteAddressId(address.id)}
                        disabled={address.isDefault}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    <p className="text-muted-foreground">{address.phoneNumber}</p>
                    <p>{address.address}</p>
                    {(address.ward || address.district || address.province) && (
                      <p className="text-muted-foreground">
                        {[address.ward, address.district, address.province]
                          .filter(Boolean)
                          .join(", ")}
                      </p>
                    )}
                  </div>

                  {!address.isDefault && (
                    <div className="mt-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                        disabled={loading}
                      >
                        {t("customer.setAsDefault")}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Address Modal */}
      <Dialog open={showAddressModal} onOpenChange={setShowAddressModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {editingAddress
                ? locale === "vi"
                  ? "Chỉnh sửa địa chỉ"
                  : "Edit Address"
                : locale === "vi"
                ? "Thêm địa chỉ mới"
                : "Add New Address"}
            </DialogTitle>
            <DialogDescription>
              {locale === "vi"
                ? "Nhập thông tin địa chỉ giao hàng"
                : "Enter shipping address information"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveAddress} className="space-y-4">
            <div>
              <Label htmlFor="addressName">
                {t("customer.addressNameOptional")}
              </Label>
              <Input
                id="addressName"
                value={addressData.addressName || ''}
                onChange={(e) =>
                  setAddressData({ ...addressData, addressName: e.target.value })
                }
                placeholder={
                  locale === "vi"
                    ? "VD: Nhà riêng, Công ty, Nhà bố mẹ..."
                    : "e.g., Home, Office, Parents' house..."
                }
              />
            </div>

            <div>
              <Label htmlFor="fullName">{t("auth.fullName")}</Label>
              <Input
                id="fullName"
                value={addressData.fullName}
                onChange={(e) =>
                  setAddressData({ ...addressData, fullName: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="phoneNumber">{t("auth.phoneNumber")}</Label>
              <Input
                id="phoneNumber"
                type="tel"
                value={addressData.phoneNumber}
                onChange={(e) =>
                  setAddressData({ ...addressData, phoneNumber: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="address">
                {t("customer.streetAddress")}
              </Label>
              <Input
                id="address"
                value={addressData.address}
                onChange={(e) =>
                  setAddressData({ ...addressData, address: e.target.value })
                }
                placeholder={
                  locale === "vi"
                    ? "Số nhà, tên đường"
                    : "House number, street name"
                }
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label htmlFor="ward">
                  {t("customer.ward")}
                </Label>
                <Input
                  id="ward"
                  value={addressData.ward}
                  onChange={(e) =>
                    setAddressData({ ...addressData, ward: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="district">
                  {t("customer.district")}
                </Label>
                <Input
                  id="district"
                  value={addressData.district}
                  onChange={(e) =>
                    setAddressData({ ...addressData, district: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="province">
                  {t("customer.province")}
                </Label>
                <Input
                  id="province"
                  value={addressData.province}
                  onChange={(e) =>
                    setAddressData({ ...addressData, province: e.target.value })
                  }
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isDefault"
                checked={addressData.isDefault}
                onCheckedChange={(checked) =>
                  setAddressData({ ...addressData, isDefault: checked as boolean })
                }
              />
              <Label htmlFor="isDefault" className="text-sm font-normal cursor-pointer">
                {t("customer.setDefaultAddress")}
              </Label>
            </div>

            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowAddressModal(false)}
              >
                {t("common.cancel")}
              </Button>
              <Button type="submit" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("common.save")}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteAddressId !== null} onOpenChange={() => setDeleteAddressId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t("common.confirm")}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {locale === "vi"
                ? "Bạn có chắc chắn muốn xóa địa chỉ này? Hành động này không thể hoàn tác."
                : "Are you sure you want to delete this address? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("common.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAddress} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {t("common.delete")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
