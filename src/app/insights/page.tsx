
"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Sparkles, 
  TrendingDown, 
  AlertTriangle, 
  Target, 
  Zap,
  ArrowRight,
  RefreshCcw,
  CheckCircle2
} from "lucide-react";
import { 
  costOptimizationSuggestions, 
  type CostOptimizationSuggestionsOutput,
  type CostOptimizationSuggestionsInput
} from "@/ai/flows/cost-optimization-suggestions";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query } from "firebase/firestore";

export default function InsightsPage() {
  const db = useFirestore();
  const companyId = "nalakath-holdings-main";
  const [loading, setLoading] = useState(false);
  const [insights, setInsights] = useState<CostOptimizationSuggestionsOutput | null>(null);

  // Fetch real data for AI analysis
  const vouchersQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "vouchers")), [db]);
  const expensesQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "expenses")), [db]);
  const projectsQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "projects")), [db]);
  const ledgerQuery = useMemoFirebase(() => query(collection(db, "companies", companyId, "journalEntries")), [db]);

  const { data: vouchers } = useCollection(vouchersQuery);
  const { data: expenses } = useCollection(expensesQuery);
  const { data: projects } = useCollection(projectsQuery);
  const { data: ledger } = useCollection(ledgerQuery);

  const generateInsights = async () => {
    setLoading(true);
    try {
      // Aggregate real financial data
      const totalRevenue = ledger?.reduce((acc, tx) => acc + (tx.totalCredit || 0), 0) || 0;
      const totalExpenses = expenses?.reduce((acc, exp) => acc + (exp.amount || 0), 0) || 0;
      const netProfit = totalRevenue - totalExpenses;
      const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;

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

      const projectSummary = projects?.map(p => ({
        projectName: p.name,
        budget: p.budgetAmount,
        actualSpent: p.actualCost,
        variance: p.budgetAmount - p.actualCost,
        status: p.status
      })) || [];

      const input: CostOptimizationSuggestionsInput = {
        companyName: "Nalakath Holdings",
        financialSummary: {
          netProfit,
          totalRevenue,
          totalExpenses,
          profitMargin
        },
        spendingAnalysis: {
          topExpenseCategories: topCategories,
          projectSpendingOverview: projectSummary
        }
      };

      const result = await costOptimizationSuggestions(input);
      setInsights(result);
    } catch (error) {
      console.error("Failed to generate insights:", error);
    } finally {
      setLoading(false);
    }
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
                <p className="text-muted-foreground">Smart business insights generated from your live financial data.</p>
              </div>
              <Button 
                onClick={generateInsights} 
                disabled={loading}
                className="rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-black"
              >
                {loading ? <RefreshCcw className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                {insights ? "Refresh Insights" : "Generate Insights"}
              </Button>
            </header>

            {!insights && !loading ? (
              <Card className="glass border-white/5 border-dashed py-20">
                <CardContent className="flex flex-col items-center justify-center text-center gap-4">
                  <div className="p-4 bg-primary/10 rounded-full">
                    <Zap className="h-10 w-10 text-primary" />
                  </div>
                  <div className="max-w-md">
                    <h2 className="text-xl font-bold">Unlocking Profit Potential</h2>
                    <p className="text-muted-foreground mt-2">Our AI analyzes your real-time spending patterns across all divisions to find hidden efficiencies.</p>
                  </div>
                  <Button onClick={generateInsights} className="rounded-full mt-4 text-black">Start Analysis</Button>
                </CardContent>
              </Card>
            ) : null}

            {loading && (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {[1, 2, 3].map((i) => (
                  <Card key={i} className="glass border-white/5 animate-pulse h-[300px]">
                    <div className="p-6 space-y-4">
                      <div className="h-4 w-1/3 bg-white/10 rounded" />
                      <div className="h-8 w-2/3 bg-white/10 rounded" />
                      <div className="space-y-2">
                        <div className="h-4 w-full bg-white/10 rounded" />
                        <div className="h-4 w-5/6 bg-white/10 rounded" />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}

            {insights && (
              <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
                <section className="p-6 glass rounded-3xl border-primary/20 bg-primary/5">
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-primary rounded-2xl">
                      <Sparkles className="h-6 w-6 text-black" />
                    </div>
                    <div>
                      <h2 className="text-xl font-bold">Executive Summary</h2>
                      <p className="text-muted-foreground mt-1">{insights.overallSummary || "Comprehensive analysis of live Nalakath Holdings data complete."}</p>
                    </div>
                  </div>
                </section>

                <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {insights.suggestions.map((suggestion, idx) => (
                    <Card key={idx} className="glass border-white/5 flex flex-col hover:scale-[1.02] ios-transition">
                      <CardHeader>
                        <Badge variant="outline" className="w-fit mb-2 bg-primary/10 text-primary border-primary/20">
                          {suggestion.category}
                        </Badge>
                        <CardTitle className="text-lg leading-tight">{suggestion.title}</CardTitle>
                        {suggestion.estimatedImpact && (
                          <div className="flex items-center gap-1.5 text-green-500 font-bold text-sm mt-1">
                            <TrendingDown className="h-4 w-4" />
                            {suggestion.estimatedImpact.replace('$', '₹')}
                          </div>
                        )}
                      </CardHeader>
                      <CardContent className="flex-1">
                        <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
                          {suggestion.description.replace('$', '₹')}
                        </p>
                        {suggestion.actionableSteps && (
                          <div className="space-y-2">
                            <p className="text-xs font-bold uppercase tracking-wider text-primary">Recommended Steps</p>
                            {suggestion.actionableSteps.map((step, sIdx) => (
                              <div key={sIdx} className="flex items-start gap-2 group">
                                <div className="mt-1 h-3 w-3 rounded-full border border-primary/30 flex items-center justify-center shrink-0">
                                  <div className="h-1 w-1 bg-primary rounded-full opacity-0 group-hover:opacity-100 ios-transition" />
                                </div>
                                <span className="text-xs text-muted-foreground leading-normal">{step}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </CardContent>
                      <div className="p-6 pt-0 mt-auto">
                        <Button variant="ghost" className="w-full justify-between rounded-full group">
                          Implement Strategy
                          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 ios-transition" />
                        </Button>
                      </div>
                    </Card>
                  ))}
                </div>

                <div className="grid gap-6 lg:grid-cols-2">
                   <Card className="glass border-white/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-orange-500" />
                          Risk Radar
                        </CardTitle>
                        <CardDescription>Potentially identified financial risks in current operations.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                          {!ledger?.length ? (
                            <p className="text-xs text-muted-foreground">No ledger data to analyze risks.</p>
                          ) : (
                            <div className="flex items-center gap-3 p-3 rounded-2xl bg-orange-500/5 border border-orange-500/10">
                              <div className="h-2 w-2 rounded-full bg-orange-500" />
                              <div className="flex-1">
                                <p className="text-sm font-semibold">Ledger Activity Detected</p>
                                <p className="text-xs text-muted-foreground">Monitoring active transactions for unusual variances in material costs.</p>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                   </Card>

                   <Card className="glass border-white/5">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Target className="h-5 w-5 text-green-500" />
                          Growth Targets
                        </CardTitle>
                        <CardDescription>AI-driven opportunities for increasing division revenue.</CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-4">
                           <div className="flex items-center justify-between p-3 rounded-2xl bg-green-500/5 border border-green-500/10">
                             <div className="flex items-center gap-3">
                               <CheckCircle2 className="h-5 w-5 text-green-500" />
                               <div>
                                 <p className="text-sm font-semibold">Division Integration</p>
                                 <p className="text-xs text-muted-foreground">Unified tracking across all {projects?.length || 0} active projects.</p>
                               </div>
                             </div>
                           </div>
                        </div>
                      </CardContent>
                   </Card>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
