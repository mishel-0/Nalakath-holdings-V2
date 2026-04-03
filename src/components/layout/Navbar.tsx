
"use client";

import { useState, useEffect } from "react";
import { ChevronDown, Building2, User, LogOut, Bell, Search, Sun, Moon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";

const companies = [
  { id: 1, name: "Nalakath Holdings", division: "Group HQ" },
  { id: 2, name: "Green Villa", division: "Real Estate" },
  { id: 3, name: "Oval Palace Resort", division: "Hospitality" },
  { id: 4, name: "Nalakath Construction", division: "Infrastructure" },
];

export function Navbar() {
  const [activeCompany, setActiveCompany] = useState(companies[0]);
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  useEffect(() => {
    const root = window.document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
  }, [theme]);

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile } = useDoc(profileDocRef);
  const isAdmin = profile?.role === "Admin";

  const handleSignOut = () => {
    signOut(auth);
  };

  const toggleTheme = () => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-white/5 backdrop-blur-3xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 gap-2 ios-transition hover:bg-foreground/5 rounded-full">
                <Building2 className="h-4 w-4 text-primary" />
                <div className="flex flex-col items-start">
                   <span className="text-[10px] font-bold uppercase tracking-tighter">{activeCompany.name}</span>
                   <span className="text-[8px] text-muted-foreground uppercase">{activeCompany.division}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 glass rounded-3xl">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-bold opacity-50">Switch Division</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-foreground/5" />
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setActiveCompany(company)}
                  className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-foreground/5 rounded-xl"
                >
                  <span className="font-bold text-sm">{company.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-tight">{company.division}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="hidden md:flex flex-1 max-w-md mx-4">
          <div className="relative w-full">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search financials..." 
              className="pl-10 h-10 rounded-full bg-foreground/5 border-foreground/5 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <Button 
            variant="ghost" 
            size="icon" 
            className="rounded-full hover:bg-foreground/5"
            onClick={toggleTheme}
          >
            {theme === 'dark' ? <Sun className="h-5 w-5 text-primary" /> : <Moon className="h-5 w-5 text-primary" />}
          </Button>

          <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-foreground/5">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2.5 right-2.5 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-foreground/5 overflow-hidden">
                <div className="h-8 w-8 rounded-full bg-foreground/10 flex items-center justify-center">
                  <User className="h-4 w-4 text-muted-foreground" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass rounded-3xl">
              <DropdownMenuLabel>
                <div className="flex flex-col gap-1">
                  <span className="text-sm font-bold">{profile?.firstName} {profile?.lastName}</span>
                  <Badge className={cn(
                    "w-fit h-5 rounded-full px-2 text-[8px] uppercase tracking-widest",
                    isAdmin ? "bg-primary text-black" : "bg-blue-400 text-black"
                  )}>
                    {profile?.role}
                  </Badge>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-foreground/5" />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer rounded-xl">
                  <User className="mr-2 h-4 w-4" /> System Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator className="bg-foreground/5" />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer rounded-xl">
                <LogOut className="mr-2 h-4 w-4" />
                Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
