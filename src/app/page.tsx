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

export default function Dashboard() {
  const db = useFirestore();
  const { user } = useUser();
  const companyId = "nalakath-holdings-main";

  const vouchersQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "vouchers"), orderBy("createdAt", "desc"), limit(20)), [db]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db]);
  const projectsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "projects")), [db]);
  const recentTxQuery = useMemoFirebase(() => 
    query(collection(db, "companies", companyId, "journalEntries"), orderBy("createdAt", "desc"), limit(5)), 
  [db]);

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileDocRef);
  const { data: vouchers } = useCollection(vouchersQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: recentTransactions } = useCollection(recentTxQuery);

  const isAdmin = profile?.role === "Admin";

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
          <div className="h-16 w-16 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-primary/20 animate-pulse">
            <span className="text-black font-black text-3xl">N</span>
          </div>
          <p className="animate-pulse text-primary font-mono tracking-widest uppercase text-xs">Syncing Apex Data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto animate-in fade-in duration-700">
            
            <header className="flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full gold-gradient flex items-center justify-center shadow-lg shadow-primary/20">
                  <span className="text-black font-black text-2xl">N</span>
                </div>
                <div className="flex flex-col gap-1">
                  <Badge variant="outline" className={cn(
                    "rounded-full px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg w-fit",
                    isAdmin ? "bg-primary/10 text-primary border-primary/30" : "bg-blue-500/10 text-blue-400 border-blue-400/30"
                  )}>
                    {isAdmin ? "Executive Strategy Console" : "Operational Accounting Desk"}
                  </Badge>
                  <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/10 w-fit">
                    <Activity className="h-3 w-3 animate-pulse" /> Live Ledger Sync
                  </div>
                </div>
              </div>
              <div className="mt-2">
                <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">
                  Group Dashboard
                </h1>
                <p className="text-muted-foreground">
                  Strategic financial management for the Apex portfolio.
                </p>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total Revenue" value={stats.revenue} icon={IndianRupee} trend="up" />
              <MetricCard title="Net Operating Profit" value={stats.profit} icon={TrendingUp} trend={stats.profit >= 0 ? "up" : "down"} />
              <MetricCard title="Capital Expenditure" value={stats.projectCosts} icon={Briefcase} trend="down" />
              <MetricCard title="Action Required" value={stats.alerts.toString()} icon={AlertCircle} trend="none" isAlert={stats.alerts > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
              <Card className="lg:col-span-4 glass border-white/5 overflow-hidden rounded-[2rem]">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-bold">
                      Fiscal Health Trend
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Real-time mapping of group income vs costs</p>
                  </div>
                  <Button variant="ghost" size="sm" className="text-primary text-[10px] font-bold uppercase tracking-widest">
                    Analytics <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
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
                      <XAxis dataKey="name" stroke="#333" fontSize={10} axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', borderRadius: '15px', border: '1px solid rgba(255,255,255,0.1)' }}
                        formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                      />
                      <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fill="url(#colorVal)" strokeWidth={3} />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 glass border-white/5 rounded-[2rem] overflow-hidden border-primary/10">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Apex Portfolio Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <DivisionBar name="Construction Infra" value="42%" color="gold-gradient" />
                  <DivisionBar name="Hospitality Hub" value="38%" color="bg-accent" />
                  <DivisionBar name="Estate Portfolio" value="20%" color="bg-zinc-600" />
                  <div className="pt-4 border-t border-white/5">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-primary mb-2">System AI Insight</p>
                    <p className="text-xs text-muted-foreground italic leading-relaxed">
                      "Consolidated performance is meeting quarterly targets. Apex construction variance is within tolerance."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card className="glass border-white/5 lg:col-span-2 rounded-[2rem]">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <History className="h-5 w-5 text-primary" />
                    Latest Ledger Activity
                  </CardTitle>
                  <Link href="/accounting">
                    <Button variant="ghost" size="sm" className="rounded-full text-[10px] font-bold uppercase tracking-widest text-primary">
                      Full History
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {!recentTransactions?.length ? (
                      <p className="py-10 text-center text-muted-foreground text-sm">No recent transactions recorded.</p>
                    ) : (
                      recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 ios-transition group border border-transparent hover:border-white/10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              tx.totalDebit > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                            )}>
                              {tx.totalDebit > 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground font-mono">{tx.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
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

              <Card className="glass border-white/5 rounded-[2rem]">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    Apex Priority Desk
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <AlertItem title="Audit Readiness" desc="Q2 compliance docs are due for upload." severity="high" />
                  <AlertItem title="Budget Threshold" desc="Site Phase 3 has reached 80% buffer." severity="medium" />
                  <AlertItem title="System Integrity" desc="Auto-reconciliation complete. No errors." severity="low" />
                </CardContent>
              </Card>
            </div>
            
            <p className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30 pb-8">
              APEX LEDGER © 2026
            </p>
          </div>
        </main>
      </div>
      <QuickActionFAB />
      <BottomNav />
    </div>
  );
}

function MetricCard({ title, value, icon: Icon, trend, color, isAlert }: any) {
  return (
    <Card className={cn(
      "glass border-white/5 ios-transition relative overflow-hidden group rounded-3xl",
      isAlert ? "ring-2 ring-destructive/30 bg-destructive/5" : "hover:border-white/20"
    )}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</CardTitle>
        <div className="p-2 bg-white/5 rounded-xl border border-white/10 group-hover:bg-primary/20 group-hover:border-primary/30 ios-transition">
          <Icon className={cn("h-4 w-4 text-muted-foreground", color)} />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tighter">
          {processedValue(value)}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <Badge variant="outline" className={cn(
            "text-[8px] font-bold tracking-widest h-5 uppercase rounded-full border-none",
            trend === "up" ? 'bg-green-500/10 text-green-500' : trend === "down" ? 'bg-destructive/10 text-destructive' : 'bg-white/5 text-muted-foreground'
          )}>
            {trend === "up" ? "Gaining" : trend === "down" ? "Variance" : "Stable"} {trend === "none" ? "" : "vs last quarter"}
          </Badge>
        </div>
      </CardContent>
    </Card>
  );
}

function processedValue(val: any) {
  const num = Number(val);
  if (isNaN(num)) return val;
  return `₹${num.toLocaleString('en-IN')}`;
}

function DivisionBar({ name, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[10px] font-bold tracking-widest uppercase text-muted-foreground">
        <span>{name}</span>
        <span className="text-white font-mono">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={cn("h-full", color)} style={{ width: value }} />
      </div>
    </div>
  );
}

function AlertItem({ title, desc, severity }: any) {
  const colors = { high: "bg-destructive", medium: "bg-orange-500", low: "bg-green-500" };
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/10 hover:border-white/20 ios-transition group cursor-pointer">
      <div className={cn("mt-1.5 h-2 w-2 rounded-full", colors[severity as keyof typeof colors])} />
      <div>
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 ml-auto self-center group-hover:translate-x-1 ios-transition" />
    </div>
  );
}
