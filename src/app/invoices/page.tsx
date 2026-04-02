
"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

/**
 * Redirecting the legacy invoices route to the new vouchers module.
 */
export default function InvoicesRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace("/vouchers");
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen bg-black text-primary">
      <div className="animate-pulse">Redirecting to Payment Vouchers...</div>
    </div>
  );
}
