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
import { useDivision, companies } from "@/context/DivisionContext";
import { useTheme } from "@/context/ThemeContext";

import { motion, AnimatePresence } from "framer-motion";

export function Navbar() {
  const { activeDivision, setDivision } = useDivision();
  const { theme, toggleTheme } = useTheme();
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
    <header className="sticky top-4 z-40 w-[95%] mx-auto glass rounded-full border border-foreground/5 backdrop-blur-xl shadow-2xl">
      <div className="flex h-16 items-center justify-between px-6 md:px-10">
        <div className="flex items-center gap-4 lg:gap-8">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 px-4 gap-3 smooth-spring hover:bg-foreground/5 rounded-full border border-foreground/5 shadow-inner">
                <div className="flex flex-col items-start text-left">
                   <span className="text-[10px] font-black uppercase tracking-tighter truncate max-w-[140px]">{activeDivision.name}</span>
                   <span className="text-[8px] text-muted-foreground uppercase font-bold">{activeDivision.division}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-30 group-hover:rotate-180 transition-transform duration-500" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-64 glass rounded-[2rem] p-2 animate-in fade-in slide-in-from-top-4 duration-500">
              <DropdownMenuLabel className="text-[9px] uppercase tracking-widest font-black opacity-30 px-4 py-3">Portfolio Divisions</DropdownMenuLabel>
              <DropdownMenuSeparator className="bg-foreground/5 mx-2" />
              {companies.map((company) => (
                <DropdownMenuItem
                  key={company.id}
                  onClick={() => setDivision(company.id)}
                  className="flex flex-col items-start gap-1 p-4 cursor-pointer glass-hover rounded-2xl mb-1 last:mb-0"
                >
                  <span className="font-bold text-sm tracking-tight">{company.name}</span>
                  <span className="text-[9px] text-muted-foreground uppercase font-black tracking-tighter">{company.division}</span>
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
            <AnimatePresence mode="wait" initial={false}>
              <motion.div
                key={theme}
                initial={{ y: -20, opacity: 0, rotate: -90 }}
                animate={{ y: 0, opacity: 1, rotate: 0 }}
                exit={{ y: 20, opacity: 0, rotate: 90 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
              >
                {theme === 'dark' ? (
                  <Sun className="h-5 w-5 text-primary" />
                ) : (
                  <Moon className="h-5 w-5 text-primary" />
                )}
              </motion.div>
            </AnimatePresence>
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
