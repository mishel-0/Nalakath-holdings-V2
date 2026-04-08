
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  LayoutDashboard, 
  HardHat, 
  BookOpen, 
  BarChart3, 
  Sparkles,
  ListTree,
  Percent,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDivision } from "@/context/DivisionContext";

const mobileNav = [
  { name: "Home", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: HardHat, adminOnly: true, projectsOnly: true },
  { name: "Invoice", href: "/invoice-generator", icon: FileText, adminOnly: true },
  { name: "Accounting", href: "/accounting", icon: BookOpen },
  { name: "Tax", href: "/tax", icon: Percent },
  { name: "Reports", href: "/reports", icon: BarChart3 },
];

export function BottomNav() {
  const pathname = usePathname();
  const { user } = useUser();
  const db = useFirestore();
  const { activeDivision } = useDivision();

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile } = useDoc(profileDocRef);
  const isAdmin = profile?.role === "Admin";

  const filteredNav = mobileNav.filter(item => {
    if (item.adminOnly && !isAdmin) return false;
    if (item.projectsOnly && activeDivision.id !== "nalakath-holdings-main") return false;
    return true;
  });

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass border-t border-white/10 md:hidden pb-safe">
      <div className="flex h-16 items-center justify-around px-2">
        {filteredNav.map((item) => {
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
