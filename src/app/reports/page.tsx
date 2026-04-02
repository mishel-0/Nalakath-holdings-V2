"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  BarChart3, 
  FileDown, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee,
  PieChart as PieIcon,
  Download,
  Calendar,
  Layers
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
import { cn } from "@/lib/utils";

export default function ReportsPage() {
  const db = useFirestore();
  const companyId = "nalakath-holdings-main";
  const [activeTab, setActiveTab] = useState("p&l");

  const ledgerQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "journalEntries"), orderBy("date", "asc")), [db]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db]);

  const { data: ledger } = useCollection(ledgerQuery);
  const { data: expenses } = useCollection(expensesQuery);

  const stats = useMemo(() => {
    const totalRev = ledger?.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0) || 0;
    const totalExp = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    return {
      revenue: totalRev,
      opex: totalExp,
      gst: totalRev * 0.18 // Simplified GST calculation
    };
  }, [ledger, expenses]);

  const trendData = useMemo(() => {
    if (!ledger) return [];
    const monthly: Record<string, any> = {};
    ledger.forEach(tx => {
      const m = tx.date.substring(0, 7);
      if (!monthly[m]) monthly[m] = { name: m, revenue: 0, expenses: 0 };
      monthly[m].revenue += tx.totalCredit || 0;
      monthly[m].expenses += tx.totalDebit || 0;
    });
    return Object.values(monthly).sort((a, b) => a.name.localeCompare(b.name));
  }, [ledger]);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Financial Hub</h1>
                <p className="text-muted-foreground">Certified fiscal reporting and automated auditing.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5 h-10">
                  <Calendar className="h-4 w-4" /> Period
                </Button>
                <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-10">
                  <Download className="h-4 w-4" /> Export Package
                </Button>
              </div>
            </header>

            <Tabs defaultValue="p&l" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="glass p-1 rounded-full h-12 w-fit mb-6">
                <TabsTrigger value="p&l" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Profit & Loss</TabsTrigger>
                <TabsTrigger value="gst" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">GST Portal</TabsTrigger>
                <TabsTrigger value="balance" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Balance Sheet</TabsTrigger>
              </TabsList>

              <TabsContent value="p&l" className="space-y-6">
                <div className="grid gap-4 md:grid-cols-3">
                  <ReportSummaryCard title="Gross Income" value={stats.revenue} trend="up" />
                  <ReportSummaryCard title="Total OPEX" value={stats.opex} trend="down" />
                  <ReportSummaryCard title="Net Operating Profit" value={stats.revenue - stats.opex} trend={stats.revenue >= stats.opex ? "up" : "down"} highlight />
                </div>

                <Card className="glass border-white/5 h-[450px]">
                  <CardHeader>
                    <CardTitle className="text-lg font-semibold flex items-center gap-2">
                      <TrendingUp className="h-5 w-5 text-primary" />
                      Performance Trend (LTM)
                    </CardTitle>
                    <CardDescription>Visual mapping of revenue against operating expenses.</CardDescription>
                  </CardHeader>
                  <CardContent className="h-full pt-4">
                    <ResponsiveContainer width="100%" height="75%">
                      <AreaChart data={trendData}>
                        <defs>
                          <linearGradient id="p&l-grad" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid #333', borderRadius: '12px' }}
                          formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#p&l-grad)" strokeWidth={3} />
                        <Area type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gst">
                <Card className="glass border-white/5 overflow-hidden">
                  <CardHeader className="bg-white/5 border-b border-white/10">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-xl">GST Audit Summary</CardTitle>
                        <CardDescription>Calculated liabilities based on revenue and input tax credits.</CardDescription>
                      </div>
                      <Badge className="bg-primary text-black font-bold h-7 rounded-full px-4">Q2 FY 2026</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-8 space-y-8">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
                      <GSTMetric label="Taxable Turnover" value={stats.revenue} />
                      <GSTMetric label="Output GST (18%)" value={stats.gst} color="text-primary" />
                      <GSTMetric label="Estimated ITC" value={stats.opex * 0.12} color="text-green-500" />
                      <GSTMetric label="Net GST Payable" value={stats.gst - (stats.opex * 0.12)} highlight />
                    </div>
                    <div className="p-6 rounded-3xl bg-white/5 border border-white/10 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                          <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <p className="font-bold">Automated Reconciler</p>
                          <p className="text-xs text-muted-foreground">Matches Ledger entries with Payment Vouchers for accuracy.</p>
                        </div>
                      </div>
                      <Button className="rounded-full bg-white text-black font-bold hover:bg-white/90">Run Reconcile</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function ReportSummaryCard({ title, value, trend, highlight }: any) {
  return (
    <Card className={cn("glass border-white/5", highlight && "ring-1 ring-primary/20")}>
      <CardContent className="p-6">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-1">{title}</p>
        <div className="flex items-center justify-between">
          <p className={cn("text-2xl font-bold font-mono", highlight ? "text-primary" : "text-foreground")}>
            ₹{Math.abs(value).toLocaleString('en-IN')}
          </p>
          <div className={`p-1.5 rounded-full ${trend === "up" ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
            {trend === "up" ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GSTMetric({ label, value, color, highlight }: any) {
  return (
    <div className="space-y-1">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">{label}</p>
      <p className={cn("text-xl font-bold font-mono", color, highlight && "text-primary")}>
        ₹{Math.abs(value).toLocaleString('en-IN')}
      </p>
    </div>
  );
}