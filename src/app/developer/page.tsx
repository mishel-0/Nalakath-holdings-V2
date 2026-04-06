"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Terminal, 
  Activity, 
  ShieldAlert, 
  Database, 
  CloudLightning, 
  RefreshCcw, 
  FileJson, 
  Trash2, 
  Zap, 
  AlertCircle,
  CheckCircle2,
  HardHat,
  HeartPulse
} from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function DeveloperDashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("engine");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileDocRef);

  // Data Listeners
  const logsQuery = useMemoFirebase(() => query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(50)), [db]);
  const errorsQuery = useMemoFirebase(() => query(collection(db, "systemErrors"), orderBy("timestamp", "desc"), limit(50)), [db]);
  
  const { data: logs } = useCollection(logsQuery);
  const { data: errors } = useCollection(errorsQuery);

  const stats = useMemo(() => {
    return {
      totalLogs: logs?.length || 0,
      totalErrors: errors?.length || 0,
      healthScore: errors && errors.length > 0 ? Math.max(0, 100 - (errors.length * 5)) : 100
    };
  }, [logs, errors]);

  const handleAction = (action: string) => {
    toast({ title: "System Triggered", description: `Command: ${action} initiated.` });
  };

  if (!mounted || isProfileLoading) return <LoadingScreen mounted={mounted} />;
  
  if (profile?.role !== "Developer" && profile?.role !== "Admin") {
    return <AccessDenied />;
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            
            <header className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                  KERNEL LEVEL ACCESS
                </Badge>
                <div className="flex items-center gap-1.5 text-[9px] text-green-500 font-bold uppercase tracking-widest bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10">
                  <Terminal className="h-3 w-3" /> SYSTEM SECURE: ACTIVE
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2">
                Developer Console
              </h1>
              <p className="text-muted-foreground text-sm">Centralized control center for system data, logs, and infrastructure.</p>
            </header>

            <Tabs defaultValue="engine" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="glass p-1 rounded-full h-12 w-fit mb-8 border-white/10">
                <TabsTrigger value="engine" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Data Engine</TabsTrigger>
                <TabsTrigger value="logs" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Live Logs</TabsTrigger>
                <TabsTrigger value="health" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Data Health</TabsTrigger>
                <TabsTrigger value="control" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Control Panel</TabsTrigger>
              </TabsList>

              <TabsContent value="engine" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-3">
                  <MetricCard title="System Activity" value={stats.totalLogs} sub="Total events" icon={Database} color="text-primary" />
                  <MetricCard title="System Health" value={`${stats.healthScore}%`} sub="Stability rate" icon={CheckCircle2} color="text-green-500" />
                  <MetricCard title="Logged Exceptions" value={stats.totalErrors} sub="Error count" icon={AlertCircle} color="text-destructive" />
                </div>
                <Card className="control-center-card border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <CloudLightning className="h-5 w-5 text-primary" />
                      Live Data Stream
                    </CardTitle>
                    <CardDescription>Real-time observation of incoming ledger data.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {logs && logs.length > 0 ? (
                        logs.slice(0, 5).map((log) => (
                          <div key={log.id} className="p-4 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-between group">
                            <div className="flex items-center gap-4">
                              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                                <Zap className="h-5 w-5" />
                              </div>
                              <div className="min-w-0">
                                <p className="text-sm font-bold truncate">{log.entity} <span className="text-muted-foreground font-normal">({log.action})</span></p>
                                <p className="text-[10px] font-mono text-muted-foreground truncate">{log.entityId}</p>
                              </div>
                            </div>
                            <Badge variant="outline" className="opacity-0 group-hover:opacity-100 ios-transition bg-green-500/10 text-green-500 text-[8px] shrink-0">PROCESSED</Badge>
                          </div>
                        ))
                      ) : (
                        <p className="text-center py-10 text-muted-foreground text-sm italic">Waiting for incoming data packets...</p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="logs" className="space-y-6">
                <div className="grid gap-6 lg:grid-cols-2">
                  <Card className="control-center-card border-white/5">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold flex items-center gap-2">
                        <Activity className="h-5 w-5 text-primary" />
                        Live Activity Feed
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[500px] overflow-y-auto custom-scrollbar">
                      <div className="space-y-4">
                        {logs?.length === 0 ? (
                          <p className="text-center py-20 text-muted-foreground italic text-sm">No activity logs recorded.</p>
                        ) : (
                          logs?.map((log) => (
                            <div key={log.id} className="text-xs border-l-2 border-primary/20 pl-4 py-1 min-w-0">
                              <div className="flex justify-between gap-2 overflow-hidden">
                                <span className="font-bold text-primary truncate">{log.action}</span>
                                <span className="text-muted-foreground opacity-50 shrink-0">{new Date(log.timestamp?.toDate?.() || Date.now()).toLocaleTimeString()}</span>
                              </div>
                              <p className="text-muted-foreground mt-1 truncate">User {log.userId} modified {log.entity}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="control-center-card border-destructive/20 bg-destructive/5">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold flex items-center gap-2 text-destructive">
                        <ShieldAlert className="h-5 w-5" />
                        System Exceptions
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="h-[500px] overflow-y-auto custom-scrollbar">
                      <div className="space-y-4">
                        {errors?.length === 0 ? (
                          <p className="text-center py-20 text-muted-foreground italic text-sm">No critical exceptions detected.</p>
                        ) : (
                          errors?.map((err) => (
                            <div key={err.id} className="p-4 rounded-2xl bg-destructive/10 border border-destructive/20 min-w-0">
                              <div className="flex justify-between items-start mb-2 gap-2 overflow-hidden">
                                <Badge variant="destructive" className="text-[8px] tracking-widest shrink-0">{err.severity}</Badge>
                                <span className="text-[10px] font-mono text-muted-foreground truncate">{err.timestamp}</span>
                              </div>
                              <p className="text-sm font-bold text-destructive truncate">{err.message}</p>
                              <p className="text-[10px] text-muted-foreground mt-1 font-mono truncate">SOURCE: {err.source}</p>
                            </div>
                          ))
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              <TabsContent value="health" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-4">
                  <HealthCard label="Health Score" value={stats.healthScore} unit="%" icon={HeartPulse} color="text-green-500" />
                  <HealthCard label="Errors Found" value={stats.totalErrors} unit="ERR" icon={ShieldAlert} color="text-destructive" />
                  <HealthCard label="Live Packets" value={stats.totalLogs} unit="LOG" icon={AlertCircle} color="text-orange-500" />
                  <HealthCard label="Sync Cycles" value="1" unit="CYC" icon={RefreshCcw} color="text-primary" />
                </div>
                
                <Card className="control-center-card border-white/5">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <HardHat className="h-5 w-5 text-primary" />
                      Infrastructure Monitoring
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Audit Depth</p>
                        <p className="text-2xl font-bold truncate">{stats.totalLogs} <span className="text-xs font-normal text-muted-foreground">records</span></p>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">System Latency</p>
                        <p className="text-2xl font-bold truncate">0.8 <span className="text-xs font-normal text-muted-foreground">ms</span></p>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Active Streams</p>
                        <p className="text-2xl font-bold truncate">2 <span className="text-xs font-normal text-muted-foreground">listeners</span></p>
                      </div>
                      <div className="space-y-1 min-w-0">
                        <p className="text-[10px] uppercase font-bold text-muted-foreground truncate">Role Integrity</p>
                        <p className="text-2xl font-bold truncate">Verified</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="control" className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <Card className="control-center-card border-white/5">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Operation Center</CardTitle>
                      <CardDescription>Trigger global system events and synchronization.</CardDescription>
                    </CardHeader>
                    <CardContent className="grid grid-cols-2 gap-4">
                      <ControlButton icon={RefreshCcw} label="Global Sync" onClick={() => handleAction("Global Sync")} />
                      <ControlButton icon={Zap} label="Data Refresh" onClick={() => handleAction("Data Refresh")} />
                      <ControlButton icon={FileJson} label="JSON Backup" onClick={() => handleAction("JSON Backup")} />
                      <ControlButton icon={Trash2} label="Purge Cache" onClick={() => handleAction("Purge Cache")} variant="destructive" />
                    </CardContent>
                  </Card>

                  <Card className="control-center-card border-white/5">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold">Security & Logs</CardTitle>
                      <CardDescription>Advanced auditing and log management.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex justify-between items-center gap-4 min-w-0">
                        <div className="min-w-0">
                          <p className="text-sm font-bold truncate">Developer Auditing</p>
                          <p className="text-[10px] text-muted-foreground truncate">Log all Dev Console actions to Kernel.</p>
                        </div>
                        <Badge className="bg-green-500 text-black shrink-0">ACTIVE</Badge>
                      </div>
                      <Button variant="outline" className="w-full rounded-2xl border-destructive/20 text-destructive hover:bg-destructive/10 truncate">
                        Clear Audit Trail (Restricted)
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>
            </Tabs>
            
            <p className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30 pb-12">
              NALAKATH HOLDINGS • DEV KERNEL V4.2.1
            </p>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function MetricCard({ title, value, sub, icon: Icon, color }: any) {
  return (
    <Card className="control-center-card border-white/5 group min-w-0">
      <div className="flex flex-col gap-1 relative overflow-hidden">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 truncate">{title}</p>
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className={cn("text-3xl font-bold font-mono tracking-tighter truncate", color)} title={String(value)}>
            {value}
          </div>
          <div className="h-10 w-10 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-primary/10 group-hover:text-primary ios-transition shrink-0">
            <Icon className="h-5 w-5" />
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground mt-4 font-medium uppercase tracking-widest opacity-60 truncate">{sub}</p>
      </div>
    </Card>
  );
}

function HealthCard({ label, value, unit, icon: Icon, color }: any) {
  return (
    <div className="p-6 rounded-[2rem] glass border border-white/5 flex flex-col gap-4 min-w-0">
      <div className={cn("p-3 rounded-2xl bg-white/5 w-fit", color)}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest truncate">{label}</p>
        <p className="text-2xl font-black font-mono mt-1 truncate">{value} <span className="text-xs font-normal opacity-40">{unit}</span></p>
      </div>
    </div>
  );
}

function ControlButton({ icon: Icon, label, onClick, variant = "default" }: any) {
  return (
    <Button 
      onClick={onClick}
      variant="ghost" 
      className={cn(
        "h-24 rounded-[2rem] glass flex flex-col gap-2 border border-white/5 hover:border-white/10 ios-transition min-w-0 overflow-hidden",
        variant === "destructive" ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-primary/10 hover:text-primary"
      )}
    >
      <Icon className="h-6 w-6 shrink-0" />
      <span className="text-[10px] font-bold uppercase tracking-widest truncate w-full px-2">{label}</span>
    </Button>
  );
}

function LoadingScreen({ mounted }: { mounted: boolean }) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black">
      <div className="flex flex-col items-center gap-4">
        {mounted ? (
          <>
            <div className="h-16 w-16 rounded-full gold-gradient animate-pulse shadow-lg shadow-primary/20" />
            <p className="text-primary font-mono text-xs uppercase tracking-[0.3em] animate-pulse">Initializing Kernel...</p>
          </>
        ) : (
          <div className="h-16 w-16" />
        )}
      </div>
    </div>
  );
}

function AccessDenied() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-6">
      <Card className="glass border-destructive/20 max-w-md w-full rounded-[3rem] p-12 text-center">
        <ShieldAlert className="h-20 w-20 text-destructive mx-auto mb-6" />
        <h2 className="text-2xl font-bold mb-2">Access Unauthorized</h2>
        <p className="text-muted-foreground text-sm leading-relaxed">
          This environment is restricted to the Developer role. Your attempt has been logged and reported to the system overseer.
        </p>
        <Button className="mt-8 rounded-full px-8 truncate" asChild>
          <a href="/">Return to Dashboard</a>
        </Button>
      </Card>
    </div>
  );
}
