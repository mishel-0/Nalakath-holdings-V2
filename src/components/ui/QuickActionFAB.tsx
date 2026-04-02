
"use client";

import { useState } from "react";
import { Plus, ReceiptText, Calculator, BookOpen, ListTree } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

export function QuickActionFAB() {
  const [isOpen, setIsOpen] = useState(false);
  const { user } = useUser();
  const db = useFirestore();

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile } = useDoc(profileDocRef);
  const isAdmin = profile?.role === "Admin";

  return (
    <div className="fixed bottom-24 right-6 md:bottom-8 md:right-8 z-50 flex flex-col items-end gap-3">
      {/* Action Buttons */}
      <div className={cn(
        "flex flex-col items-end gap-3 ios-transition",
        isOpen ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10 pointer-events-none"
      )}>
        <QuickActionItem 
          href="/accounting" 
          label="New Ledger Entry" 
          icon={BookOpen} 
          delay="delay-[0ms]"
          onClick={() => setIsOpen(false)}
        />
        {isAdmin ? (
          <QuickActionItem 
            href="/vouchers" 
            label="Record Voucher" 
            icon={ReceiptText} 
            delay="delay-[50ms]"
            onClick={() => setIsOpen(false)}
          />
        ) : (
          <QuickActionItem 
            href="/accounts" 
            label="Chart of Accounts" 
            icon={ListTree} 
            delay="delay-[50ms]"
            onClick={() => setIsOpen(false)}
          />
        )}
        <QuickActionItem 
          href="/expenses" 
          label="Log Expense" 
          icon={Calculator} 
          delay="delay-[100ms]"
          onClick={() => setIsOpen(false)}
        />
      </div>

      {/* Main Toggle Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "h-14 w-14 rounded-full shadow-2xl ios-transition p-0 flex items-center justify-center border-none",
          isOpen ? "bg-white text-black rotate-45 scale-90" : "bg-primary text-black scale-100"
        )}
      >
        <Plus className="h-8 w-8" />
      </Button>
    </div>
  );
}

function QuickActionItem({ href, label, icon: Icon, delay, onClick }: any) {
  return (
    <div className={cn("flex items-center gap-3 ios-transition", delay)}>
      <span className="glass px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest text-primary border-primary/20 shadow-xl">
        {label}
      </span>
      <Link href={href}>
        <Button
          onClick={onClick}
          variant="secondary"
          size="icon"
          className="h-12 w-12 rounded-full glass border-white/10 text-primary shadow-2xl hover:bg-primary hover:text-black"
        >
          <Icon className="h-5 w-5" />
        </Button>
      </Link>
    </div>
  );
}
