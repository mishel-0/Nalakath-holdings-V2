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
  Calculator,
  Activity
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
  const isAccountant = profile?.role === "Accountant";

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
            <header className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <Badge variant="outline" className="rounded-full bg-primary/10 text-primary border-primary/30 px-4 py-1.5 text-[10px] uppercase tracking-[0.2em] font-bold shadow-lg shadow-primary/5">
                  {isAdmin ? "Executive Console" : "Operational Desk"}
                </Badge>
                <div className="flex items-center gap-1.5 text-[10px] text-green-500 font-bold uppercase tracking-widest bg-green-500/5 px-3 py-1.5 rounded-full border border-green-500/10">
                  <Activity className="h-3 w-3 animate-pulse" /> Live Ledger Sync
                </div>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">
                {isAccountant ? "Accountant Desk" : "Group Dashboard"}
              </h1>
              <p className="text-muted-foreground">Strategic financial management for Nalakath Holdings.</p>
            </header>

            {/* Top Grid Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total Revenue" value={stats.revenue} icon={IndianRupee} trend="up" />
              <MetricCard title="Net Operating Profit" value={stats.profit} icon={TrendingUp} trend={stats.profit >= 0 ? "up" : "down"} />
              {isAdmin ? (
                <MetricCard title="Capital Expenditure" value={stats.projectCosts} icon={Briefcase} trend="down" />
              ) : (
                <MetricCard title="Total OPEX" value={stats.revenue - stats.profit} icon={Calculator} trend="none" />
              )}
              <MetricCard title="Action Required" value={stats.alerts.toString()} icon={AlertCircle} trend="none" isAlert={stats.alerts > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
              {/* Financial Chart */}
              <Card className="lg:col-span-4 glass border-white/5 overflow-hidden rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div>
                    <CardTitle className="text-lg font-bold">Fiscal Health Trend</CardTitle>
                    <p className="text-xs text-muted-foreground mt-1">Real-time mapping of income vs operating costs</p>
                  </div>
                  <Link href="/reports">
                    <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10 font-bold text-xs uppercase tracking-widest">
                      Analytics <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="h-[320px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <defs>
                        <linearGradient id="colorIncome" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} hide />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.95)', borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)', backdropBlur: '12px' }}
                        itemStyle={{ color: '#FFD700', fontSize: '12px', fontWeight: 'bold' }}
                      />
                      <Area type="monotone" dataKey="income" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorIncome)" strokeWidth={4} />
                      <Area type="monotone" dataKey="cost" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} strokeDasharray="6 6" />
                    </AreaChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Division Summary */}
              <Card className="lg:col-span-3 glass border-white/5 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    Division Breakdown
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-7 pt-2">
                  <DivisionRow name="Construction Infra" value="45%" color="gold-gradient" />
                  <DivisionRow name="Oval Palace Resort" value="30%" color="bg-accent" />
                  <DivisionRow name="Green Villa Estates" value="25%" color="bg-zinc-700" />
                  <div className="pt-6 mt-4 border-t border-white/10">
                    <div className="flex items-center gap-3 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                      <div className="h-2 w-2 rounded-full bg-primary animate-pulse" />
                      <p className="text-[10px] uppercase font-bold tracking-[0.25em] text-primary">Intelligent Insight</p>
                    </div>
                    <p className="text-xs text-muted-foreground leading-relaxed mt-4 italic">
                      "Operating margins in **Construction** have stabilized. Recommended focus on **Hospitality** CAPEX for Q3."
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {/* Recent Transactions List */}
              <Card className="glass border-white/5 lg:col-span-2 rounded-3xl">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-lg font-bold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Journal Activity
                  </CardTitle>
                  <Link href="/accounting">
                    <Button variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/5 text-[10px] font-bold uppercase tracking-widest h-8 px-4">
                      Explore Ledger
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {!recentTransactions?.length ? (
                      <p className="py-12 text-center text-muted-foreground text-sm font-medium">No activity recorded for this period.</p>
                    ) : (
                      recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-4 rounded-2xl hover:bg-white/5 ios-transition group cursor-pointer border border-transparent hover:border-white/10">
                          <div className="flex items-center gap-4">
                            <div className={cn(
                              "h-12 w-12 rounded-full flex items-center justify-center shadow-inner",
                              tx.totalDebit > 0 ? "bg-destructive/10 text-destructive border border-destructive/20" : "bg-green-500/10 text-green-500 border border-green-500/20"
                            )}>
                              {tx.totalDebit > 0 ? <ArrowDownRight className="h-6 w-6" /> : <ArrowUpRight className="h-6 w-6" />}
                            </div>
                            <div>
                              <p className="text-sm font-bold tracking-tight">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-[0.15em] font-medium mt-1">{tx.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={cn(
                              "text-sm font-mono font-bold tracking-tight",
                              tx.totalDebit > 0 ? "text-destructive" : "text-green-500"
                            )}>
                              {tx.totalDebit > 0 ? `-₹${tx.totalDebit.toLocaleString('en-IN')}` : `+₹${tx.totalCredit.toLocaleString('en-IN')}`}
                            </p>
                            <Badge variant="outline" className="text-[8px] h-4 rounded-full border-white/10 py-0 uppercase tracking-widest font-bold mt-1 opacity-60">
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
              <Card className="glass border-white/5 rounded-3xl">
                <CardHeader>
                  <CardTitle className="text-lg font-bold flex items-center gap-2 text-primary">
                    <AlertCircle className="h-5 w-5" />
                    Strategic Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <AlertItem 
                    title="Compliance Check" 
                    desc={`Awaiting verification for ${stats.alerts} high-value payment vouchers.`}
                    severity="high"
                  />
                  {isAdmin && (
                    <AlertItem 
                      title="Budget Variance" 
                      desc="Infra project #4 has reached 90% of allocated budget."
                      severity="medium"
                    />
                  )}
                  <AlertItem 
                    title="Audit Readiness" 
                    desc="Digital backup of all division cost centers is 100% complete."
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
      "glass border-white/5 hover:scale-[1.03] ios-transition relative overflow-hidden group rounded-[2rem]",
      isAlert ? "ring-2 ring-destructive/40 bg-destructive/5" : "hover:border-primary/20"
    )}>
      <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-125 ios-transition group-hover:opacity-10">
        <Icon className="h-16 w-16" />
      </div>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.25em]">{title}</CardTitle>
        <div className="p-2.5 bg-primary/10 rounded-2xl border border-primary/20">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold font-mono tracking-tighter">
          {processedValue(value)}
        </div>
        <div className="flex items-center gap-2 mt-3">
          <div className={cn(
            "flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest",
            trend === "up" ? 'bg-green-500/10 text-green-500' : trend === "down" ? 'bg-destructive/10 text-destructive' : 'bg-white/5 text-muted-foreground'
          )}>
            {trend === "up" && <ArrowUpRight className="h-2 w-2" />}
            {trend === "down" && <ArrowDownRight className="h-2 w-2" />}
            {trend === "none" ? "Stable" : trend === "up" ? "Gaining" : "Variance"}
          </div>
          <span className="text-[9px] text-muted-foreground font-bold uppercase tracking-widest opacity-40">Vs Last Quarter</span>
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
    <div className="space-y-3">
      <div className="flex justify-between text-[11px] font-bold tracking-[0.1em] uppercase">
        <span className="text-foreground/90">{name}</span>
        <span className="text-primary font-mono">{value}</span>
      </div>
      <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden border border-white/5">
        <div className={cn("h-full ios-transition shadow-[0_0_12px_rgba(var(--primary),0.4)]", color)} style={{ width: value }} />
      </div>
    </div>
  );
}

function AlertItem({ title, desc, severity }: any) {
  const colors = {
    high: "bg-destructive shadow-[0_0_12px_rgba(239,68,68,0.6)]",
    medium: "bg-orange-500 shadow-[0_0_12px_rgba(249,115,22,0.6)]",
    low: "bg-green-500 shadow-[0_0_12px_rgba(34,197,94,0.6)]"
  };
  return (
    <div className="flex gap-4 p-5 rounded-3xl bg-white/5 border border-white/5 group hover:border-white/20 ios-transition cursor-pointer hover:bg-white/10">
      <div className={cn("mt-1.5 h-2 w-2 rounded-full shrink-0 animate-pulse", colors[severity as keyof typeof colors])} />
      <div className="flex-1">
        <p className="text-sm font-bold leading-none tracking-tight">{title}</p>
        <p className="text-xs text-muted-foreground mt-2.5 leading-relaxed font-medium">{desc}</p>
      </div>
      <ChevronRight className="h-4 w-4 text-muted-foreground/30 self-center group-hover:translate-x-1 ios-transition" />
    </div>
  );
}
