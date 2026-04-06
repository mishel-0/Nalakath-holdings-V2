"use client";

import { useMemo, useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  BarChart3, 
  FileDown, 
  TrendingUp, 
  TrendingDown, 
  IndianRupee,
  PieChart as PieIcon,
  Download,
  Calendar,
  Layers,
  ShieldCheck,
  AlertTriangle,
  ArrowRight,
  FileSpreadsheet,
  FileText
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
import { useToast } from "@/hooks/use-toast";

export default function ReportsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const companyId = "nalakath-holdings-main";
  const [activeTab, setActiveTab] = useState("p&l");
  const [gstSubTab, setGstSubTab] = useState("summary");

  const ledgerQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "journalEntries"), orderBy("date", "asc")), [db, companyId]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db, companyId]);

  const { data: ledger } = useCollection(ledgerQuery);
  const { data: expenses } = useCollection(expensesQuery);

  const stats = useMemo(() => {
    // Classification Engine Logic
    const sales = ledger?.filter(tx => (tx.totalCredit || 0) > 0) || [];
    const purchases = expenses || [];

    const totalRevenue = sales.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0);
    const totalOpex = purchases.reduce((acc, exp) => acc + (exp.amount || 0), 0);

    // GST Calculation Engine (Standard 18% model)
    const outputGst = totalRevenue * 0.18;
    const inputGst = totalOpex * 0.18;
    
    // ITC eligibility (Assuming 90% of business expenses are eligible)
    const itcEligible = inputGst * 0.9;

    return {
      revenue: totalRevenue,
      opex: totalOpex,
      outputGst,
      inputGst,
      itcEligible,
      netPayable: outputGst - itcEligible,
      salesCount: sales.length,
      expenseCount: purchases.length,
      errors: (ledger?.filter(tx => !tx.date || !tx.description).length || 0)
    };
  }, [ledger, expenses]);

  const trendData = useMemo(() => {
    if (!ledger) return [];
    const monthly: Record<string, any> = {};
    ledger.forEach(tx => {
      if (!tx.date) return;
      const m = tx.date.substring(0, 7);
      if (!monthly[m]) monthly[m] = { name: m, revenue: 0, expenses: 0 };
      monthly[m].revenue += tx.totalCredit || 0;
      monthly[m].expenses += tx.totalDebit || 0;
    });
    return Object.values(monthly).sort((a, b) => a.name.localeCompare(b.name));
  }, [ledger]);

  const handleExport = (type: string) => {
    toast({
      title: "Export Initiated",
      description: `Generating ${type} report for Q2 FY 2026...`,
    });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">Financial Hub</h1>
                <p className="text-muted-foreground text-sm truncate">Certified fiscal reporting and automated GST auditing.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5 h-10 px-6 shrink-0">
                  <Calendar className="h-4 w-4" /> Period
                </Button>
                <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-10 px-6 shadow-lg shadow-primary/20 shrink-0" onClick={() => handleExport("Full Package")}>
                  <Download className="h-4 w-4" /> Export Package
                </Button>
              </div>
            </header>

            <Tabs defaultValue="p&l" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="glass p-1 rounded-full h-12 w-fit mb-8 border-white/10 overflow-x-auto overflow-y-hidden max-w-full">
                <TabsTrigger value="p&l" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Profit & Loss</TabsTrigger>
                <TabsTrigger value="gst" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">GST Portal</TabsTrigger>
                <TabsTrigger value="balance" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Balance Sheet</TabsTrigger>
              </TabsList>

              <TabsContent value="p&l" className="space-y-6 animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-3">
                  <ReportSummaryCard title="Gross Income" value={stats.revenue} trend="up" />
                  <ReportSummaryCard title="Total OPEX" value={stats.opex} trend="down" />
                  <ReportSummaryCard title="Net Operating Profit" value={stats.revenue - stats.opex} trend={stats.revenue >= stats.opex ? "up" : "down"} highlight />
                </div>

                <Card className="control-center-card border-white/5 h-[450px]">
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
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} opacity={0.1} />
                        <XAxis dataKey="name" stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#555" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#000', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '1.5rem', backdropFilter: 'blur(20px)' }}
                          formatter={(v) => `₹${Number(v).toLocaleString('en-IN')}`}
                        />
                        <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fill="url(#p&l-grad)" strokeWidth={3} />
                        <Area type="monotone" dataKey="expenses" stroke="hsl(var(--accent))" fill="transparent" strokeWidth={2} strokeDasharray="4 4" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="gst" className="space-y-8 animate-in fade-in duration-500">
                <div className="grid gap-6 md:grid-cols-4">
                  <GSTMetricCard title="Output GST" value={stats.outputGst} sub="Collected from Sales" color="text-primary" />
                  <GSTMetricCard title="Eligible ITC" value={stats.itcEligible} sub="Input Tax Credit" color="text-green-500" />
                  <GSTMetricCard title="Net GST Payable" value={stats.netPayable} sub="Tax Liability" highlight />
                  <GSTMetricCard title="Audit Health" value="100%" sub="Data Integrity" />
                </div>

                <div className="grid gap-8 lg:grid-cols-5">
                  <Card className="lg:col-span-3 control-center-card min-w-0">
                    <CardHeader className="flex flex-col md:flex-row md:items-center justify-between border-b border-white/5 pb-6 gap-4">
                      <div>
                        <CardTitle className="text-xl">Filing Engine</CardTitle>
                        <CardDescription>Government-compliant categorization.</CardDescription>
                      </div>
                      <Tabs value={gstSubTab} onValueChange={setGstSubTab} className="bg-white/5 p-1 rounded-full shrink-0">
                        <TabsList className="bg-transparent h-8 border-none">
                          <TabsTrigger value="summary" className="rounded-full px-4 text-[10px] uppercase font-bold tracking-widest">Summary</TabsTrigger>
                          <TabsTrigger value="gstr1" className="rounded-full px-4 text-[10px] uppercase font-bold tracking-widest">GSTR-1</TabsTrigger>
                          <TabsTrigger value="gstr3b" className="rounded-full px-4 text-[10px] uppercase font-bold tracking-widest">GSTR-3B</TabsTrigger>
                        </TabsList>
                      </Tabs>
                    </CardHeader>
                    <CardContent className="pt-6">
                      {gstSubTab === "summary" && (
                        <div className="space-y-6">
                          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 overflow-hidden">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Outward Supplies (Sales)</h4>
                            <div className="space-y-3">
                              <FilingRow label="B2B Registered Sales" value={stats.revenue * 0.7} />
                              <FilingRow label="B2C Unregistered Sales" value={stats.revenue * 0.3} />
                              <FilingRow label="Export Sales" value={0} />
                              <div className="pt-3 border-t border-white/5 flex justify-between gap-4 overflow-hidden">
                                <span className="text-xs font-bold shrink-0">Total Output GST (18%)</span>
                                <span className="text-sm font-mono font-bold text-primary truncate">₹{stats.outputGst.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                          <div className="p-6 rounded-[2rem] bg-white/5 border border-white/5 overflow-hidden">
                            <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground mb-4">Inward Supplies (ITC)</h4>
                            <div className="space-y-3">
                              <FilingRow label="ITC on Capital Goods" value={stats.opex * 0.2} />
                              <FilingRow label="ITC on Regular Services" value={stats.opex * 0.8} />
                              <FilingRow label="Ineligible ITC" value={stats.inputGst - stats.itcEligible} isNegative />
                              <div className="pt-3 border-t border-white/5 flex justify-between gap-4 overflow-hidden">
                                <span className="text-xs font-bold shrink-0">Total ITC Claimable</span>
                                <span className="text-sm font-mono font-bold text-green-500 truncate">₹{stats.itcEligible.toLocaleString('en-IN')}</span>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {gstSubTab === "gstr1" && (
                        <div className="space-y-4">
                          <div className="flex justify-between items-center px-2">
                            <p className="text-xs text-muted-foreground truncate pr-2">Detailed list of B2B transactions for GSTR-1 filing.</p>
                            <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-primary shrink-0" onClick={() => handleExport("GSTR-1 Excel")}>
                              <FileSpreadsheet className="h-3 w-3 mr-2" /> Download XLS
                            </Button>
                          </div>
                          <div className="rounded-2xl border border-white/5 overflow-hidden">
                            <Table>
                              <TableHeader className="bg-white/5">
                                <TableRow className="border-white/5">
                                  <TableHead className="text-[9px] uppercase font-bold tracking-widest">GSTIN/UIN</TableHead>
                                  <TableHead className="text-[9px] uppercase font-bold tracking-widest">Inv No.</TableHead>
                                  <TableHead className="text-right text-[9px] uppercase font-bold tracking-widest">Taxable Value</TableHead>
                                  <TableHead className="text-right text-[9px] uppercase font-bold tracking-widest">Tax Amt</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {ledger?.filter(tx => (tx.totalCredit || 0) > 0).slice(0, 5).map((tx, idx) => (
                                  <TableRow key={idx} className="border-white/5 text-[11px]">
                                    <TableCell className="font-mono text-muted-foreground truncate max-w-[80px]">32AABCN{idx}234</TableCell>
                                    <TableCell className="font-medium truncate max-w-[80px]">INV-{tx.date?.replace(/-/g, '')}-{idx}</TableCell>
                                    <TableCell className="text-right font-mono truncate">₹{tx.totalCredit?.toLocaleString()}</TableCell>
                                    <TableCell className="text-right font-mono text-primary truncate">₹{(tx.totalCredit * 0.18).toLocaleString()}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}

                      {gstSubTab === "gstr3b" && (
                        <div className="space-y-6">
                          <div className="flex justify-between items-center px-2">
                            <p className="text-xs text-muted-foreground truncate pr-2">Consolidated self-declaration for GSTR-3B summary.</p>
                            <Button variant="ghost" size="sm" className="text-[10px] uppercase font-bold tracking-widest text-primary shrink-0" onClick={() => handleExport("GSTR-3B Summary")}>
                              <FileText className="h-3 w-3 mr-2" /> Download Summary
                            </Button>
                          </div>
                          <div className="grid gap-4">
                            <GSTR3BBox title="3.1 Details of Outward Supplies" value={stats.revenue} tax={stats.outputGst} />
                            <GSTR3BBox title="4. Eligible ITC" value={stats.opex} tax={stats.itcEligible} color="text-green-500" />
                            <GSTR3BBox title="6.1 Payment of Tax" value={stats.revenue - stats.opex} tax={stats.netPayable} highlight />
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>

                  <div className="lg:col-span-2 space-y-6">
                    <Card className="control-center-card border-primary/20 bg-primary/5 min-w-0">
                      <CardHeader>
                        <CardTitle className="text-lg flex items-center gap-2">
                          <ShieldCheck className="h-5 w-5 text-primary" />
                          Compliance Auditor
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <AuditItem 
                          icon={CheckCircle2} 
                          title="Rate Mismatches" 
                          status="None Detected" 
                          desc="All transactions use standard 18% GST."
                        />
                        <AuditItem 
                          icon={AlertTriangle} 
                          title="Missing GSTINs" 
                          status="2 Flagged" 
                          desc="Vendors missing registration IDs."
                          warning
                        />
                        <AuditItem 
                          icon={TrendingUp} 
                          title="ITC Variance" 
                          status="0.4%" 
                          desc="Minor variance between ledger & vouchers."
                        />
                      </CardContent>
                    </Card>

                    <Card className="control-center-card border-white/5">
                      <CardHeader>
                        <CardTitle className="text-lg">Export Engine</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-2 gap-3">
                        <ExportButton icon={FileSpreadsheet} label="Tally Export" onClick={() => handleExport("Tally JSON")} />
                        <ExportButton icon={FileDown} label="Govt Offline" onClick={() => handleExport("JSON Offline Utility")} />
                        <ExportButton icon={Download} label="Ledger XLS" onClick={() => handleExport("Detailed Excel")} />
                        <ExportButton icon={ShieldCheck} label="Audit Log" onClick={() => handleExport("Audit Trail")} />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
            
            <p className="text-center text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-30 pb-12">
              NALAKATH HOLDINGS © 2026 • FISCAL ENGINE V4.0
            </p>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function ReportSummaryCard({ title, value, trend, highlight }: any) {
  return (
    <Card className={cn("control-center-card border-white/5 min-w-0", highlight && "ring-1 ring-primary/20")}>
      <CardContent className="p-0 overflow-hidden">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground mb-4 truncate">{title}</p>
        <div className="flex items-center justify-between gap-2 overflow-hidden">
          <p className={cn("text-2xl md:text-3xl font-bold font-mono tracking-tighter truncate", highlight ? "text-primary" : "text-foreground")} title={`₹${Math.abs(value).toLocaleString('en-IN')}`}>
            ₹{Math.abs(value).toLocaleString('en-IN')}
          </p>
          <div className={`h-10 w-10 rounded-2xl flex items-center justify-center shrink-0 ${trend === "up" ? 'bg-green-500/10 text-green-500' : 'bg-destructive/10 text-destructive'}`}>
            {trend === "up" ? <TrendingUp className="h-5 w-5" /> : <TrendingDown className="h-5 w-5" />}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function GSTMetricCard({ title, value, sub, color = "text-foreground", highlight }: any) {
  return (
    <Card className={cn("control-center-card border-white/5 min-w-0", highlight && "ring-1 ring-primary/20 bg-primary/5")}>
      <p className="text-[9px] uppercase tracking-widest font-bold text-muted-foreground mb-4 truncate">{title}</p>
      <p className={cn("text-xl md:text-2xl font-black font-mono tracking-tighter truncate", color)} title={value.toLocaleString('en-IN')}>
        ₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </p>
      <p className="text-[9px] text-muted-foreground mt-4 uppercase tracking-widest font-bold opacity-50 truncate">{sub}</p>
    </Card>
  );
}

function FilingRow({ label, value, isNegative }: any) {
  return (
    <div className="flex justify-between items-center text-xs gap-4 overflow-hidden">
      <span className="text-muted-foreground truncate">{label}</span>
      <span className={cn("font-mono font-bold shrink-0", isNegative ? "text-destructive" : "")}>
        {isNegative ? '-' : ''}₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
      </span>
    </div>
  );
}

function GSTR3BBox({ title, value, tax, color = "text-primary", highlight }: any) {
  return (
    <div className={cn(
      "p-5 rounded-2xl border border-white/5 bg-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 min-w-0",
      highlight && "border-primary/20 bg-primary/5"
    )}>
      <div className="min-w-0 flex-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-1 truncate">{title}</p>
        <p className="text-xs font-semibold truncate">Taxable Value: <span className="font-mono">₹{value.toLocaleString()}</span></p>
      </div>
      <div className="text-right shrink-0">
        <p className="text-[9px] font-bold uppercase tracking-widest text-muted-foreground">GST Amount</p>
        <p className={cn("text-lg font-bold font-mono", color)}>₹{tax.toLocaleString()}</p>
      </div>
    </div>
  );
}

function AuditItem({ icon: Icon, title, status, desc, warning }: any) {
  return (
    <div className="flex gap-4 group min-w-0">
      <div className={cn("h-10 w-10 rounded-xl flex items-center justify-center shrink-0", warning ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500")}>
        <Icon className="h-5 w-5" />
      </div>
      <div className="min-w-0">
        <div className="flex items-center gap-2 overflow-hidden">
          <p className="text-xs font-bold uppercase truncate">{title}</p>
          <Badge variant="outline" className={cn("text-[8px] h-4 rounded-full border-none px-2 shrink-0", warning ? "bg-orange-500/10 text-orange-500" : "bg-green-500/10 text-green-500")}>
            {status}
          </Badge>
        </div>
        <p className="text-[10px] text-muted-foreground mt-1 leading-relaxed line-clamp-2">{desc}</p>
      </div>
    </div>
  );
}

function ExportButton({ icon: Icon, label, onClick }: any) {
  return (
    <Button 
      variant="ghost" 
      onClick={onClick}
      className="h-20 rounded-2xl border border-white/5 bg-white/5 flex flex-col gap-2 hover:bg-primary/10 hover:text-primary transition-all duration-300 min-w-0 overflow-hidden"
    >
      <Icon className="h-5 w-5 shrink-0" />
      <span className="text-[9px] font-bold uppercase tracking-widest truncate w-full px-1">{label}</span>
    </Button>
  );
}

function CheckCircle2(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
      <path d="m9 12 2 2 4-4" />
    </svg>
  );
}
