'use client';

import { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, isUserLoading } = useUser();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isUserLoading && !user && pathname !== '/login') {
      router.replace('/login');
    }
  }, [user, isUserLoading, router, pathname]);

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary animate-pulse flex items-center justify-center">
            <span className="text-black font-bold text-2xl">N</span>
          </div>
          <p className="text-primary font-medium animate-pulse">Authenticating...</p>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}
