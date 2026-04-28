'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useUser } from '@/firebase';

/**
 * AuthGuard ensures hydration safety by rendering an identical initial state 
 * on both server and client, then activating animations post-mount.
 */
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

  // Standardized loading state to prevent hydration mismatches
  if (!mounted) return null;

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full bg-primary/10 border border-primary/5 shadow-lg shadow-primary/5 flex items-center justify-center">
            <div className="w-8 h-8 rounded-full gold-gradient animate-pulse" />
          </div>
          <p className="text-primary font-medium tracking-widest uppercase text-[10px] opacity-50">
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


