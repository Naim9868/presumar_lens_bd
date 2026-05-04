// app/layout.tsx (updated for Next.js 16+)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';
// import AppProviders from '@/components/providers/AppProviders';
import ToastProvider from '@/components/providers/ToastProvider';
// import ProductDrawer from '@/components/product/ProductDrawer';
import { QueryProviders } from '@/components/providers/QueryClientProvider';

const inter = Inter({ 
  subsets: ['latin'], 
  variable: '--font-inter',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'PresumerLensBD | Premium Optics & Lenses',
  description: 'Discover premium quality lenses and eyewear at PresumerLensBD. Shop the finest collection with exceptional clarity and style.',
  keywords: 'premium lenses, eyewear, optics, PresumerLensBD',
  authors: [{ name: 'PresumerLensBD' }],
  // viewport: 'width=device-width, initial-scale=1, maximum-scale=1',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable}`}>
      <body className="font-sans antialiased bg-gray-50">
      <QueryProviders>
        <Navbar />
        <main className="min-h-screen">
          {children}
        </main>
        {/* <ProductDrawer /> */}
      <ToastProvider />
      </QueryProviders>
      </body>
    </html>
  );
}