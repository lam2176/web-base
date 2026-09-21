'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Save, Store, MapPin } from 'lucide-react';
import { adminStoreService, adminMediaService } from '@/lib/api/services/admin.service';
import { useAuthStore } from '@/lib/stores/auth.store';
import { StoreInfo } from '@/lib/types/api';
import LogoUpload from '@/components/admin/logo-upload';
import BankQrUpload from '@/components/admin/bank-qr-upload';
import { Textarea } from '@/components/ui/textarea';

export default function StoreSettings({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations();
  const router = useRouter();
  const { user, isAuthenticated } = useAuthStore();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [bankQrFile, setBankQrFile] = useState<File | null>(null);
  const [formData, setFormData] = useState<Partial<StoreInfo>>({
    nameVi: '',
    nameEn: '',
    address: '',
    hotline: '',
    email: '',
    shippingFee: '0',
    currency: 'VND',
    logoId: undefined,
    logo: undefined,
    bankQrId: undefined,
    bankQr: undefined,
    descriptionVi: '',
    descriptionEn: '',
    bankName: '',
    bankAccountNumber: '',
    bankAccountName: '',
    socialLinks: {
      facebook: '',
      instagram: '',
      tiktok: '',
      youtube: '',
    },
    mapUrl: '',
    mapUrlEn: '',
  });

  useEffect(() => {
    // Check authentication and admin role
    if (!isAuthenticated || (user?.role !== 'admin' && user?.role !== 'staff')) {
      router.push(`/${locale}/admin/login`);
      return;
    }

    fetchStoreInfo();
  }, [isAuthenticated, user]);

  const fetchStoreInfo = async () => {
    try {
      setLoading(true);
      const response = await adminStoreService.getInfo();
      setFormData(response);
    } catch (error) {
      console.error('Failed to fetch store info:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleLogoFileSelect = (file: File | null) => {
    setLogoFile(file);
    // If file is removed, mark logoId as null to delete the logo
    if (!file) {
      setFormData((prev) => ({
        ...prev,
        logoId: null as any,
        logo: null as any,
      }));
    }
  };

  const handleBankQrFileSelect = (file: File | null) => {
    setBankQrFile(file);
    // If file is removed, mark bankQrId as null to delete the bank QR
    if (!file) {
      setFormData((prev) => ({
        ...prev,
        bankQrId: null as any,
        bankQr: null as any,
      }));
    }
  };

  const handleSocialLinkChange = (platform: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      socialLinks: {
        ...prev.socialLinks,
        [platform]: value,
      },
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      let uploadedLogoId = formData.logoId;
      let uploadedBankQrId = formData.bankQrId;

      // Upload logo file if a new file is selected
      if (logoFile) {
        const uploadedMedia = await adminMediaService.upload(logoFile);
        uploadedLogoId = uploadedMedia.id;
      }

      // Upload bank QR file if a new file is selected
      if (bankQrFile) {
        const uploadedMedia = await adminMediaService.upload(bankQrFile);
        uploadedBankQrId = uploadedMedia.id;
      }

      // Destructure to exclude read-only fields
      const { id, createdAt, updatedAt, logo, bankQr, ...restData } = formData;

      // Convert shippingFee to number before sending
      const dataToSubmit = {
        ...restData,
        logoId: uploadedLogoId,
        bankQrId: uploadedBankQrId,
        shippingFee: formData.shippingFee ? Number(formData.shippingFee) : 0,
      };

      await adminStoreService.update(dataToSubmit);
      alert(t('admin.settings.saveSuccess'));
      setLogoFile(null); // Clear the file after successful save
      setBankQrFile(null);
      fetchStoreInfo(); // Refresh data
    } catch (error) {
      console.error('Failed to save store settings:', error);
      alert(t('admin.settings.saveError'));
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent"></div>
          <p className="mt-2 text-sm text-gray-600">
            {t('admin.settings.loadingSettings')}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          {t('admin.settings.title')}
        </h1>
        <p className="text-sm text-gray-600">
          {t('admin.settings.description')}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Store Information */}
        <Card className="p-6">
          <div className="mb-4 flex items-center gap-2">
            <Store className="h-5 w-5 text-gray-600" />
            <h2 className="text-lg font-semibold text-gray-900">
              {t('admin.settings.storeInfo')}
            </h2>
          </div>

          <div className="mb-6">
            <LogoUpload
              logo={formData.logo}
              logoFile={logoFile}
              onFileSelect={handleLogoFileSelect}
              locale={locale}
            />
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="nameVi">
                {t('admin.settings.storeNameVi')} *
              </Label>
              <Input
                id="nameVi"
                name="nameVi"
                value={formData.nameVi}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="nameEn">
                {t('admin.settings.storeNameEn')} *
              </Label>
              <Input
                id="nameEn"
                name="nameEn"
                value={formData.nameEn}
                onChange={handleInputChange}
                required
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="address">
                {t('admin.settings.address')} *
              </Label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">
                {t('admin.settings.phone')} *
              </Label>
              <Input
                id="hotline"
                name="hotline"
                type="tel"
                value={formData.hotline}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
            </div>

            <div>
              <Label htmlFor="shippingFee">
                {locale === 'vi' ? 'Phí vận chuyển mặc định' : 'Default Shipping Fee'}
              </Label>
              <Input
                id="shippingFee"
                name="shippingFee"
                type="number"
                step="0.01"
                value={formData.shippingFee}
                onChange={handleInputChange}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="currency">
                {locale === 'vi' ? 'Đơn vị tiền tệ' : 'Currency'} *
              </Label>
              <select
                id="currency"
                name="currency"
                value={formData.currency}
                onChange={handleInputChange}
                required
                className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="VND">VND - Vietnamese Dong</option>
                <option value="USD">USD - US Dollar</option>
                <option value="EUR">EUR - Euro</option>
                <option value="GBP">GBP - British Pound</option>
                <option value="JPY">JPY - Japanese Yen</option>
                <option value="CNY">CNY - Chinese Yuan</option>
              </select>
              <p className="mt-1 text-xs text-gray-500">
                {locale === 'vi'
                  ? 'Đơn vị tiền tệ sẽ được sử dụng cho toàn bộ hệ thống'
                  : 'This currency will be used throughout the entire system'}
              </p>
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descriptionVi">
                {locale === 'vi' ? 'Mô tả cửa hàng (Tiếng Việt)' : 'Store Description (Vietnamese)'}
              </Label>
              <Textarea
                id="descriptionVi"
                name="descriptionVi"
                value={formData.descriptionVi}
                onChange={handleInputChange}
                rows={3}
                placeholder={locale === 'vi' ? 'Nhập mô tả cửa hàng bằng tiếng Việt...' : 'Enter store description in Vietnamese...'}
              />
            </div>

            <div className="md:col-span-2">
              <Label htmlFor="descriptionEn">
                {locale === 'vi' ? 'Mô tả cửa hàng (Tiếng Anh)' : 'Store Description (English)'}
              </Label>
              <Textarea
                id="descriptionEn"
                name="descriptionEn"
                value={formData.descriptionEn}
                onChange={handleInputChange}
                rows={3}
                placeholder={locale === 'vi' ? 'Nhập mô tả cửa hàng bằng tiếng Anh...' : 'Enter store description in English...'}
              />
            </div>
          </div>
        </Card>

        {/* Bank Information */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === 'vi' ? 'Thông tin Ngân hàng' : 'Bank Information'}
            </h2>
            <p className="text-sm text-gray-600">
              {locale === 'vi'
                ? 'Thông tin tài khoản ngân hàng để khách hàng chuyển khoản'
                : 'Bank account information for customer transfers'}
            </p>
          </div>

          <div className="mb-6">
            <BankQrUpload
              bankQr={formData.bankQr}
              bankQrFile={bankQrFile}
              onFileSelect={handleBankQrFileSelect}
              locale={locale}
            />
          </div>

          <div className="grid grid-cols-1 gap-4">
            <div>
              <Label htmlFor="bankName">
                {locale === 'vi' ? 'Tên ngân hàng' : 'Bank Name'}
              </Label>
              <Input
                id="bankName"
                name="bankName"
                value={formData.bankName}
                onChange={handleInputChange}
                placeholder={locale === 'vi' ? 'Ví dụ: Vietcombank, BIDV, Techcombank' : 'Example: Vietcombank, BIDV, Techcombank'}
              />
            </div>

            <div>
              <Label htmlFor="bankAccountNumber">
                {locale === 'vi' ? 'Số tài khoản' : 'Account Number'}
              </Label>
              <Input
                id="bankAccountNumber"
                name="bankAccountNumber"
                value={formData.bankAccountNumber}
                onChange={handleInputChange}
                placeholder={locale === 'vi' ? 'Nhập số tài khoản ngân hàng' : 'Enter bank account number'}
              />
            </div>

            <div>
              <Label htmlFor="bankAccountName">
                {locale === 'vi' ? 'Chủ tài khoản' : 'Account Holder Name'}
              </Label>
              <Input
                id="bankAccountName"
                name="bankAccountName"
                value={formData.bankAccountName}
                onChange={handleInputChange}
                placeholder={locale === 'vi' ? 'Ví dụ: NGUYEN VAN A' : 'Example: NGUYEN VAN A'}
              />
              <p className="mt-1 text-xs text-gray-500">
                {locale === 'vi'
                  ? 'Nhập tên chủ tài khoản theo đúng định dạng trên thẻ ngân hàng'
                  : 'Enter the account holder name as it appears on the bank card'}
              </p>
            </div>
          </div>
        </Card>

        {/* Social Links */}
        <Card className="p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              {locale === 'vi' ? 'Liên kết mạng xã hội' : 'Social Media Links'}
            </h2>
            <p className="text-sm text-gray-600">
              {locale === 'vi'
                ? 'Thêm các liên kết đến trang mạng xã hội của bạn'
                : 'Add links to your social media pages'}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div>
              <Label htmlFor="facebook">Facebook</Label>
              <Input
                id="facebook"
                name="facebook"
                type="url"
                value={formData.socialLinks?.facebook || ''}
                onChange={(e) => handleSocialLinkChange('facebook', e.target.value)}
                placeholder="https://facebook.com/yourpage"
              />
            </div>

            <div>
              <Label htmlFor="instagram">Instagram</Label>
              <Input
                id="instagram"
                name="instagram"
                type="url"
                value={formData.socialLinks?.instagram || ''}
                onChange={(e) => handleSocialLinkChange('instagram', e.target.value)}
                placeholder="https://instagram.com/yourpage"
              />
            </div>

            <div>
              <Label htmlFor="tiktok">TikTok</Label>
              <Input
                id="tiktok"
                name="tiktok"
                type="url"
                value={formData.socialLinks?.tiktok || ''}
                onChange={(e) => handleSocialLinkChange('tiktok', e.target.value)}
                placeholder="https://tiktok.com/@yourpage"
              />
            </div>

            <div>
              <Label htmlFor="youtube">YouTube</Label>
              <Input
                id="youtube"
                name="youtube"
                type="url"
                value={formData.socialLinks?.youtube || ''}
                onChange={(e) => handleSocialLinkChange('youtube', e.target.value)}
                placeholder="https://youtube.com/@yourchannel"
              />
            </div>
          </div>
        </Card>

        {/* Google Maps */}
        <Card className="p-6">
          <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold">
            <MapPin className="h-5 w-5" />
            {locale === 'vi' ? 'Bản đồ Google Maps' : 'Google Maps'}
          </h3>
          <div className="space-y-4">
            <div>
              <Label htmlFor="mapUrl">
                {locale === 'vi' ? 'URL Nhúng Bản đồ (Tiếng Việt)' : 'Map Embed URL (Vietnamese)'}
              </Label>
              <Input
                id="mapUrl"
                name="mapUrl"
                type="url"
                value={formData.mapUrl || ''}
                onChange={handleInputChange}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="mt-2 text-xs text-gray-500">
                {locale === 'vi'
                  ? 'Dán URL nhúng từ Google Maps với ngôn ngữ Tiếng Việt'
                  : 'Paste the embed URL from Google Maps with Vietnamese language'}
              </p>
            </div>
            
            <div>
              <Label htmlFor="mapUrlEn">
                {locale === 'vi' ? 'URL Nhúng Bản đồ (Tiếng Anh)' : 'Map Embed URL (English)'}
              </Label>
              <Input
                id="mapUrlEn"
                name="mapUrlEn"
                type="url"
                value={formData.mapUrlEn || ''}
                onChange={handleInputChange}
                placeholder="https://www.google.com/maps/embed?pb=..."
              />
              <p className="mt-2 text-xs text-gray-500">
                {locale === 'vi'
                  ? 'Dán URL nhúng từ Google Maps với ngôn ngữ Tiếng Anh'
                  : 'Paste the embed URL from Google Maps with English language'}
              </p>
            </div>

            <div className="rounded-md bg-blue-50 p-3">
              <p className="text-xs text-blue-900">
                <strong>{locale === 'vi' ? '💡 Hướng dẫn:' : '💡 Instructions:'}</strong>
                <br />
                {locale === 'vi' ? (
                  <>
                    1. Mở Google Maps và tìm địa điểm
                    <br />
                    2. Nhấn vào nút &quot;Share&quot; → &quot;Embed a map&quot;
                    <br />
                    3. Nhấn vào &quot;View larger map&quot; trên góc trên bên phải
                    <br />
                    4. Thay đổi ngôn ngữ ở góc dưới: VI cho Tiếng Việt, EN cho Tiếng Anh
                    <br />
                    5. Lấy lại embed code và dán vào ô tương ứng
                  </>
                ) : (
                  <>
                    1. Open Google Maps and find your location
                    <br />
                    2. Click &quot;Share&quot; → &quot;Embed a map&quot;
                    <br />
                    3. Click &quot;View larger map&quot; in the top right corner
                    <br />
                    4. Change language at the bottom: VI for Vietnamese, EN for English
                    <br />
                    5. Get the embed code again and paste it in the corresponding field
                  </>
                )}
              </p>
            </div>
          </div>
        </Card>

        {/* Action Buttons */}
        <div className="flex justify-end gap-4">
          <Button
            type="button"
            variant="outline"
            onClick={() => fetchStoreInfo()}
            disabled={saving}
          >
            {locale === 'vi' ? 'Làm mới' : 'Refresh'}
          </Button>
          <Button type="submit" disabled={saving} className="flex items-center gap-2">
            <Save className="h-4 w-4" />
            {saving
              ? (locale === 'vi' ? 'Đang lưu...' : 'Saving...')
              : (locale === 'vi' ? 'Lưu cài đặt' : 'Save Settings')}
          </Button>
        </div>
      </form>

      {/* Info Card */}
      <Card className="border-blue-200 bg-blue-50 p-4">
        <div className="flex gap-3">
          <Store className="h-5 w-5 flex-shrink-0 text-blue-600" />
          <div className="text-sm text-blue-900">
            <p className="font-semibold">
              {locale === 'vi' ? 'Lưu ý quan trọng' : 'Important Note'}
            </p>
            <p className="mt-1">
              {locale === 'vi'
                ? 'Thay đổi đơn vị tiền tệ sẽ ảnh hưởng đến cách hiển thị giá cả trên toàn bộ website. Đảm bảo bạn đã cập nhật giá sản phẩm phù hợp với đơn vị tiền tệ mới.'
                : 'Changing the currency will affect how prices are displayed throughout the website. Make sure you have updated product prices to match the new currency.'}
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
