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

  // Prevent hydration mismatch by only rendering once mounted
  if (!mounted) return null;

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-primary/5 border border-primary/10 flex items-center justify-center relative overflow-hidden">
             <div className="absolute inset-0 gold-gradient opacity-10 animate-pulse" />
             <div className="w-8 h-8 rounded-full gold-gradient animate-bounce shadow-2xl shadow-primary/40" />
          </div>
          <div className="flex flex-col items-center gap-2">
            <p className="text-primary font-black tracking-[0.4em] uppercase text-[10px]">
              Secure Session
            </p>
            <p className="text-muted-foreground/40 font-bold uppercase text-[8px] tracking-[0.2em]">
              Nalakath Ledger Protocol v2.0
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!user && pathname !== '/login') {
    return null;
  }

  return <>{children}</>;
}


