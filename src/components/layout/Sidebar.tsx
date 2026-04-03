"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  BookOpen, 
  ReceiptText, 
  Calculator, 
  HardHat, 
  Landmark, 
  BarChart3, 
  Settings,
  Sparkles,
  Layers,
  ListTree,
  History
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: HardHat, adminOnly: true },
  { name: "Accounting", href: "/accounting", icon: BookOpen },
  { name: "Chart of Accounts", href: "/accounts", icon: ListTree },
  { name: "Payment Vouchers", href: "/vouchers", icon: ReceiptText, adminOnly: true },
  { name: "Expenses", href: "/expenses", icon: Calculator },
  { name: "Assets", href: "/assets", icon: Layers, adminOnly: true },
  { name: "Loans", href: "/loans", icon: Landmark, adminOnly: true },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "System Logs", href: "/logs", icon: History, adminOnly: true },
];

export function Sidebar() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile } = useDoc(profileDocRef);
  const isAdmin = profile?.role === "Admin";

  const filteredNavigation = navigation.filter(item => !item.adminOnly || isAdmin);

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r border-white/10 glass md:block">
      <div className="flex h-full flex-col gap-4 p-4">
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 pt-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ios-transition",
                  isActive 
                    ? "bg-primary text-black shadow-lg shadow-primary/20" 
                    : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
                )}
              >
                <item.icon className={cn("h-5 w-5", isActive ? "text-black" : "text-primary/70 group-hover:text-primary")} />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-1 border-t border-white/5 pt-4">
          <Link
            href="/settings"
            className={cn(
              "flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium ios-transition",
              pathname === "/settings" ? "bg-white/10 text-white" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
            )}
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}