import type {Metadata} from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NALAKATH HOLDINGS LEDGER',
  description: 'Premium iOS-style Accounting & ERP for multi-division holdings.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
      </head>
      <body className="font-body antialiased selection:bg-primary/20">
        {children}
      </body>
    </html>
  );
}
