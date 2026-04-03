
"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Sparkles, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap,
  ArrowRight,
  RefreshCcw,
  CheckCircle2,
  TrendingUp,
  History,
  ShieldAlert,
  Search,
  LayoutDashboard
} from "lucide-react";
import { 
  costOptimizationSuggestions, 
  type CostOptimizationSuggestionsOutput,
  type CostOptimizationSuggestionsInput
} from "@/ai/flows/cost-optimization-suggestions";
import { 
  predictCashFlow,
  type CashFlowPredictionOutput,
  type CashFlowPredictionInput
} from "@/ai/flows/cash-flow-prediction";
import {
  detectTransactionAnomaly,
  type DetectTransactionAnomalyOutput,
  type DetectTransactionAnomalyInput
} from "@/ai/flows/transaction-anomaly-detection-flow";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function InsightsPage() {
  const db = useFirestore();
  const companyId = "nalakath-holdings-main";
  
  const [activeTab, setActiveTab] = useState("strategy");
  const [loading, setLoading] = useState(false);
  
  // States for different AI outputs
  const [strategyInsights, setStrategyInsights] = useState<CostOptimizationSuggestionsOutput | null>(null);
  const [cashFlowInsights, setCashFlowInsights] = useState<CashFlowPredictionOutput | null>(null);
  const [anomalyResults, setAnomalyResults] = useState<any[]>([]);

  // Real-time data
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses"), orderBy("createdAt", "desc")), [db]);
  const projectsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "projects")), [db]);
  const ledgerQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "journalEntries"), orderBy("date", "asc")), [db]);
  const vouchersQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "vouchers"), orderBy("date", "desc")), [db]);

  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: ledger } = useCollection(ledgerQuery);
  const { data: vouchers } = useCollection(vouchersQuery);

  const totalRevenue = useMemo(() => ledger?.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0) || 0, [ledger]);
  const totalExpenses = useMemo(() => expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0, [expenses]);

  const runAnalysis = async () => {
    setLoading(true);
    try {
      if (activeTab === "strategy") {
        await generateStrategy();
      } else if (activeTab === "prediction") {
        await generatePrediction();
      } else if (activeTab === "audit") {
        await runAudit();
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateStrategy = async () => {
    const expenseMap: Record<string, number> = {};
    expenses?.forEach(exp => {
      const cat = exp.expenseCategory || "Uncategorized";
      expenseMap[cat] = (expenseMap[cat] || 0) + exp.amount;
    });

    const topCategories = Object.entries(expenseMap)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 3)
      .map(([category, amount]) => ({
        category,
        amount,
        percentageOfTotalExpenses: totalExpenses > 0 ? (amount / totalExpenses) * 100 : 0
      }));

    const input: CostOptimizationSuggestionsInput = {
      companyName: "Nalakath Holdings",
      financialSummary: {
        netProfit: totalRevenue - totalExpenses,
        totalRevenue,
        totalExpenses,
        profitMargin: totalRevenue > 0 ? ((totalRevenue - totalExpenses) / totalRevenue) * 100 : 0
      },
      spendingAnalysis: {
        topExpenseCategories: topCategories,
        projectSpendingOverview: projects?.map(p => ({
          projectName: p.name,
          budget: p.budgetAmount,
          actualSpent: p.actualCost,
          variance: p.budgetAmount - p.actualCost,
          status: p.status
        })) || []
      }
    };

    const result = await costOptimizationSuggestions(input);
    setStrategyInsights(result);
  };

  const generatePrediction = async () => {
    const projected = vouchers?.map(v => ({
      description: v.vendorName,
      type: "expense" as const,
      amount: v.amount,
      date: new Date(v.date).toISOString()
    })) || [];

    const input: CashFlowPredictionInput = {
      currentCashBalance: totalRevenue - totalExpenses,
      projectedTransactions: projected,
      predictionPeriodDays: 30,
      todayDate: new Date().toISOString()
    };

    const result = await predictCashFlow(input);
    setCashFlowInsights(result);
  };

  const runAudit = async () => {
    if (!expenses || expenses.length < 2) return;
    
    const results = [];
    // Analyze the 3 most recent expenses for anomalies
    const recent = expenses.slice(0, 3);
    const history = expenses.slice(3, 10);

    for (const exp of recent) {
      const input: DetectTransactionAnomalyInput = {
        currentTransaction: {
          transactionId: exp.id,
          date: exp.expenseDate,
          amount: exp.amount,
          description: exp.description,
          account: "General Expense",
          category: exp.expenseCategory
        },
        historicalTransactions: history.map(h => ({
          transactionId: h.id,
          date: h.expenseDate,
          amount: h.amount,
          description: h.description,
          account: "General Expense",
          category: h.expenseCategory
        }))
      };
      const result = await detectTransactionAnomaly(input);
      results.push({ ...exp, analysis: result });
    }
    setAnomalyResults(results);
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-20 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline flex items-center gap-3">
                  AI Financial Assistant
                  <Sparkles className="h-8 w-8 text-primary animate-pulse" />
                </h1>
                <p className="text-muted-foreground">Premium automated insights and fiscal intelligence.</p>
              </div>
              <Button 
                onClick={runAnalysis} 
                disabled={loading}
                className="rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-black h-11 px-6 font-bold"
              >
                {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4" />}
                Run Live Analysis
              </Button>
            </header>

            <Tabs defaultValue="strategy" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="glass p-1 rounded-full h-12 w-fit mb-8 border-white/10">
                <TabsTrigger value="strategy" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Strategy</TabsTrigger>
                <TabsTrigger value="prediction" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Forecast</TabsTrigger>
                <TabsTrigger value="audit" className="rounded-full px-6 text-xs uppercase tracking-widest font-bold">Audit Monitor</TabsTrigger>
              </TabsList>

              {/* Strategy Engine */}
              <TabsContent value="strategy" className="space-y-6">
                {!strategyInsights && !loading ? (
                  <EmptyInsight icon={Target} title="Strategy Optimizer" desc="Initialize strategy engine to identify cost savings and process efficiencies across the group." />
                ) : loading && activeTab === "strategy" ? (
                  <LoadingGrid />
                ) : (
                  strategyInsights && (
                    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 animate-in fade-in duration-500">
                      {strategyInsights.suggestions.map((item, idx) => (
                        <InsightCard key={idx} title={item.title} category={item.category} desc={item.description} impact={item.estimatedImpact} steps={item.actionableSteps} />
                      ))}
                    </div>
                  )
                )}
              </TabsContent>

              {/* Cash Flow Engine */}
              <TabsContent value="prediction" className="space-y-6">
                {!cashFlowInsights && !loading ? (
                  <EmptyInsight icon={TrendingUp} title="Cash Flow Predictor" desc="Forecast liquidity and identify potential shortages based on your upcoming payment vouchers." />
                ) : loading && activeTab === "prediction" ? (
                  <LoadingGrid />
                ) : (
                  cashFlowInsights && (
                    <div className="space-y-6 animate-in fade-in duration-500">
                      <Card className="glass border-primary/20 bg-primary/5 rounded-[2rem]">
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-primary" />
                            30-Day Liquidity Forecast
                          </CardTitle>
                          <CardDescription>{cashFlowInsights.predictionSummary}</CardDescription>
                        </CardHeader>
                      </Card>
                      <div className="grid gap-6 md:grid-cols-2">
                        <StatusCard 
                          title="Shortage Alert" 
                          status={cashFlowInsights.potentialShortageDetected ? "Detected" : "None"} 
                          color={cashFlowInsights.potentialShortageDetected ? "text-destructive" : "text-green-500"} 
                          desc="Predicted dips below zero cash threshold."
                        />
                        <StatusCard 
                          title="Surplus Opportunity" 
                          status={cashFlowInsights.potentialSurplusDetected ? "High" : "Optimal"} 
                          color="text-primary" 
                          desc="Periods of high liquidity for reinvestment."
                        />
                      </div>
                    </div>
                  )
                )}
              </TabsContent>

              {/* Audit Monitor Engine */}
              <TabsContent value="audit" className="space-y-6">
                {!anomalyResults.length && !loading ? (
                  <EmptyInsight icon={ShieldAlert} title="Audit Scanner" desc="Scan recent expenditures for anomalies, vague descriptions, or suspicious patterns." />
                ) : loading && activeTab === "audit" ? (
                  <LoadingGrid />
                ) : (
                  <div className="grid gap-4 animate-in fade-in duration-500">
                    {anomalyResults.map((item, idx) => (
                      <Card key={idx} className={cn(
                        "glass border-white/5 rounded-2xl p-6 flex flex-col md:flex-row justify-between items-start md:items-center gap-4",
                        item.analysis.isAnomaly ? "border-destructive/30 bg-destructive/5" : "border-green-500/10"
                      )}>
                        <div className="flex items-center gap-4">
                          <div className={cn("p-3 rounded-xl", item.analysis.isAnomaly ? "bg-destructive/10 text-destructive" : "bg-green-500/10 text-green-500")}>
                            {item.analysis.isAnomaly ? <AlertTriangle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
                          </div>
                          <div>
                            <p className="font-bold">{item.description}</p>
                            <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-bold">₹{item.amount.toLocaleString()} • {item.expenseCategory}</p>
                          </div>
                        </div>
                        <div className="flex-1 md:max-w-md">
                          <p className="text-xs text-muted-foreground leading-relaxed italic">"{item.analysis.reason}"</p>
                        </div>
                        <Badge variant="outline" className={cn(
                          "rounded-full px-4",
                          item.analysis.severity === "high" ? "bg-destructive text-destructive" : "text-muted-foreground"
                        )}>
                          Severity: {item.analysis.severity}
                        </Badge>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function InsightCard({ title, category, desc, impact, steps }: any) {
  return (
    <Card className="glass border-white/5 flex flex-col hover:scale-[1.02] ios-transition rounded-[2rem]">
      <CardHeader>
        <Badge variant="outline" className="w-fit mb-2 bg-primary/10 text-primary border-primary/20 text-[9px] tracking-widest uppercase font-bold px-3">
          {category}
        </Badge>
        <CardTitle className="text-lg leading-tight">{title}</CardTitle>
        {impact && (
          <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm mt-1">
            <TrendingDown className="h-4 w-4" />
            {impact.replace('$', '₹')}
          </div>
        )}
      </CardHeader>
      <CardContent className="flex-1 space-y-4">
        <p className="text-xs text-muted-foreground leading-relaxed">{desc}</p>
        {steps && (
          <div className="space-y-2">
            <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-primary">Next Steps</p>
            {steps.slice(0, 3).map((s: any, i: number) => (
              <div key={i} className="flex gap-2 text-[10px] text-muted-foreground italic">
                <span className="text-primary">•</span> {s}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function StatusCard({ title, status, color, desc }: any) {
  return (
    <Card className="glass border-white/5 rounded-[2rem] p-6">
      <p className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground mb-1">{title}</p>
      <p className={cn("text-2xl font-bold", color)}>{status}</p>
      <p className="text-xs text-muted-foreground mt-2">{desc}</p>
    </Card>
  );
}

function EmptyInsight({ icon: Icon, title, title: _title, desc }: any) {
  return (
    <Card className="glass border-white/5 border-dashed py-20 rounded-[3rem]">
      <CardContent className="flex flex-col items-center justify-center text-center gap-4">
        <div className="p-4 bg-primary/10 rounded-full">
          <Icon className="h-10 w-10 text-primary" />
        </div>
        <div className="max-w-md">
          <h2 className="text-xl font-bold">{title}</h2>
          <p className="text-muted-foreground mt-2 text-sm">{desc}</p>
        </div>
      </CardContent>
    </Card>
  );
}

function LoadingGrid() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {[1, 2, 3].map((i) => (
        <Card key={i} className="glass border-white/5 animate-pulse h-[300px] rounded-[2rem]" />
      ))}
    </div>
  );
}
