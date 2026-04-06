import type {Metadata} from 'next';
import './globals.css';
import { FirebaseClientProvider } from '@/firebase';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { Toaster } from "@/components/ui/toaster";
import { DivisionProvider } from '@/context/DivisionContext';

export const metadata: Metadata = {
  title: 'NALAKATH HOLDINGS',
  description: 'Premium iOS-style Accounting & ERP for multi-division holdings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.Node;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/20">
        <FirebaseClientProvider>
          <DivisionProvider>
            <AuthGuard>
              {children}
            </AuthGuard>
            <Toaster />
          </DivisionProvider>
        </FirebaseClientProvider>
      </body>
    </html>
  );
}
