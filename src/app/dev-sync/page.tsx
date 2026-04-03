
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  RefreshCcw, 
  Github, 
  Rocket, 
  Terminal, 
  CheckCircle2, 
  AlertCircle,
  ArrowRight,
  ShieldCheck,
  History
} from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function DevSyncPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isSyncing, setIsSyncing] = useState(false);

  const syncQuery = useMemoFirebase(() => query(collection(db, "syncStatus"), orderBy("lastSyncAt", "desc"), limit(1)), [db]);
  const { data: syncData, isLoading } = useCollection(syncQuery);
  const lastSync = syncData?.[0];

  const handleManualSync = () => {
    setIsSyncing(true);
    const now = new Date().toISOString();
    
    const syncUpdate = {
      lastSyncAt: now,
      lastCommitMessage: "Update from Nalakath Executive Console",
      deploymentStatus: "Triggered",
      syncByUserId: "hafees_admin"
    };

    addDocumentNonBlocking(collection(db, "syncStatus"), syncUpdate);
    
    setTimeout(() => {
      setIsSyncing(false);
      toast({
        title: "Sync Protocol Initialized",
        description: "Metadata updated. Please push local changes to GitHub.",
      });
    }, 1500);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-5xl mx-auto">
            <header className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                  SYSTEM OVERSEER
                </Badge>
                <div className="flex items-center gap-1.5 text-[9px] text-green-500 font-bold uppercase tracking-widest bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10">
                  <ShieldCheck className="h-3 w-3" /> PIPELINE INTEGRITY: ACTIVE
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2">
                Dev Workflow Sync
              </h1>
              <p className="text-muted-foreground text-sm">Automated bridge between AI Studio, GitHub, and Production.</p>
            </header>

            <div className="grid gap-6 md:grid-cols-3">
              <StatusCard 
                title="Last Sync" 
                value={lastSync ? new Date(lastSync.lastSyncAt).toLocaleTimeString() : "N/A"} 
                icon={History} 
                desc={lastSync ? new Date(lastSync.lastSyncAt).toLocaleDateString() : "No history found"}
              />
              <StatusCard 
                title="Git Origin" 
                value="Main Branch" 
                icon={Github} 
                desc="nalakath-holdings-ledger"
                color="text-primary"
              />
              <StatusCard 
                title="Vercel Status" 
                value={lastSync?.deploymentStatus || "Idle"} 
                icon={Rocket} 
                desc="Auto-deploy enabled"
                color="text-green-500"
              />
            </div>

            <div className="grid gap-6 lg:grid-cols-5">
              <Card className="lg:col-span-3 control-center-card">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Terminal className="h-5 w-5 text-primary" />
                    Sync Protocol Instructions
                  </CardTitle>
                  <CardDescription>Follow these steps to push changes to Vercel production.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-4">
                  <StepItem 
                    num="01" 
                    title="Export Codebase" 
                    desc="Download the latest version from Firebase AI Studio." 
                  />
                  <StepItem 
                    num="02" 
                    title="Commit Changes" 
                    desc="Run 'git commit -m \"update from studio\"' in your terminal." 
                  />
                  <StepItem 
                    num="03" 
                    title="Push to Cloud" 
                    desc="Execute 'git push origin main' to trigger Vercel rebuild." 
                    isLast
                  />
                  <Button 
                    onClick={handleManualSync} 
                    disabled={isSyncing}
                    className="w-full h-14 rounded-2xl gold-gradient text-black font-bold mt-4 shadow-lg shadow-primary/20"
                  >
                    {isSyncing ? <RefreshCcw className="h-5 w-5 animate-spin mr-2" /> : <RefreshCcw className="h-5 w-5 mr-2" />}
                    Log Deployment Sync
                  </Button>
                </CardContent>
              </Card>

              <Card className="lg:col-span-2 control-center-card bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    Sync Logs
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!isLoading && lastSync ? (
                    <div className="p-5 rounded-[2rem] bg-background/50 border border-white/5 space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Message</span>
                        <Badge variant="outline" className="text-[9px] uppercase border-primary/30 text-primary">Success</Badge>
                      </div>
                      <p className="text-sm font-medium italic">"{lastSync.lastCommitMessage}"</p>
                      <div className="pt-2 border-t border-white/5 flex justify-between text-[9px] text-muted-foreground font-mono">
                        <span>BY: {lastSync.syncByUserId}</span>
                        <span>{new Date(lastSync.lastSyncAt).toLocaleString()}</span>
                      </div>
                    </div>
                  ) : (
                    <p className="text-center py-10 text-muted-foreground text-sm">No recent sync events logged.</p>
                  )}
                </CardContent>
              </Card>
            </div>
            
            <p className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30 pb-12">
              NALAKATH HOLDINGS © 2026 • PIPELINE V1.0
            </p>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function StatusCard({ title, value, icon: Icon, desc, color = "text-foreground" }: any) {
  return (
    <Card className="control-center-card border-white/5">
      <div className="flex flex-col gap-1">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4">{title}</p>
        <div className="flex items-center justify-between">
          <div className={cn("text-2xl font-bold font-mono tracking-tighter", color)}>
            {value}
          </div>
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-60">{desc}</p>
      </div>
    </Card>
  );
}

function StepItem({ num, title, desc, isLast }: any) {
  return (
    <div className="flex gap-4 group">
      <div className="flex flex-col items-center">
        <div className="h-8 w-8 rounded-full border border-primary/30 flex items-center justify-center text-[10px] font-bold text-primary bg-primary/5 group-hover:bg-primary group-hover:text-black ios-transition">
          {num}
        </div>
        {!isLast && <div className="w-px flex-1 bg-white/10 my-2" />}
      </div>
      <div className="pb-4">
        <h3 className="text-sm font-bold uppercase tracking-tight">{title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
