
"use client";

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

const data = [
  { name: "Apr", revenue: 4000000, expenses: 2400000 },
  { name: "May", revenue: 3000000, expenses: 1398000 },
  { name: "Jun", revenue: 2000000, expenses: 9800000 },
  { name: "Jul", revenue: 2780000, expenses: 3908000 },
  { name: "Aug", revenue: 1890000, expenses: 4800000 },
  { name: "Sep", revenue: 5390000, expenses: 3800000 },
];

export default function ReportsPage() {
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
                <p className="text-muted-foreground">Quarterly performance and fiscal auditing.</p>
              </div>
              <Button variant="outline" className="rounded-full gap-2 border-white/10">
                <FileDown className="h-4 w-4" /> Download PDF
              </Button>
            </header>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">EBITDA</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">₹4,32,10,000</div>
                  <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3" /> +15.4%
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">OPEX</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-destructive">₹1,85,23,300</div>
                  <div className="flex items-center gap-1 text-xs text-destructive mt-1">
                    <TrendingUp className="h-3 w-3" /> +2.1%
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm text-muted-foreground">Net Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">₹2.4 Cr</div>
                  <div className="flex items-center gap-1 text-xs text-green-500 mt-1">
                    <TrendingUp className="h-3 w-3" /> Healthy
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card className="glass border-white/5 h-[450px]">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-primary" />
                  Revenue Trends (FY 24-25)
                </CardTitle>
              </CardHeader>
              <CardContent className="h-full">
                <ResponsiveContainer width="100%" height="80%">
                  <AreaChart data={data}>
                    <defs>
                      <linearGradient id="colorRev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
                    <XAxis dataKey="name" stroke="#555" fontSize={12} tickLine={false} axisLine={false} />
                    <YAxis stroke="#555" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(val) => `₹${val/1000000}M`} />
                    <Tooltip 
                      contentStyle={{ backgroundColor: 'black', border: '1px solid #333', borderRadius: '12px' }}
                      itemStyle={{ color: 'hsl(var(--primary))' }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRev)" strokeWidth={3} />
                  </AreaChart>
                </ResponsiveContainer>
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
                    {[
                      { name: "Direct Material", val: 55, color: "bg-primary" },
                      { name: "Labor Cost", val: 25, color: "bg-accent" },
                      { name: "Overheads", val: 15, color: "bg-muted" },
                      { name: "Others", val: 5, color: "bg-white/10" },
                    ].map((item) => (
                      <div key={item.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className={`h-3 w-3 rounded-full ${item.color}`} />
                          <span className="text-sm font-medium">{item.name}</span>
                        </div>
                        <span className="text-sm text-muted-foreground">{item.val}%</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-primary">
                    <TrendingUp className="h-5 w-5" />
                    Growth Indicators
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Based on current performance across <span className="text-foreground font-bold">Nalakath Construction</span> and <span className="text-foreground font-bold">Green Villa</span>, the group is projected to see a 12% revenue growth in Q3. Operational efficiencies in construction supply chain have reduced material wastage by 4.5%.
                  </p>
                  <Button variant="link" className="text-primary p-0 mt-4">View Detailed Audit Log</Button>
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
