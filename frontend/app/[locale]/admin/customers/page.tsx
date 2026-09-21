'use client';

import { useMemo } from 'react';
import { useTranslations } from 'next-intl';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAdminCustomers } from '@/lib/hooks/use-admin';
import { useCurrency } from '@/lib/hooks/useCurrency';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { Edit } from 'lucide-react';

interface CustomersPageProps {
  params: {
    locale: string;
  };
}

export default function CustomersPage({ params: { locale } }: CustomersPageProps) {
  const t = useTranslations('admin.customers');
  const { data = [], isLoading } = useAdminCustomers();
  const { formatPrice } = useCurrency();

  const customers = useMemo(() => data ?? [], [data]);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{t('title')}</CardTitle>
          <CardDescription>{t('description')}</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, index) => (
                <Skeleton key={index} className="h-12 w-full" />
              ))}
            </div>
          ) : customers.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t('empty')}</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t('table.customer')}</TableHead>
                  <TableHead>{t('table.phone')}</TableHead>
                  <TableHead>{t('table.email')}</TableHead>
                  <TableHead className="text-right">{t('table.orders')}</TableHead>
                  <TableHead className="text-right">{t('table.totalSpent')}</TableHead>
                  <TableHead>{t('table.lastOrder')}</TableHead>
                  <TableHead className="text-center">{t('table.actions')}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {customers.map((customer) => {
                  const lastOrderFormatted = customer.lastOrderAt
                    ? new Date(customer.lastOrderAt).toLocaleString(locale === 'vi' ? 'vi-VN' : 'en-US', {
                        dateStyle: 'medium',
                        timeStyle: 'short',
                      })
                    : t('noOrders');

                  return (
                    <TableRow key={customer.id}>
                      <TableCell className="font-medium">{customer.fullName}</TableCell>
                      <TableCell>{customer.phoneNumber || '-'}</TableCell>
                      <TableCell>{customer.email || '-'}</TableCell>
                      <TableCell className="text-right">{customer.totalOrders}</TableCell>
                      <TableCell className="text-right">{formatPrice(customer.totalSpent)}</TableCell>
                      <TableCell>{lastOrderFormatted}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-center">
                          <Link href={`/${locale}/admin/customers/${customer.id}/edit`}>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
