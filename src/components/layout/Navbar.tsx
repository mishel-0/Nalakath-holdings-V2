"use client";

import { useState } from "react";
import { ChevronDown, Building2, Bell, Search, User, LogOut } from "lucide-react";
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
import { useAuth, useUser } from "@/firebase";
import { signOut } from "firebase/auth";

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

  const handleSignOut = () => {
    signOut(auth);
  };

  return (
    <header className="sticky top-0 z-40 w-full glass border-b border-white/10 backdrop-blur-xl">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8">
        <div className="flex items-center gap-4 lg:gap-8">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-black font-bold text-lg">N</span>
            </div>
            <span className="hidden font-headline text-lg font-bold tracking-tight text-foreground md:inline-block uppercase">
              Nalakath Holdings Ledger
            </span>
          </div>

          <div className="h-6 w-px bg-border/50 hidden md:block" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-9 px-3 gap-2 ios-transition hover:bg-white/10 text-white">
                <Building2 className="h-4 w-4 text-primary" />
                <div className="flex flex-col items-start text-xs">
                  <span className="font-semibold leading-none text-left">{activeCompany.name}</span>
                  <span className="text-muted-foreground hidden sm:block">{activeCompany.division}</span>
                </div>
                <ChevronDown className="h-3 w-3 opacity-50" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-56 glass">
              <DropdownMenuLabel>Switch Division</DropdownMenuLabel>
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

        <div className="flex flex-1 items-center justify-end gap-4 md:gap-6">
          <div className="hidden sm:flex relative max-w-sm flex-1">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search financials..."
              className="pl-9 bg-white/5 border-white/10 rounded-full h-9 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="relative rounded-full hover:bg-white/10">
              <Bell className="h-5 w-5" />
              <span className="absolute top-2 right-2 w-2 h-2 bg-destructive rounded-full" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="rounded-full hover:bg-white/10">
                  <User className="h-5 w-5 text-primary" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 glass">
                <DropdownMenuLabel>
                  <div className="flex flex-col">
                    <span className="text-sm font-bold">Admin Account</span>
                    <span className="text-[10px] text-muted-foreground truncate">{user?.email}</span>
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
      </div>
    </header>
  );
}
