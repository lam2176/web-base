'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';
import { useAuthStore } from '@/lib/stores/auth.store';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Lock, Mail, AlertCircle } from 'lucide-react';

export default function AdminLogin({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations('auth.admin');
  const tAuth = useTranslations('auth');
  const router = useRouter();
  const { login, isAuthenticated, user, error, clearError } = useAuthStore();
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  useEffect(() => {
    // Redirect if already logged in as admin
    if (isAuthenticated && user?.role === 'admin') {
      router.push(`/${locale}/admin`);
    }
  }, [isAuthenticated, user, router, locale]);

  useEffect(() => {
    if (error) {
      setLoginError(error);
      clearError();
    }
  }, [error, clearError]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setLoginError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setLoginError('');

    try {
      await login({
        email: formData.email,
        password: formData.password,
      });

      // Check if user is admin
      const currentUser = useAuthStore.getState().user;
      if (currentUser?.role !== 'admin') {
        setLoginError(t('accessDenied'));
        await useAuthStore.getState().logout();
        setLoading(false);
        return;
      }

      // Redirect to admin dashboard
      router.push(`/${locale}/admin`);
    } catch (err: any) {
      setLoginError(err.response?.data?.message || t('loginFailed'));
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="w-full max-w-md p-8">
        <div className="mb-8 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-600">
            <Lock className="h-8 w-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900">{t('title')}</h1>
          <p className="mt-2 text-sm text-gray-600">
            {t('subtitle')}
          </p>
        </div>

        {loginError && (
          <div className="mb-6 flex items-start gap-3 rounded-lg bg-red-50 p-4 text-sm text-red-800">
            <AlertCircle className="h-5 w-5 flex-shrink-0" />
            <p>{loginError}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="email">{t('emailAddress')}</Label>
            <div className="relative mt-1">
              <Mail className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder={t('emailPlaceholder')}
                className="pl-10"
                required
                autoComplete="email"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="password">{tAuth('password')}</Label>
            <div className="relative mt-1">
              <Lock className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <Input
                id="password"
                name="password"
                type="password"
                value={formData.password}
                onChange={handleInputChange}
                placeholder={t('passwordPlaceholder')}
                className="pl-10"
                required
                autoComplete="current-password"
              />
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent"></div>
                <span>{t('signingIn')}</span>
              </div>
            ) : (
              t('signIn')
            )}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <a
            href={`/${locale}`}
            className="text-sm text-blue-600 hover:text-blue-700"
          >
            {t('backToStore')}
          </a>
        </div>

        <div className="mt-8 rounded-lg bg-blue-50 p-4">
          <p className="text-xs font-semibold text-blue-900">{t('demoCredentials')}</p>
          <p className="mt-1 text-xs text-blue-700">{t('demoEmail')}</p>
          <p className="text-xs text-blue-700">{t('demoPassword')}</p>
        </div>
      </Card>
    </div>
  );
}
