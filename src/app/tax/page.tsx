"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  Calculator, 
  BarChart3, 
  FileText, 
  Settings2, 
  Plus, 
  Trash2, 
  Save, 
  RefreshCw, 
  ArrowRightLeft,
  TrendingUp,
  Download,
  AlertCircle
} from "lucide-react";
import { useFirestore, useCollection, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { useDivision } from "@/context/DivisionContext";

interface ExtraTax {
  id: string;
  name: string;
  rate: number;
}

export default function TaxEnginePage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { activeDivision } = useDivision();
  const [activeTab, setActiveTab] = useState("calculator");
  const companyId = activeDivision.id;

  // Calculator State
  const [baseAmount, setBaseAmount] = useState<number>(0);
  const [gstRate, setGstRate] = useState<number>(18);
  const [taxType, setTaxType] = useState<"GST" | "IGST">("GST");
  const [extraTaxes, setExtraTaxes] = useState<ExtraTax[]>([]);
  const [reverseMode, setReverseMode] = useState(false);

  // Firestore Data for Real-Time Sync
  const recordsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "taxRecords"), orderBy("timestamp", "desc"), limit(10)), [db, companyId]);
  const ledgerQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "journalEntries")), [db, companyId]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db, companyId]);

  const { data: ledger } = useCollection(ledgerQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: recentRecords } = useCollection(recordsQuery);

  // Calculate Real Dashboard Figures
  const stats = useMemo(() => {
    const totalRevenue = ledger?.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0) || 0;
    const totalExp = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
    
    // Applying standard 18% GST logic for summary view
    const outputGst = totalRevenue * 0.18;
    const inputGst = totalExp * 0.18;
    
    return {
      outputGst,
      inputGst,
      netPayable: outputGst - inputGst,
      accuracy: 99.9
    };
  }, [ledger, expenses]);

  const calculations = useMemo(() => {
    if (reverseMode) {
      const net = baseAmount / (1 + gstRate / 100);
      const tax = baseAmount - net;
      return { base: net, tax, total: baseAmount };
    } else {
      const tax = (baseAmount * gstRate) / 100;
      let extraTotal = 0;
      extraTaxes.forEach(t => { extraTotal += (baseAmount * t.rate) / 100; });
      return { base: baseAmount, tax, extra: extraTotal, total: baseAmount + tax + extraTotal };
    }
  }, [baseAmount, gstRate, extraTaxes, reverseMode]);

  const handleAddExtraTax = () => {
    setExtraTaxes([...extraTaxes, { id: Math.random().toString(), name: "Custom Tax", rate: 1 }]);
  };

  const handleRemoveExtraTax = (id: string) => {
    setExtraTaxes(extraTaxes.filter(t => t.id !== id));
  };

  const handleSaveRecord = () => {
    const record = {
      baseAmount: calculations.base,
      taxRate: gstRate,
      cgst: taxType === "GST" ? calculations.tax / 2 : 0,
      sgst: taxType === "GST" ? calculations.tax / 2 : 0,
      igst: taxType === "IGST" ? calculations.tax : 0,
      totalTax: calculations.tax + (calculations.extra || 0),
      finalAmount: calculations.total,
      timestamp: new Date().toISOString(),
      type: "Calculated"
    };
    addDocumentNonBlocking(collection(db, "companies", companyId, "taxRecords"), record);
    toast({ title: "Tax Record Saved", description: `Calculation stored for ${activeDivision.name}.` });
  };

  return (
    <main className="flex-1 px-4 py-8 md:pl-80 md:pr-12 md:pt-32 mb-24 md:mb-0 overflow-hidden">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        
        <header className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Badge variant="outline" className="rounded-full px-4 py-1 text-[9px] uppercase tracking-widest font-bold border-primary/40 text-primary bg-primary/5">
              {activeDivision.division} COMPLIANCE
            </Badge>
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase mt-2 truncate">
            GST & Tax Management
          </h1>
          <p className="text-muted-foreground text-sm truncate">Automated processing for {activeDivision.name}.</p>
        </header>

        <Tabs defaultValue="calculator" className="w-full" onValueChange={setActiveTab}>
          <TabsList className="glass p-1 rounded-full h-12 w-fit mb-8 border-white/10 overflow-x-auto max-w-full">
            <TabsTrigger value="calculator" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Calculator</TabsTrigger>
            <TabsTrigger value="dashboard" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">GST Dashboard</TabsTrigger>
            <TabsTrigger value="reports" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Filing Reports</TabsTrigger>
            <TabsTrigger value="rules" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Tax Rules</TabsTrigger>
          </TabsList>

          <TabsContent value="calculator" className="grid gap-8 lg:grid-cols-5">
            <Card className="lg:col-span-3 control-center-card border-white/5 overflow-hidden">
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="min-w-0">
                  <CardTitle className="text-xl font-bold truncate">{reverseMode ? "Reverse Tax Engine" : "Universal Tax Calculator"}</CardTitle>
                  <CardDescription className="truncate">Advanced computation for {activeDivision.name}.</CardDescription>
                </div>
                <Button variant="ghost" size="icon" className="rounded-full shrink-0" onClick={() => setReverseMode(!reverseMode)}>
                  <ArrowRightLeft className="h-5 w-5 text-primary" />
                </Button>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2 min-w-0">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">{reverseMode ? "Total Amount (₹)" : "Base Amount (₹)"}</Label>
                    <Input 
                      type="number" 
                      value={baseAmount || ""} 
                      onChange={(e) => setBaseAmount(Number(e.target.value))}
                      className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-mono"
                    />
                  </div>
                  <div className="space-y-2 min-w-0">
                    <Label className="text-[10px] uppercase font-bold text-muted-foreground">GST Rate (%)</Label>
                    <Select value={gstRate.toString()} onValueChange={(v) => setGstRate(Number(v))}>
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-14 text-lg font-mono">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="5">5%</SelectItem>
                        <SelectItem value="12">12%</SelectItem>
                        <SelectItem value="18">18%</SelectItem>
                        <SelectItem value="28">28%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="text-[10px] uppercase font-bold text-primary tracking-widest">Additional Taxes</Label>
                    <Button variant="ghost" size="sm" onClick={handleAddExtraTax} className="text-[10px] uppercase tracking-widest font-bold">
                      <Plus className="h-3 w-3 mr-1" /> Add Tax Field
                    </Button>
                  </div>
                  <div className="space-y-3">
                    {extraTaxes.map((tax) => (
                      <div key={tax.id} className="flex items-center gap-3 animate-in slide-in-from-left duration-300">
                        <Input 
                          placeholder="Tax Name" 
                          className="bg-white/5 border-white/10 rounded-xl h-10 flex-1"
                          value={tax.name}
                          onChange={(e) => {
                            const newTaxes = [...extraTaxes];
                            newTaxes.find(t => t.id === tax.id)!.name = e.target.value;
                            setExtraTaxes(newTaxes);
                          }}
                        />
                        <Input 
                          type="number" 
                          placeholder="Rate %" 
                          className="bg-white/5 border-white/10 rounded-xl h-10 w-24 font-mono"
                          value={tax.rate}
                          onChange={(e) => {
                            const newTaxes = [...extraTaxes];
                            newTaxes.find(t => t.id === tax.id)!.rate = Number(e.target.value);
                            setExtraTaxes(newTaxes);
                          }}
                        />
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveExtraTax(tax.id)} className="text-destructive hover:bg-destructive/10">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-6 border-t border-white/5 grid grid-cols-2 gap-4">
                  <Button onClick={handleSaveRecord} className="h-14 rounded-[1.5rem] gold-gradient text-black font-bold gap-2 truncate">
                    <Save className="h-5 w-5" /> Save Record
                  </Button>
                  <Button variant="outline" onClick={() => { setBaseAmount(0); setExtraTaxes([]); }} className="h-14 rounded-[1.5rem] border-white/10 hover:bg-white/5 truncate">
                    <RefreshCw className="h-5 w-5" /> Reset Engine
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-2 control-center-card border-primary/20 bg-primary/5 min-w-0 overflow-hidden">
              <CardHeader>
                <CardTitle className="text-xl font-bold flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-primary" />
                  Live Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-6 rounded-[2rem] bg-background/50 border border-white/5 space-y-4 overflow-hidden">
                  <BreakdownRow label={reverseMode ? "Gross Amount" : "Base Amount"} value={calculations.base} />
                  <BreakdownRow label={`GST (${gstRate}%)`} value={calculations.tax} color="text-primary" />
                  {extraTaxes.map(t => (
                    <BreakdownRow key={t.id} label={`${t.name} (${t.rate}%)`} value={(calculations.base * t.rate) / 100} />
                  ))}
                  <div className="pt-4 mt-4 border-t border-white/10 flex justify-between items-end gap-2 overflow-hidden">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground mb-1 shrink-0">Final Net Payable</span>
                    <span className="text-2xl md:text-3xl font-black font-mono truncate" title={calculations.total.toLocaleString('en-IN')}>₹{calculations.total.toLocaleString('en-IN')}</span>
                  </div>
                </div>

                <Card className="border-white/5 bg-white/5 rounded-[2rem] overflow-hidden">
                  <CardHeader className="py-4 px-6 border-b border-white/5">
                    <CardTitle className="text-sm font-bold uppercase tracking-widest text-muted-foreground truncate">History: {activeDivision.division}</CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-3">
                    {!recentRecords || recentRecords?.length === 0 ? (
                      <p className="text-xs text-muted-foreground italic text-center py-4">No records for this division.</p>
                    ) : (
                      recentRecords?.map((r) => (
                        <div key={r.id} className="flex justify-between items-center text-xs px-2 gap-4 overflow-hidden">
                          <span className="font-mono text-muted-foreground shrink-0">{new Date(r.timestamp).toLocaleTimeString()}</span>
                          <span className="font-bold truncate text-right">₹{r.finalAmount.toLocaleString('en-IN')}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-4">
              <TaxStatCard title="Input GST" value={stats.inputGst} trend="up" desc="ITC offset available" />
              <TaxStatCard title="Output GST" value={stats.outputGst} trend="up" desc="Liability from sales" />
              <TaxStatCard title="Net GST Payable" value={stats.netPayable} trend={stats.netPayable > 0 ? "up" : "down"} desc="Final settlement due" highlight />
              <TaxStatCard title="Entity Accuracy" value={`${stats.accuracy}%`} trend="none" desc="Filing readiness score" />
            </div>
            <Card className="control-center-card border-white/5 h-[400px] flex items-center justify-center overflow-hidden">
              <div className="text-center space-y-4 px-6">
                <BarChart3 className="h-12 w-12 text-primary mx-auto opacity-20" />
                <p className="text-muted-foreground text-sm font-mono uppercase tracking-widest animate-pulse truncate">Visual Stream: {activeDivision.name}</p>
              </div>
            </Card>
          </TabsContent>

          <TabsContent value="reports" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <ReportActionCard 
                title="GSTR-1 Report" 
                desc={`Consolidated outward supplies for ${activeDivision.name}.`} 
                icon={FileText} 
                action="Generate GSTR-1"
              />
              <ReportActionCard 
                title="GSTR-3B Summary" 
                desc={`Self-declared payment summary for ${activeDivision.division}.`} 
                icon={TrendingUp} 
                action="Generate GSTR-3B"
              />
            </div>
            <Card className="control-center-card border-white/5">
              <CardHeader>
                <CardTitle className="text-xl font-bold">Division Filing History</CardTitle>
              </CardHeader>
              <CardContent className="h-[200px] flex items-center justify-center italic text-muted-foreground text-sm px-6 text-center">
                No generated reports for {activeDivision.name} in this period.
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rules" className="space-y-6">
            <Card className="control-center-card border-white/5">
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-xl font-bold flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-primary" />
                      Tax Rule Engine
                    </CardTitle>
                    <CardDescription className="truncate">Conditional logic for {activeDivision.name}.</CardDescription>
                  </div>
                  <Button className="rounded-full gold-gradient text-black font-bold h-10 px-6 shrink-0">
                    <Plus className="h-4 w-4 mr-1" /> New Rule
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <RuleItem condition="Transaction Category: Infrastructure" action="Apply Cess 2% + GST 18%" status="ACTIVE" />
                  <RuleItem condition="Transaction State: Outside Region" action="Apply IGST 18%" status="ACTIVE" />
                  <RuleItem condition="Vendor Class: Registered" action="Apply RCM Rules" status="INACTIVE" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}

function BreakdownRow({ label, value, color = "text-foreground" }: any) {
  return (
    <div className="flex justify-between items-center text-sm gap-4 overflow-hidden">
      <span className="text-muted-foreground uppercase tracking-widest text-[10px] font-bold truncate">{label}</span>
      <span className={cn("font-mono font-bold shrink-0", color)}>₹{value.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
    </div>
  );
}

function TaxStatCard({ title, value, trend, desc, highlight }: any) {
  return (
    <Card className={cn("control-center-card border-white/5 min-w-0", highlight && "ring-1 ring-primary/20")}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest mb-4 truncate">{title}</p>
      <div className="flex items-center justify-between gap-2 overflow-hidden">
        <div className={cn("text-xl md:text-2xl font-bold font-mono tracking-tighter truncate", highlight ? "text-primary" : "text-foreground")} title={typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}>
          {typeof value === 'number' ? `₹${value.toLocaleString('en-IN')}` : value}
        </div>
      </div>
      <p className="text-[10px] text-muted-foreground mt-4 uppercase tracking-widest opacity-60 truncate">{desc}</p>
    </Card>
  );
}

function ReportActionCard({ title, desc, icon: Icon, action }: any) {
  return (
    <Card className="control-center-card border-white/5 hover:border-primary/20 ios-transition min-w-0">
      <div className="flex items-center gap-4 mb-4">
        <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary shrink-0">
          <Icon className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h3 className="text-lg font-bold truncate">{title}</h3>
          <p className="text-xs text-muted-foreground truncate">{desc}</p>
        </div>
      </div>
      <Button className="w-full h-12 rounded-2xl bg-white/5 border border-white/10 hover:bg-primary hover:text-black font-bold text-xs uppercase tracking-widest gap-2 truncate px-4">
        <Download className="h-4 w-4 shrink-0" /> {action}
      </Button>
    </Card>
  );
}

function RuleItem({ condition, action, status }: any) {
  return (
    <div className="p-5 rounded-3xl bg-white/5 border border-white/5 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 group hover:border-white/10 ios-transition min-w-0">
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold text-primary mb-1 uppercase tracking-widest truncate">IF {condition}</p>
        <p className="text-sm font-medium truncate">THEN {action}</p>
      </div>
      <Badge className={cn(
        "rounded-full px-4 py-1 text-[9px] font-bold tracking-widest shrink-0",
        status === "ACTIVE" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-zinc-500/10 text-zinc-500 border-zinc-500/20"
      )} variant="outline">
        {status}
      </Badge>
    </div>
  );
}
