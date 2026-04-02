"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  HardHat, 
  BookOpen, 
  BarChart3, 
  Sparkles 
} from "lucide-react";
import { cn } from "@/lib/utils";

const mobileNav = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: HardHat },
  { name: "Accounts", href: "/accounting", icon: BookOpen },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI", href: "/insights", icon: Sparkles },
];

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 md:hidden pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {mobileNav.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 rounded-xl px-2 py-1 ios-transition",
                isActive ? "text-primary" : "text-muted-foreground"
              )}
            >
              <item.icon className={cn("h-6 w-6", isActive && "scale-110")} />
              <span className="text-[10px] font-medium tracking-tight">{item.name}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}