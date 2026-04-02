"use client";

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

const data = [
  { name: "Jan", revenue: 400000, expenses: 240000 },
  { name: "Feb", revenue: 300000, expenses: 139800 },
  { name: "Mar", revenue: 200000, expenses: 980000 },
  { name: "Apr", revenue: 278000, expenses: 390800 },
  { name: "May", revenue: 189000, expenses: 480000 },
  { name: "Jun", revenue: 239000, expenses: 380000 },
];

const stats = [
  {
    title: "Total Revenue",
    value: "₹1,28,44,300",
    change: "+12.5%",
    trend: "up",
    icon: IndianRupee,
  },
  {
    title: "Net Profit",
    value: "₹43,21,000",
    change: "+4.3%",
    trend: "up",
    icon: TrendingUp,
  },
  {
    title: "Project Costs",
    value: "₹85,23,300",
    change: "-2.1%",
    trend: "down",
    icon: Briefcase,
  },
  {
    title: "Cash Balance",
    value: "₹2.4 Cr",
    change: "+0.8%",
    trend: "up",
    icon: BarChart4,
  },
];

export default function Dashboard() {
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
              {stats.map((stat) => (
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
                      <span className="text-muted-foreground">since last month</span>
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
                    Revenue vs Expenses
                  </CardTitle>
                </CardHeader>
                <CardContent className="h-[350px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={data}>
                      <XAxis dataKey="name" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `₹${value/1000}k`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: 'rgba(0, 0, 0, 0.8)', borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', backdropFilter: 'blur(8px)', color: '#fff' }}
                        itemStyle={{ color: '#fff' }}
                        labelStyle={{ color: '#aaa' }}
                        formatter={(value) => [`₹${Number(value).toLocaleString()}`, '']}
                      />
                      <RechartsBar dataKey="revenue" fill="hsl(var(--primary))" radius={[6, 6, 0, 0]} barSize={20} />
                      <RechartsBar dataKey="expenses" fill="hsl(var(--accent))" radius={[6, 6, 0, 0]} barSize={20} />
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
                      { name: "Construction", value: "45%", color: "bg-primary" },
                      { name: "Hospitality", value: "25%", color: "bg-accent" },
                      { name: "Real Estate", value: "20%", color: "bg-yellow-600" },
                      { name: "Trading", value: "10%", color: "bg-stone-500" },
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
                    Recent Transactions
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      { title: "Material Supply", sub: "Steel Works Ltd", amount: "-₹1,24,000", time: "2h ago" },
                      { title: "Client Payment", sub: "Azure Tower Project", amount: "+₹4,50,000", time: "5h ago" },
                      { title: "Office Rent", sub: "Division HQ", amount: "-₹82,000", time: "1d ago" },
                      { title: "Service Revenue", sub: "Grand Plaza Hotel", amount: "+₹1,89,000", time: "1d ago" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0 last:pb-0">
                        <div>
                          <p className="text-sm font-semibold">{item.title}</p>
                          <p className="text-xs text-muted-foreground">{item.sub}</p>
                        </div>
                        <div className="text-right">
                          <p className={`text-sm font-bold ${item.amount.startsWith('+') ? 'text-green-500' : 'text-foreground'}`}>
                            {item.amount}
                          </p>
                          <p className="text-[10px] text-muted-foreground">{item.time}</p>
                        </div>
                      </div>
                    ))}
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
                      <p className="text-sm font-medium text-primary">Cash Flow Alert</p>
                      <p className="text-xs text-muted-foreground mt-1">Predicted shortage of ₹1,20,000 in the next 14 days due to upcoming tax liabilities.</p>
                    </div>
                    <div className="p-3 rounded-2xl bg-accent/5 border border-accent/10">
                      <p className="text-sm font-medium text-accent">Optimization Hint</p>
                      <p className="text-xs text-muted-foreground mt-1">Switching logistics vendors for the Trading division could save up to 15% monthly.</p>
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
