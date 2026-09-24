'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/auth-store';
import { Spinner } from '@/components/ui/spinner';

// Redirect /dashboard → /vet o /owner según rol
export default function DashboardPage() {
  const router = useRouter();
  const { user, isLoading } = useAuthStore();

  useEffect(() => {
    if (isLoading) return;
    if (!user) {
      router.replace('/login');
      return;
    }
    if (user.role === 'OWNER') {
      router.replace('/owner');
    } else if (user.role === 'CLINIC_ADMIN' || user.role === 'SUPER_ADMIN') {
      router.replace('/clinic-admin');
    } else {
      router.replace('/vet');
    }
  }, [user, isLoading, router]);

  return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" />
    </div>
  );
}
