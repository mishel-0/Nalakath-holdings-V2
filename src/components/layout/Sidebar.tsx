
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
  History,
  RefreshCcw,
  Terminal,
  Percent,
  FileText
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { doc } from "firebase/firestore";
import { useDivision } from "@/context/DivisionContext";

const navigation = [
  { name: "Dashboard", href: "/", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: HardHat, adminOnly: true, projectsOnly: true },
  { name: "Accounting", href: "/accounting", icon: BookOpen },
  { name: "Tax Engine", href: "/tax", icon: Percent },
  { name: "Chart of Accounts", href: "/accounts", icon: ListTree },
  { name: "Payment Vouchers", href: "/vouchers", icon: ReceiptText, adminOnly: true },
  { name: "Expenses", href: "/expenses", icon: Calculator },
  { name: "Invoice Generator", href: "/invoice-generator", icon: FileText, adminOnly: true },
  { name: "Assets", href: "/assets", icon: Layers, adminOnly: true },
  { name: "Loans", href: "/loans", icon: Landmark, adminOnly: true },
  { name: "Reports", href: "/reports", icon: BarChart3 },
  { name: "AI Insights", href: "/insights", icon: Sparkles },
  { name: "Dev Sync", href: "/dev-sync", icon: RefreshCcw, adminOnly: true },
  { name: "Dev Console", href: "/developer", icon: Terminal, devOnly: true },
  { name: "System Logs", href: "/logs", icon: History, adminOnly: true },
];

import { motion } from "framer-motion";

export function Sidebar() {
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
  const isDev = profile?.role === "Developer";
  const isAccountant = profile?.role === "Accountant";

  const filteredNavigation = navigation.filter(item => {
    if (item.adminOnly && !isAdmin && !isDev && !isAccountant) return false;
    if (item.devOnly && !isDev) return false;
    if (item.projectsOnly && activeDivision.id !== "nalakath-holdings-main") return false;
    return true;
  });

  return (
    <aside className="fixed left-4 top-24 z-30 hidden h-[calc(100vh-8rem)] w-64 glass rounded-[2.5rem] border border-white/5 shadow-2xl md:block overflow-hidden">
      <div className="flex h-full flex-col gap-4 p-4">
        <nav className="flex-1 space-y-1 overflow-y-auto custom-scrollbar pr-1 pt-4">
          {filteredNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <motion.div
                key={item.name}
                whileTap={{ scale: 0.96 }}
                transition={{ type: "spring", stiffness: 400, damping: 17 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "group relative flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-medium ios-transition",
                    isActive ? "text-black" : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-nav"
                      className="absolute inset-0 bg-primary rounded-2xl -z-10 shadow-lg shadow-primary/20"
                      transition={{ type: "spring", stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon className={cn("h-5 w-5", isActive ? "text-black" : "text-primary/70 group-hover:text-primary")} />
                  {item.name}
                </Link>
              </motion.div>
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
