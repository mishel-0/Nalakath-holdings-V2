'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, pathname, mounted]);

  // Handle initial hydration and loading states with an identical structure for server and client
  if (!mounted || isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-full gold-gradient animate-pulse shadow-lg shadow-primary/20" />
          <p className="text-primary font-medium animate-pulse tracking-widest uppercase text-[10px]">
            Syncing Security Protocol...
          </p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
