"use client";

import { useState } from "react";
import { ChevronDown, Building2, User, LogOut, Bell, Search } from "lucide-react";
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
  const { user } = useUser();
  const auth = useAuth();
  const db = useFirestore();

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile } = useDoc(profileDocRef);
  const isAdmin = profile?.role === "Admin";

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-white/10 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="h-10 w-10 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
              <span className="text-black font-black text-xl">N</span>
            </div>
          </Link>

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 gap-2 ios-transition hover:bg-white/5 text-white">
                <Building2 className="h-4 w-4 text-primary" />
                <div className="flex flex-col items-start hidden sm:flex">
                   <span className="text-[10px] font-bold text-primary uppercase tracking-tighter">{activeCompany.name}</span>
                   <span className="text-[8px] text-muted-foreground uppercase">{activeCompany.division}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 glass">
              <DropdownMenuLabel className="text-[10px] uppercase tracking-widest font-bold opacity-50">Switch Division</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-white/5" />
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setActiveCompany(company)}
                  className="flex flex-col items-start gap-1 py-3 cursor-pointer hover:bg-white/5"
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
              className="pl-10 h-10 rounded-full bg-white/10 border-white/10 focus-visible:ring-primary/50"
            />
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" className="rounded-full relative hover:bg-white/5">
            <Bell className="h-5 w-5 text-muted-foreground" />
            <span className="absolute top-2 right-2 h-2 w-2 bg-destructive rounded-full border-2 border-background" />
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/5">
                <User className="h-5 w-5 text-primary" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64 glass">
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
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link href="/settings" className="cursor-pointer">
                  <Building2 className="mr-2 h-4 w-4" /> System Settings
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleSignOut} className="text-destructive focus:text-destructive cursor-pointer">
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
