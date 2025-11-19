import type { Metadata } from 'next';
import { Vazirmatn } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

const vazirmatn = Vazirmatn({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'EMR',
  description: 'Persian EMR',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl">
      <body className={vazirmatn.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
