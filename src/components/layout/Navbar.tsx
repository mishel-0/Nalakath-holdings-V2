
"use client";

import { useState } from "react";
import { ChevronDown, Building2, Bell, Search, User, LogOut, Shield, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { useAuth, useUser, useDoc, useFirestore, useMemoFirebase } from "@/firebase";
import { signOut } from "firebase/auth";
import { doc } from "firebase/firestore";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Image from "next/image";
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
          <Link href="/" className="flex items-center hover:opacity-80 transition-opacity">
            <div className="relative h-10 w-40">
              <Image 
                src="https://firebasestorage.googleapis.com/v0/b/studio-5249571912-a64ac.appspot.com/o/logo.png?alt=media&token=86609904-4861-419b-8e10-c057635c9110" 
                alt="" 
                fill
                className="object-contain object-left"
                unoptimized
                priority
              />
            </div>
          </Link>

          <div className="h-6 w-px bg-white/10 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 gap-2 ios-transition hover:bg-white/5 text-white">
                <Building2 className="h-4 w-4 text-primary" />
                <div className="flex flex-col items-start text-xs">
                  <span className="font-semibold leading-none text-left">{activeCompany.name}</span>
                  <span className="text-muted-foreground hidden sm:block">{activeCompany.division}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 glass">
              <DropdownMenuLabel>Group Divisions</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setActiveCompany(company)}
                  className="flex flex-col items-start gap-1 py-2 cursor-pointer"
                >
                  <span className="font-medium">{company.name}</span>
                  <span className="text-xs text-muted-foreground">{company.division}</span>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="flex items-center gap-4">
          <div className="hidden md:flex items-center gap-2 mr-4">
             <Badge className={cn(
               "h-6 rounded-full px-3 text-[9px] uppercase tracking-widest border-none font-bold",
               isAdmin ? "bg-primary text-black" : "bg-blue-400 text-black"
             )}>
                {isAdmin ? <Shield className="h-2 w-2 mr-1" /> : <ShieldCheck className="h-2 w-2 mr-1" />}
                {profile?.role || "User"}
             </Badge>
          </div>

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
                  <span className="text-[10px] text-muted-foreground">{user?.email}</span>
                </div>
              </DropdownMenuLabel>
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
