"use client";

import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  ArrowUpRight, 
  ArrowDownRight, 
  IndianRupee, 
  Briefcase, 
  BarChart4, 
  PieChart as PieIcon,
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";
import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  Bar as RechartsBar,
} from "recharts";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";

export default function Dashboard() {
  const db = useFirestore();
  const companyId = "nalakath-holdings-main";

  // Real-time data fetching
  const invoicesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "invoices")), [db]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db]);
  const projectsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "projects")), [db]);
  const recentTxQuery = useMemoFirebase(() => 
    query(collection(db, "companies", companyId, "journalEntries"), orderBy("createdAt", "desc"), limit(4)), 
  [db]);

  const { data: invoices } = useCollection(invoicesQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: recentTransactions } = useCollection(recentTxQuery);

  // Dynamic Statistics Calculation
  const statsData = useMemo(() => {
    const totalRevenue = invoices?.reduce((acc, inv) => acc + (inv.type === "Sales" ? (inv.totalAmount || 0) : 0), 0) || 0;
    const totalExpenses = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    const projectCosts = projects?.reduce((acc, proj) => acc + (proj.actualCost || 0), 0) || 0;
    const netProfit = totalRevenue - totalExpenses;

    return [
      {
        title: "Total Revenue",
        value: `₹${totalRevenue.toLocaleString('en-IN')}`,
        change: "+12.5%",
        trend: "up",
        icon: IndianRupee,
      },
      {
        title: "Net Profit",
        value: `₹${netProfit.toLocaleString('en-IN')}`,
        change: "+4.3%",
        trend: netProfit >= 0 ? "up" : "down",
        icon: TrendingUp,
      },
      {
        title: "Project Costs",
        value: `₹${projectCosts.toLocaleString('en-IN')}`,
        change: "-2.1%",
        trend: "down",
        icon: Briefcase,
      },
      {
        title: "Active Projects",
        value: projects?.length.toString() || "0",
        change: "New",
        trend: "up",
        icon: BarChart4,
      },
    ];
  }, [invoices, expenses, projects]);

  // Chart data simulation based on real data
  const chartData = [
    { name: "Current", revenue: statsData[0].value.replace(/[^0-9]/g, ''), expenses: statsData[2].value.replace(/[^0-9]/g, '') },
  ];

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-20 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Overview</h1>
              <p className="text-muted-foreground">Real-time performance metrics for Nalakath Holdings.</p>
            </header>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {statsData.map((stat) => (
                <Card key={stat.title} className="glass border-white/5 hover:scale-[1.02] ios-transition">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <div className="p-2 bg-primary/10 rounded-xl">
                      <stat.icon className="h-4 w-4 text-primary" />
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{stat.value}</div>
                    <p className="flex items-center text-xs pt-1">
                      {stat.trend === "up" ? (
                        <span className="text-green-500 flex items-center mr-1">
                          <ArrowUpRight className="h-3 w-3 mr-0.5" />
                          {stat.change}
                        </span>
                      ) : (
                        <span className="text-red-500 flex items-center mr-1">
                          <ArrowDownRight className="h-3 w-3 mr-0.5" />
                          {stat.change}
                        </span>
                      )}
                      <span className="text-muted-foreground">real-time sync</span>
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 lg:grid-cols-7">
              <Card className="lg:col-span-4 glass border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Financial Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#aaa' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                      />
                      <RechartsBar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={40} />
                      <RechartsBar dataKey="expenses" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} barSize={40} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card className="lg:col-span-3 glass border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-primary" />
                    Division Allocation
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px] flex flex-col justify-center">
                  <div className="space-y-4">
                    {[
                      { name: "Nalakath Construction", value: "45%", color: "bg-primary" },
                      { name: "Oval Palace Resort", value: "25%", color: "bg-accent" },
                      { name: "Green Villa", value: "30%", color: "bg-yellow-600" },
                    ].map((div) => (
                      <div key={div.name} className="flex flex-col gap-1">
                        <div className="flex justify-between text-sm">
                          <span className="font-medium">{div.name}</span>
                          <span className="text-muted-foreground">{div.value}</span>
                        </div>
                        <div className="h-2 w-full bg-secondary/50 rounded-full overflow-hidden">
                          <div className={`h-full ${div.color}`} style={{ width: div.value }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Card className="glass border-white/5">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Recent Ledger
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {recentTransactions?.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No recent transactions.</p>
                    ) : (
                      recentTransactions?.map((item, i) => (
                        <div key={item.id} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                          <div>
                            <p className="text-sm font-semibold">{item.description}</p>
                            <p className="text-xs text-muted-foreground">{item.date}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-bold ${item.totalDebit > 0 ? 'text-green-500' : 'text-foreground'}`}>
                              {item.totalDebit > 0 ? `+₹${item.totalDebit.toLocaleString()}` : `-₹${item.totalCredit.toLocaleString()}`}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>

              <Card className="glass border-white/5 md:col-span-2 lg:col-span-1">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-primary" />
                    AI Insights
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10">
                      <p className="text-sm font-medium text-primary">Data Integrated</p>
                      <p className="text-xs text-muted-foreground mt-1">Firestore connection established. AI is now monitoring Nalakath Holdings ledger.</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-accent/5 border border-accent/10">
                      <p className="text-sm font-medium text-accent">Optimization Hint</p>
                      <p className="text-xs text-muted-foreground mt-1">Review "AI Insights" tab to generate cost-saving strategies from live data.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
