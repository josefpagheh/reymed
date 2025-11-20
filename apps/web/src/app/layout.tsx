'use client';

import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { cn } from '@/shared/lib/utils';
import { useSession } from '@/shared/hooks/useSession';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';

const vazirmatn = Vazirmatn({ subsets: ['arabic'] });

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const { role, loading } = useSession();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading) {
      if (role) {
        if (pathname === '/login') {
          if (role === 'doctor') {
            router.push('/doctor');
          } else if (role === 'clerk') {
            router.push('/clerk');
          }
        }
      } else if (pathname !== '/login') {
        router.push('/login');
      }
    }
  }, [role, loading, pathname, router]);

  if (loading) {
    return (
      <html lang="fa" dir="rtl" suppressHydrationWarning>
        <body className={cn('min-h-screen bg-background font-sans antialiased', vazirmatn.className)}>
          <div>در حال بارگذاری...</div>
        </body>
      </html>
    );
  }

  return (
    <html lang="fa" dir="rtl" suppressHydrationWarning>
      <body className={cn('min-h-screen bg-background font-sans antialiased', vazirmatn.className)}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
