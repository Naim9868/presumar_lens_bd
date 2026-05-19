// app/layout.tsx (updated for Next.js 16+)
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import './fonts.css';
import './async-gallery.css';
import Navbar from '@/components/Navbar';
// import AppProviders from '@/components/providers/AppProviders';
import ToastProvider from '@/components/providers/ToastProvider';
// import ProductDrawer from '@/components/product/ProductDrawer';
import { QueryProviders } from '@/components/providers/QueryClientProvider';
import { ProductDrawerProvider } from '@/components/providers/DrawerProvider';
import { ReduxProvider } from "@/redux/provider";
import Header from '@/components/Header';
import { Providers } from './context/Provider';
import  CartSidebarModal  from "@/components/Common/CartSidebarModal";

import WishlistSidebarModal from '@/components/Common/WishlistSidebarModal';
const inter = Inter({ 
  subsets: ['latin'], 
  weight: ['400', '500', '600', '700'],
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
       <ReduxProvider>
          <Providers>
              <ProductDrawerProvider>
              <QueryProviders>
              {/* <Navbar /> */}
              <Header />
              <main className="min-h-screen">
                {children}
              </main>
              {/* <ProductDrawer /> */}
              <CartSidebarModal />
              <WishlistSidebarModal />
            <ToastProvider />
            </QueryProviders>
            </ProductDrawerProvider>
          </Providers>
       </ReduxProvider>
      </body>
    </html>
  );
}