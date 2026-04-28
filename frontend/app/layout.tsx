import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { CartProvider } from '@/context/CartContext';
import { AuthProvider } from '@/context/AuthContext';
import { ToastProvider } from '@/context/ToastContext';
import ChatBot from '@/components/ChatBot';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Website Bán Thiết Bị Vệ Sinh Thông Minh - Novas',
  description: 'Chuyên cung cấp các thiết bị vệ sinh thông minh, cao cấp và chính hãng.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" translate="no">
      <body className={`${inter.className} notranslate`}>
        <AuthProvider>
          <CartProvider>
            <ToastProvider>
              {children}
              <ChatBot />
            </ToastProvider>
          </CartProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
