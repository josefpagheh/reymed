'use client';

import { useAuthStore } from '@/shared/lib/stores/auth';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export function Providers({ children }: { children: React.ReactNode }) {
  const { role } = useAuthStore();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!role && pathname !== '/login') {
      router.push('/login');
    } else if (role === 'doctor' && !pathname.startsWith('/dashboard')) {
      router.push('/dashboard');
    } else if (role === 'clerk' && !pathname.startsWith('/patients')) {
      router.push('/patients');
    }
  }, [role, pathname, router]);

  return <>{children}</>;
}
