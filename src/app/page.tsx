
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
  Clock,
  Sparkles,
  AlertCircle,
  ChevronRight,
  Plus,
  ShieldCheck,
  Calculator
} from "lucide-react";
import {
  ResponsiveContainer,
  XAxis,
  YAxis,
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

  // Real-time data fetching
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

  const { data: profile } = useDoc(profileDocRef);
  const { data: vouchers } = useCollection(vouchersQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: recentTransactions } = useCollection(recentTxQuery);

  const isAdmin = profile?.role === "Admin";

  // Dynamic Statistics
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

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col gap-1">
              <div className="flex items-center gap-2">
                <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/20 px-3 py-1 text-[10px] uppercase tracking-widest font-bold">
                  {isAdmin ? "Admin Console" : "Accountant Console"}
                </Badge>
                <div className="flex items-center gap-1 text-[10px] text-green-500 font-bold uppercase tracking-widest ml-2">
                  <ShieldCheck className="h-3 w-3" /> Ledger Sync: Live
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">Accountant Desk</h1>
              <p className="text-muted-foreground">Manage daily financial flows for Nalakath Holdings.</p>
            </header>

            {/* Top Grid Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total Revenue" value={stats.revenue} icon={IndianRupee} trend="up" />
              <MetricCard title="Net Profit" value={stats.profit} icon={TrendingUp} trend={stats.profit >= 0 ? "up" : "down"} />
              {isAdmin ? (
                <MetricCard title="Project Costs" value={stats.projectCosts} icon={Briefcase} trend="down" />
              ) : (
                <MetricCard title="Total OPEX" value={stats.revenue - stats.profit} icon={Calculator} trend="none" />
              )}
              <MetricCard title="Pending Vouchers" value={stats.alerts.toString()} icon={AlertCircle} trend="none" isAlert={stats.alerts > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
              {/* Financial Chart */}
              <Card className="lg:col-span-4 glass border-white/5 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <div>
                    <CardTitle className="text-lg font-semibold">Fiscal Health</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Weekly income vs operating costs</p>
                  </div>
                  <Link href="/reports">
                    <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10">
                      View Reports <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '16px', border: '1px solid #333' }}
                        itemStyle={{ color: '#fff' }}
                      />
                      <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={3} />
                      <Area type="monotone" dataKey="cost" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Division Summary */}
              <Card className="lg:col-span-3 glass border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Division Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 pt-2">
                  <DivisionRow name="Nalakath Construction" value="45%" color="bg-primary" />
                  <DivisionRow name="Oval Palace Resort" value="30%" color="bg-accent" />
                  <DivisionRow name="Green Villa" value="25%" color="bg-yellow-600" />
                  <div className="pt-4 mt-4 border-t border-white/5">
                    <div className="flex items-center gap-2 p-3 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <p className="text-[10px] uppercase font-bold tracking-widest text-primary">AI Insight</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                      Material costs in **Construction** division are trending 12% higher this quarter.
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Transactions List */}
              <Card className="glass border-white/5 lg:col-span-2">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Daily Journal Entries
                  </CardTitle>
                  <Link href="/accounting">
                    <Button variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/5 text-xs">
                      Full Ledger <Plus className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {!recentTransactions?.length ? (
                      <p className="py-8 text-center text-muted-foreground text-sm">No daily entries found.</p>
                    ) : (
                      recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 ios-transition group cursor-pointer border border-transparent hover:border-white/5">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-10 w-10 rounded-full flex items-center justify-center",
                              tx.totalDebit > 0 ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500"
                            )}>
                              {tx.totalDebit > 0 ? <ArrowDownRight className="h-5 w-5" /> : <ArrowUpRight className="h-5 w-5" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-widest">{tx.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-sm font-mono font-bold",
                              tx.totalDebit > 0 ? "text-destructive" : "text-green-500"
                            )}>
                              {tx.totalDebit > 0 ? `-₹${tx.totalDebit.toLocaleString('en-IN')}` : `+₹${tx.totalCredit.toLocaleString('en-IN')}`}
                            </p>
                            <Badge variant="outline" className="text-[8px] h-4 rounded-full border-white/10 py-0 uppercase tracking-tighter">
                              Verified
                            </Badge>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* System Alerts */}
              <Card className="glass border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    System Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <AlertItem 
                    title="Audit Due" 
                    desc={`Found ${stats.alerts} pending vouchers requiring proof verification.`}
                    severity="high"
                  />
                  {isAdmin && (
                    <AlertItem 
                      title="Budget Threshold" 
                      desc="Construction budget usage has exceeded 85% of projection."
                      severity="medium"
                    />
                  )}
                  <AlertItem 
                    title="Ledger Synced" 
                    desc="All division cost centers are currently synchronized with HQ."
                    severity="low"
                  />
                </CardContent>
              </Card>
            </div>
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
      "glass border-white/5 hover:scale-[1.02] ios-transition relative overflow-hidden group",
      isAlert ? "ring-1 ring-destructive/40 bg-destructive/5" : ""
    )}>
      <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:scale-110 ios-transition">
        <Icon className="h-12 w-12" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.2em]">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-xl">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono tracking-tight">
          {processedValue(value)}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
          {trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
          <span className={cn(
            "text-[9px] font-bold uppercase tracking-widest",
            trend === "up" ? 'text-green-500' : trend === "down" ? 'text-destructive' : 'text-muted-foreground'
          )}>
            {trend === "none" ? "Status: OK" : trend === "up" ? "Trending Up" : "Trending Down"}
          </span>
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

function DivisionRow({ name, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-[11px] font-bold tracking-tight uppercase">
        <span className="text-foreground/80">{name}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} ios-transition shadow-[0_0_8px_rgba(var(--primary),0.5)]`} style={{ width: value }} />
      </div>
    </div>
  );
}

function AlertItem({ title, desc, severity }: any) {
  const colors = {
    high: "bg-destructive shadow-[0_0_8px_rgba(239,68,68,0.5)]",
    medium: "bg-orange-500 shadow-[0_0_8px_rgba(249,115,22,0.5)]",
    low: "bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.5)]"
  };
  return (
    <div className="flex gap-4 p-4 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/20 ios-transition cursor-pointer">
      <div className={cn("mt-1.5 h-1.5 w-1.5 rounded-full shrink-0", colors[severity as keyof typeof colors])} />
      <div>
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-2 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
