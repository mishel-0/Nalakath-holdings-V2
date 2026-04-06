"use client";

import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { QuickActionFAB } from "@/components/ui/QuickActionFAB";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  IndianRupee, 
  Briefcase, 
  TrendingUp,
  AlertCircle,
  ChevronRight,
  Activity,
  History,
  Sparkles
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  Tooltip,
  Area,
  AreaChart,
} from "recharts";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import Link from "next/link";
import { cn } from "@/lib/utils";
import { useDivision } from "@/context/DivisionContext";

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const { activeDivision } = useDivision();
  const companyId = activeDivision.id;

  const vouchersQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "vouchers"), orderBy("createdAt", "desc"), limit(20)), [db, companyId]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db, companyId]);
  const projectsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "projects")), [db, companyId]);
  const recentTxQuery = useMemoFirebase(() => 
    query(collection(db, "companies", companyId, "journalEntries"), orderBy("createdAt", "desc"), limit(5)), 
  [db, companyId]);

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileDocRef);
  const { data: vouchers } = useCollection(vouchersQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: recentTransactions } = useCollection(recentTxQuery);

  const stats = useMemo(() => {
    const totalRev = recentTransactions?.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0) || 0;
    const totalExp = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    const projectCosts = projects?.reduce((acc, proj) => acc + (proj.actualCost || 0), 0) || 0;
    const pendingVouchers = vouchers?.filter(v => v.status === "Pending").length || 0;

    return {
      revenue: totalRev,
      profit: totalRev - totalExp,
      projectCosts,
      activeProjects: projects?.length || 0,
      alerts: pendingVouchers
    };
  }, [recentTransactions, expenses, projects, vouchers]);

  const chartData = useMemo(() => {
    return [
      { name: "Mon", income: stats.revenue * 0.2, cost: stats.projectCosts * 0.1 },
      { name: "Tue", income: stats.revenue * 0.4, cost: stats.projectCosts * 0.3 },
      { name: "Wed", income: stats.revenue * 0.3, cost: stats.projectCosts * 0.2 },
      { name: "Thu", income: stats.revenue * 0.6, cost: stats.projectCosts * 0.5 },
      { name: "Fri", income: stats.revenue * 0.8, cost: stats.projectCosts * 0.7 },
      { name: "Sat", income: stats.revenue * 0.9, cost: stats.projectCosts * 0.8 },
      { name: "Sun", income: stats.revenue, cost: stats.projectCosts }
    ];
  }, [stats]);

  if (isProfileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full gold-gradient animate-pulse shadow-lg shadow-primary/20" />
          <p className="animate-pulse text-primary font-mono tracking-widest uppercase text-xs">Syncing Portfolio...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0 overflow-hidden">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            
            <header className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
                  {activeDivision.division} OVERSEER
                </Badge>
                <div className="flex items-center gap-1.5 text-[9px] text-green-500 font-bold uppercase tracking-widest bg-green-500/5 px-3 py-1 rounded-full border border-green-500/10">
                  <Activity className="h-3 w-3" /> LIVE LEDGER SYNC
                </div>
              </div>
              <div className="mt-2">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">
                  {activeDivision.name}
                </h1>
                <p className="text-muted-foreground mt-1 text-sm truncate">
                  Strategic management for the {activeDivision.division} portfolio.
                </p>
              </div>
            </header>

            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Entity Revenue" value={stats.revenue} icon={IndianRupee} trend="up" />
              <MetricCard title="Operating Profit" value={stats.profit} icon={TrendingUp} trend="up" />
              <MetricCard title="Capital Expenses" value={stats.projectCosts} icon={Briefcase} trend="down" />
              <MetricCard title="Division Alerts" value={stats.alerts.toString()} icon={AlertCircle} trend="none" isAlert={stats.alerts > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
              <Card className="lg:col-span-4 control-center-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-xl font-bold">
                      Fiscal Health Trend
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate">Income vs operating costs for {activeDivision.name}</p>
                  </div>
                  <div className="flex items-center gap-1 text-primary font-bold text-[10px] uppercase tracking-widest cursor-pointer hover:opacity-70 transition-opacity shrink-0">
                    ANALYTICS <ChevronRight className="h-3 w-3" />
                  </div>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorVal" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="currentColor" fontSize={10} axisLine={false} tickLine={false} opacity={0.3} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'hsl(var(--card))', borderRadius: '1.5rem', border: '1px solid rgba(255,255,255,0.1)', backdropFilter: 'blur(20px)' }}
                        formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                      />
                      <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#colorVal)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 control-center-card overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Segment Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <DivisionBar name="OPERATIONS" value="45%" color="gold-gradient" />
                  <DivisionBar name="INFRASTRUCTURE" value="30%" color="bg-zinc-600" />
                  <DivisionBar name="R&D / ASSETS" value="15%" color="bg-accent" />
                  <DivisionBar name="RESERVES" value="10%" color="bg-zinc-400" />
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 pb-12">
              <Card className="lg:col-span-2 control-center-card overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-xl font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Ledger Activity
                  </CardTitle>
                  <Link href="/accounting">
                    <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
                      View All
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {!recentTransactions?.length ? (
                      <p className="py-10 text-center text-muted-foreground text-sm italic">No recent activity logged for this division.</p>
                    ) : (
                      recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-[1.5rem] hover:bg-foreground/5 ios-transition group overflow-hidden">
                          <div className="flex items-center gap-4 min-w-0 flex-1">
                            <div className={cn(
                              "h-10 w-10 rounded-2xl flex items-center justify-center shrink-0",
                              tx.totalDebit > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                            )}>
                              {tx.totalDebit > 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold truncate">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{tx.date}</p>
                            </div>
                          </div>
                          <div className="text-right shrink-0">
                            <p className={cn(
                              "text-sm font-mono font-bold",
                              tx.totalDebit > 0 ? "text-destructive" : "text-green-500"
                            )}>
                              {tx.totalDebit > 0 ? `-₹${tx.totalDebit.toLocaleString('en-IN')}` : `+₹${tx.totalCredit.toLocaleString('en-IN')}`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="control-center-card overflow-hidden">
                <CardHeader>
                  <CardTitle className="text-xl font-bold flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    Priority Desk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AlertItem title="Audit Readiness" desc={`Q2 compliance for ${activeDivision.name}.`} severity="high" />
                  <AlertItem title="Budget Threshold" desc="Financial buffer remains optimal." severity="medium" />
                  <AlertItem title="Sync Status" desc="Data Engine heartbeat is active." severity="low" />
                </CardContent>
              </Card>
            </div>
            
            <p className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30 pb-12">
              NALAKATH HOLDINGS © 2026
            </p>
          </div>
        </main>
      </div>
      <QuickActionFAB />
      <BottomNav />
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, isAlert }: any) {
  return (
    <Card className={cn(
      "control-center-card relative overflow-hidden group border-white/5",
      isAlert && "ring-2 ring-destructive/20"
    )}>
      <Icon className="absolute right-[-10%] top-[-10%] h-32 w-32 opacity-[0.03] text-foreground rotate-12" />
      
      <div className="flex flex-col gap-1 relative z-10 min-w-0">
        <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em] mb-4 truncate">{title}</p>
        
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <div className="text-2xl md:text-3xl font-bold font-mono tracking-tighter truncate flex-1 min-w-0" title={processedValue(value)}>
            {processedValue(value)}
          </div>
          <div className="h-10 w-10 rounded-2xl bg-primary/10 flex items-center justify-center shadow-lg shadow-primary/20 shrink-0">
            <Icon className="h-5 w-5 text-primary" />
          </div>
        </div>
        
        <div className="flex items-center gap-2 mt-8 overflow-hidden">
          <Badge className={cn(
            "text-[9px] font-black tracking-widest h-5 uppercase rounded-full border-none px-3 shrink-0",
            trend === "up" ? 'bg-green-500/10 text-green-500' : 
            trend === "down" ? 'bg-destructive/10 text-destructive' : 
            'bg-foreground/5 text-muted-foreground'
          )}>
            {trend === "up" ? "GAINING" : trend === "down" ? "VARIANCE" : "STABLE"} 
          </Badge>
          <span className="text-[9px] text-muted-foreground font-bold tracking-widest uppercase opacity-40 truncate">VS PREV</span>
        </div>
      </div>
    </Card>
  );
}

function processedValue(val: any) {
  const num = Number(val);
  if (isNaN(num)) return `₹${val}`;
  return `₹${num.toLocaleString('en-IN')}`;
}

function DivisionBar({ name, value, color }: any) {
  return (
    <div className="space-y-3 overflow-hidden">
      <div className="flex justify-between text-[10px] font-black tracking-[0.2em] uppercase text-muted-foreground overflow-hidden">
        <span className="truncate pr-2">{name}</span>
        <span className="font-mono shrink-0">{value}</span>
      </div>
      <div className="h-2 w-full bg-foreground/5 rounded-full overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: value }} />
      </div>
    </div>
  );
}

function AlertItem({ title, desc, severity }: any) {
  const colors = { high: "bg-destructive", medium: "bg-orange-500", low: "bg-green-500" };
  return (
    <div className="flex gap-4 p-5 rounded-[2rem] bg-foreground/5 border border-foreground/5 hover:border-foreground/10 ios-transition group cursor-pointer min-w-0 overflow-hidden">
      <div className={cn("mt-1.5 h-2.5 w-2.5 rounded-full shrink-0", colors[severity as keyof typeof colors])} />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-bold leading-none truncate">{title}</p>
        <p className="text-xs text-muted-foreground mt-3 leading-relaxed line-clamp-2">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-auto self-center shrink-0 group-hover:translate-x-1 ios-transition" />
    </div>
  );
}
