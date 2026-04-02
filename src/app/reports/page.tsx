
"use client";

import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { 
  BarChart3, 
  FileDown, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee,
  PieChart as PieIcon
} from "lucide-react";
import { 
  ResponsiveContainer, 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip 
} from "recharts";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";

export default function ReportsPage() {
  const db = useFirestore();
  const companyId = "nalakath-holdings-main";

  const ledgerQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "journalEntries"), orderBy("date", "asc")), [db]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db]);

  const { data: ledger } = useCollection(ledgerQuery);
  const { data: expenses } = useCollection(expensesQuery);

  // Aggregate data for the trend chart
  const trendData = useMemo(() => {
    if (!ledger) return [];
    const monthlyData: Record<string, { name: string; revenue: number; expenses: number }> = {};
    
    ledger.forEach(tx => {
      const month = tx.date.substring(0, 7); // YYYY-MM
      if (!monthlyData[month]) {
        monthlyData[month] = { name: month, revenue: 0, expenses: 0 };
      }
      monthlyData[month].revenue += tx.totalCredit || 0;
      monthlyData[month].expenses += tx.totalDebit || 0;
    });

    return Object.values(monthlyData).sort((a, b) => a.name.localeCompare(b.name));
  }, [ledger]);

  // Aggregate expenses for the distribution card
  const expenseDist = useMemo(() => {
    const categories: Record<string, number> = {};
    expenses?.forEach(exp => {
      categories[exp.expenseCategory] = (categories[exp.expenseCategory] || 0) + exp.amount;
    });
    const total = Object.values(categories).reduce((a, b) => a + b, 0) || 1;
    return Object.entries(categories).map(([name, val]) => ({
      name,
      val: Math.round((val / total) * 100),
      color: "bg-primary"
    })).slice(0, 4);
  }, [expenses]);

  const stats = useMemo(() => {
    const totalRev = ledger?.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0) || 0;
    const totalExp = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    return {
      revenue: totalRev,
      opex: totalExp,
      liquidity: totalRev - totalExp
    };
  }, [ledger, expenses]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-20 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Financial Reports</h1>
                <p className="text-muted-foreground">Quarterly performance and fiscal auditing based on live data.</p>
              </div>
              <Button variant="outline" className="rounded-full gap-2 border-white/10" disabled={!ledger?.length}>
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Total Revenue</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">₹{stats.revenue.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3" /> Live
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">OPEX</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-destructive">₹{stats.opex.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <TrendingDown className="h-3 w-3" /> Syncing
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Net Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">₹{stats.liquidity.toLocaleString('en-IN')}</div>
                  <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3" /> Calculated
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-white/5 h-[450px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Financial Trends
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                {trendData.length === 0 ? (
                  <div className="flex items-center justify-center h-full text-muted-foreground">
                    No ledger entries to display trends.
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height="80%">
                    <AreaChart data={trendData}>
                      <defs>
                        <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                      <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${(val/1000).toFixed(0)}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'black', border: '1px solid #333', borderRadius: '12px' }}
                        itemStyle={{ color: 'hsl(var(--primary))' }}
                        formatter={(val) => [`₹${Number(val).toLocaleString()}`, '']}
                      />
                      <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                      <Area type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" fillOpacity={0} strokeWidth={2} strokeDasharray="5 5" />
                    </AreaChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="glass border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieIcon className="h-5 w-5 text-primary" />
                    Expense Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {expenseDist.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No expenses recorded for distribution analysis.</p>
                    ) : (
                      expenseDist.map((item) => (
                        <div key={item.name} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-3 w-3 rounded-full ${item.color}`} />
                            <span className="text-sm font-medium">{item.name}</span>
                          </div>
                          <span className="text-sm text-muted-foreground">{item.val}%</span>
                        </div>
                      ))
                    )}
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-5 w-5" />
                    Operational Overview
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Financial performance is being monitored across all registered divisions. As data accumulates in the **General Ledger**, AI audits will automatically trigger to identify supply chain efficiencies and material cost optimizations.
                  </p>
                  <Button variant="link" className="text-primary p-0 mt-4">Generate Detailed Audit Log</Button>
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
