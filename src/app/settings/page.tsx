"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Shield, 
  Globe, 
  Bell, 
  CreditCard, 
  LogOut, 
  ShieldCheck,
  Building2,
  ChevronRight,
  UserCircle
} from "lucide-react";
import { useUser, useDoc, useFirestore, useMemoFirebase, useAuth } from "@/firebase";
import { doc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { cn } from "@/lib/utils";

export default function SettingsPage() {
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
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-4xl mx-auto">
            <header className="flex items-center gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Settings</h1>
                <p className="text-muted-foreground">Manage your group profile and system preferences.</p>
              </div>
            </header>

            <div className="grid gap-6">
              {/* Profile Section */}
              <Card className="glass border-white/5 overflow-hidden rounded-[2rem]">
                <CardHeader className="bg-white/5 pb-4">
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-3xl gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                      <UserCircle className="h-10 w-10 text-black" />
                    </div>
                    <div>
                      <CardTitle>{profile?.firstName} {profile?.lastName}</CardTitle>
                      <CardDescription>{user?.email}</CardDescription>
                      <Badge className={cn(
                        "mt-2 rounded-full px-3 py-0.5 text-[10px] uppercase font-bold tracking-widest",
                        isAdmin ? "bg-primary text-black" : "bg-blue-400 text-black"
                      )}>
                        {profile?.role} Access
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold opacity-50">First Name</Label>
                      <Input disabled value={profile?.firstName || ""} className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Last Name</Label>
                      <Input disabled value={profile?.lastName || ""} className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold opacity-50">Primary Email</Label>
                    <Input disabled value={user?.email || ""} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                </CardContent>
              </Card>

              {/* Preferences Section */}
              <Card className="glass border-white/5 rounded-[2rem]">
                <CardContent className="p-0">
                  <SettingItem 
                    icon={Globe} 
                    title="Regional Preferences" 
                    desc="Currency (INR), Timezone, and Language" 
                    badge="₹ INR"
                  />
                  <Separator className="bg-white/5" />
                  <SettingItem 
                    icon={Building2} 
                    title="Active Division" 
                    desc="Primary ledger visibility for your session" 
                    badge="Nalakath Holdings"
                  />
                  <Separator className="bg-white/5" />
                  <SettingItem 
                    icon={Bell} 
                    title="Notifications" 
                    desc="Ledger alerts and AI analysis summaries" 
                    toggle 
                  />
                </CardContent>
              </Card>

              {/* Security & Support */}
              <Card className="glass border-white/5 rounded-[2rem]">
                <CardContent className="p-0">
                  <SettingItem 
                    icon={ShieldCheck} 
                    title="Two-Factor Auth" 
                    desc="Add an extra layer of security to your account" 
                    badge="Disabled"
                  />
                  <Separator className="bg-white/5" />
                  <SettingItem 
                    icon={CreditCard} 
                    title="Billing Information" 
                    desc="Manage group subscriptions and plan details" 
                  />
                </CardContent>
              </Card>

              <Button 
                onClick={handleSignOut}
                variant="destructive" 
                className="w-full h-14 rounded-2xl font-bold flex items-center justify-center gap-2 hover:bg-destructive/90 transition-all shadow-xl shadow-destructive/10"
              >
                <LogOut className="h-5 w-5" />
                Sign Out of System
              </Button>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function SettingItem({ icon: Icon, title, desc, badge, toggle }: any) {
  return (
    <div className="flex items-center justify-between p-6 hover:bg-white/5 ios-transition cursor-pointer group">
      <div className="flex items-center gap-4">
        <div className="p-3 bg-white/5 rounded-2xl group-hover:bg-primary/20 group-hover:text-primary ios-transition">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <p className="font-bold text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{desc}</p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        {badge && <Badge variant="secondary" className="bg-white/5 text-[10px] px-3 font-mono">{badge}</Badge>}
        {toggle && <div className="h-5 w-9 bg-primary/20 rounded-full relative"><div className="absolute right-1 top-1 h-3 w-3 bg-primary rounded-full" /></div>}
        <ChevronRight className="h-4 w-4 text-muted-foreground opacity-30" />
      </div>
    </div>
  );
}
