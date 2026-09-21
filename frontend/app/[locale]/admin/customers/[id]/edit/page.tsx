'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useTranslations } from 'next-intl';
import { ArrowLeft } from 'lucide-react';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';
import { useAdminCustomer, useUpdateCustomer } from '@/lib/hooks/use-admin';
import { useToast } from '@/hooks/use-toast';
import { useCurrency } from '@/lib/hooks/useCurrency';

interface CustomerEditPageProps {
  params: {
    locale: string;
    id: string;
  };
}

export default function CustomerEditPage({ params: { locale, id } }: CustomerEditPageProps) {
  const customerId = Number(id);
  const router = useRouter();
  const t = useTranslations('admin.customers');
  const { toast } = useToast();
  const { formatPrice } = useCurrency();

  const { data, isLoading } = useAdminCustomer(customerId);
  const updateCustomer = useUpdateCustomer();

  const [fullName, setFullName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');
  const [isActive, setIsActive] = useState(true);

  useEffect(() => {
    if (data) {
      setFullName(data.fullName || '');
      setPhoneNumber(data.phoneNumber || '');
      setEmail(data.email || '');
      setIsActive(data.isActive ?? true);
    }
  }, [data]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    try {
      await updateCustomer.mutateAsync({
        id: customerId,
        data: {
          fullName: fullName.trim(),
          phoneNumber: phoneNumber.trim() || undefined,
          email: email.trim(),
          isActive,
        },
      });

      toast({
        title: t('toast.updateSuccessTitle'),
        description: t('toast.updateSuccessDescription'),
      });
      router.push(`/${locale}/admin/customers`);
    } catch (error) {
      console.error('Failed to update customer', error);
      toast({
        title: t('toast.updateErrorTitle'),
        description: t('toast.updateErrorDescription'),
        variant: 'destructive',
      });
    }
  };

  if (Number.isNaN(customerId)) {
    return <p className="text-sm text-red-500">Invalid customer ID</p>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href={`/${locale}/admin/customers`}>
          <Button variant="outline">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{t('editTitle')}</h1>
          <p className="text-sm text-gray-600">{email || data?.email}</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>{t('editTitle')}</CardTitle>
          <CardDescription>{email || data?.email}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading || !data ? (
            <div className="space-y-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-32" />
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{t('form.fullName')}</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(event) => setFullName(event.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phoneNumber">{t('form.phone')}</Label>
                  <Input
                    id="phoneNumber"
                    value={phoneNumber}
                    onChange={(event) => setPhoneNumber(event.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">{t('form.email')}</Label>
                <Input
                  id="email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  required
                />
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-1">
                  <Label>{t('table.orders')}</Label>
                  <p className="text-lg font-semibold">{data.totalOrders}</p>
                </div>
                <div className="space-y-1">
                  <Label>{t('table.totalSpent')}</Label>
                  <p className="text-lg font-semibold">{formatPrice(data.totalSpent)}</p>
                </div>
                <div className="space-y-1">
                  <Label>{t('table.lastOrder')}</Label>
                  <p className="text-lg font-semibold">
                    {data.lastOrderAt
                      ? new Date(data.lastOrderAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                          dateStyle: 'medium',
                          timeStyle: 'short',
                        })
                      : t('noOrders')}
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border p-4">
                <div>
                  <h3 className="text-sm font-medium">{t('form.statusTitle')}</h3>
                  <p className="text-sm text-muted-foreground">{t('form.statusDescription')}</p>
                </div>
                <Switch checked={isActive} onCheckedChange={setIsActive} />
              </div>

              <CardFooter className="flex justify-end gap-3 px-0">
                <Button type="button" variant="outline" asChild>
                  <Link href={`/${locale}/admin/customers`}>{t('actions.cancel')}</Link>
                </Button>
                <Button type="submit" disabled={updateCustomer.isPending}>
                  {updateCustomer.isPending ? t('actions.saving') : t('actions.save')}
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
