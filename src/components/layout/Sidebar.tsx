
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
  Layers
} from "lucide-react";
import { cn } from "@/lib/utils";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: HardHat },
  { name: "Accounting", href: "/accounting", icon: BookOpen },
  { name: "Payment Vouchers", href: "/vouchers", icon: ReceiptText },
  { name: "Expenses", href: "/expenses", icon: Calculator },
  { name: "Assets", href: "/assets", icon: Layers },
  { name: "Loans", href: "/loans", icon: Landmark },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="fixed left-0 top-16 z-30 hidden h-[calc(100vh-4rem)] w-64 border-r border-white/10 glass md:block">
      <div className="flex h-full flex-col gap-4 p-4">
        <nav className="flex-1 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "group flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium ios-transition",
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
            className="flex items-center gap-3 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-white/5 hover:text-foreground ios-transition"
          >
            <Settings className="h-5 w-5" />
            Settings
          </Link>
        </div>
      </div>
    </aside>
  );
}
