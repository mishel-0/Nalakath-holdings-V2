"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Download, ArrowUpDown } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

const transactions = [
  { id: "TX-9021", date: "Oct 24, 2023", desc: "Consultancy Services", category: "Revenue", account: "Checking", debit: "5,00,000.00", credit: "-", status: "Verified" },
  { id: "TX-9022", date: "Oct 24, 2023", desc: "Software Subscription", category: "Expense", account: "Credit Card", debit: "-", credit: "24,900.00", status: "Verified" },
  { id: "TX-9023", date: "Oct 25, 2023", desc: "Raw Material - Steel", category: "Cost of Goods", account: "Savings", debit: "-", credit: "12,40,000.00", status: "Pending" },
  { id: "TX-9024", date: "Oct 25, 2023", desc: "Quarterly Rental Income", category: "Revenue", account: "Checking", debit: "3,50,000.00", credit: "-", status: "Verified" },
  { id: "TX-9025", date: "Oct 26, 2023", desc: "Utilities Bill", category: "Operating Expense", account: "Checking", debit: "-", credit: "12,000.00", status: "Verified" },
];

export default function AccountingPage() {
  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-20 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">General Ledger</h1>
                <p className="text-muted-foreground">Detailed record of all company financial transactions.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 backdrop-blur-sm border-white/10 hover:bg-white/5">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
                <Button className="rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90">
                  <Plus className="h-4 w-4" />
                  New Entry
                </Button>
              </div>
            </header>

            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search transactions..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-white/5">
                      <Filter className="h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="ghost" size="sm" className="rounded-full gap-2 hover:bg-white/5">
                      <ArrowUpDown className="h-4 w-4" />
                      Sort
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="hover:bg-transparent border-white/5">
                      <TableHead className="w-[120px] font-semibold text-foreground">Date</TableHead>
                      <TableHead className="font-semibold text-foreground">Description</TableHead>
                      <TableHead className="font-semibold text-foreground">Category</TableHead>
                      <TableHead className="font-semibold text-foreground">Account</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Debit (₹)</TableHead>
                      <TableHead className="text-right font-semibold text-foreground">Credit (₹)</TableHead>
                      <TableHead className="text-center font-semibold text-foreground">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((tx) => (
                      <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 ios-transition">
                        <TableCell className="font-medium text-muted-foreground">{tx.date}</TableCell>
                        <TableCell className="font-semibold">{tx.desc}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-white/5 border-white/10 text-xs font-normal">
                            {tx.category}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">{tx.account}</TableCell>
                        <TableCell className="text-right font-mono font-medium text-green-500">{tx.debit}</TableCell>
                        <TableCell className="text-right font-mono font-medium">{tx.credit}</TableCell>
                        <TableCell className="text-center">
                          <Badge className={cn(
                            "rounded-full text-[10px] px-2",
                            tx.status === "Verified" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                          )} variant="outline">
                            {tx.status}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Net Position</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono">₹2,43,90,140</div>
                  <p className="text-xs text-muted-foreground mt-1">+1.2% vs last month</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Unreconciled</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-orange-500">12 Items</div>
                  <p className="text-xs text-muted-foreground mt-1">Total value: ₹1,42,000</p>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Audit Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold font-mono text-green-500">98/100</div>
                  <p className="text-xs text-muted-foreground mt-1">Last scan: 4 hours ago</p>
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
