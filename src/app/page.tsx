"use client";

import { useMemo, useState } from "react";
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
  Plus
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
} from "recharts";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import Link from "next/link";

export default function Dashboard() {
  const db = useFirestore();
  const companyId = "nalakath-holdings-main";

  // Real-time data fetching
  const vouchersQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "vouchers"), orderBy("createdAt", "desc"), limit(20)), [db]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db]);
  const projectsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "projects")), [db]);
  const recentTxQuery = useMemoFirebase(() => 
    query(collection(db, "companies", companyId, "journalEntries"), orderBy("createdAt", "desc"), limit(5)), 
  [db]);

  const { data: vouchers } = useCollection(vouchersQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: recentTransactions } = useCollection(recentTxQuery);

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
      { name: "Current", revenue: stats.revenue, expenses: stats.revenue - stats.profit }
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
                  Group HQ Active
                </Badge>
              </div>
              <h1 className="text-4xl font-bold tracking-tight text-foreground font-headline">Accountant Desk</h1>
              <p className="text-muted-foreground">Manage daily financial flows for Nalakath Holdings.</p>
            </header>

            {/* Top Grid Metrics */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <MetricCard title="Total Revenue" value={stats.revenue} icon={IndianRupee} trend="up" />
              <MetricCard title="Net Profit" value={stats.profit} icon={TrendingUp} trend={stats.profit >= 0 ? "up" : "down"} />
              <MetricCard title="Project Costs" value={stats.projectCosts} icon={Briefcase} trend="down" />
              <MetricCard title="Pending Vouchers" value={stats.alerts.toString()} icon={AlertCircle} trend="none" isAlert={stats.alerts > 0} />
            </div>

            <div className="grid gap-6 lg:grid-cols-7">
              {/* Financial Chart */}
              <Card className="lg:col-span-4 glass border-white/5 overflow-hidden">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-lg font-semibold">Fiscal Health</CardTitle>
                  <Link href="/reports">
                    <Button variant="ghost" size="sm" className="rounded-full text-primary hover:bg-primary/10">
                      View Details <ChevronRight className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent className="h-[300px] pt-4">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0,0,0,0.9)', borderRadius: '16px', border: '1px solid #333' }}
                        cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                      />
                      <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} barSize={50} />
                      <Bar dataKey="expenses" fill="hsl(var(--accent))" radius={[8, 8, 0, 0]} barSize={50} />
                    </BarChart>
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
                    <p className="text-xs text-muted-foreground leading-relaxed">
                      AI is monitoring cost variances in **Construction** division due to recent material price spikes.
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
                    Recent Journal Entries
                  </CardTitle>
                  <Link href="/accounting">
                    <Button variant="outline" size="sm" className="rounded-full border-white/10 hover:bg-white/5 text-xs">
                      Ledger <Plus className="ml-1 h-3 w-3" />
                    </Button>
                  </Link>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1">
                    {!recentTransactions?.length ? (
                      <p className="py-8 text-center text-muted-foreground text-sm">No recent transactions.</p>
                    ) : (
                      recentTransactions.map((tx) => (
                        <div key={tx.id} className="flex items-center justify-between p-3 rounded-2xl hover:bg-white/5 ios-transition group cursor-pointer">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl ${tx.totalDebit > 0 ? 'bg-destructive/10' : 'bg-green-500/10'}`}>
                              <IndianRupee className={`h-4 w-4 ${tx.totalDebit > 0 ? 'text-destructive' : 'text-green-500'}`} />
                            </div>
                            <div>
                              <p className="text-sm font-semibold">{tx.description}</p>
                              <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{tx.date}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${tx.totalDebit > 0 ? 'text-destructive' : 'text-green-500'}`}>
                              {tx.totalDebit > 0 ? `-₹${tx.totalDebit.toLocaleString('en-IN')}` : `+₹${tx.totalCredit.toLocaleString('en-IN')}`}
                            </p>
                            <Badge variant="outline" className="text-[8px] h-4 rounded-full border-white/10 py-0">
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
                    Action Required
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 pt-2">
                  <AlertItem 
                    title="Overdue Vouchers" 
                    desc={`${stats.alerts} proofs pending verification in Green Villa.`}
                    severity="high"
                  />
                  <AlertItem 
                    title="Budget Warning" 
                    desc="Oval Palace project is 92% through allocated budget."
                    severity="medium"
                  />
                  <AlertItem 
                    title="Sync Complete" 
                    desc="Ledger is currently up to date with all divisions."
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
    <Card className={`glass border-white/5 hover:scale-[1.02] ios-transition ${isAlert ? 'ring-1 ring-destructive/30' : ''}`}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{title}</CardTitle>
        <div className="p-2 bg-primary/10 rounded-xl">
          <Icon className="h-4 w-4 text-primary" />
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold font-mono">
          {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
        </div>
        <div className="flex items-center gap-1.5 mt-2">
          {trend === "up" && <ArrowUpRight className="h-3 w-3 text-green-500" />}
          {trend === "down" && <ArrowDownRight className="h-3 w-3 text-destructive" />}
          <span className={`text-[10px] font-bold ${trend === "up" ? 'text-green-500' : trend === "down" ? 'text-destructive' : 'text-muted-foreground'}`}>
            {trend === "none" ? "SYNCED" : "REAL-TIME"}
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function DivisionRow({ name, value, color }: any) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs font-semibold tracking-tight">
        <span>{name}</span>
        <span className="text-muted-foreground">{value}</span>
      </div>
      <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
        <div className={`h-full ${color} ios-transition`} style={{ width: value }} />
      </div>
    </div>
  );
}

function AlertItem({ title, desc, severity }: any) {
  const colors = {
    high: "bg-destructive text-destructive",
    medium: "bg-orange-500 text-orange-500",
    low: "bg-green-500 text-green-500"
  };
  return (
    <div className="flex gap-3 p-3 rounded-2xl bg-white/5 border border-white/5 group hover:border-white/10 ios-transition cursor-pointer">
      <div className={`mt-1.5 h-1.5 w-1.5 rounded-full shrink-0 ${colors[severity as keyof typeof colors].split(' ')[0]}`} />
      <div>
        <p className="text-sm font-bold leading-none">{title}</p>
        <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
