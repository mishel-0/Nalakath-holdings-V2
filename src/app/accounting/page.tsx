
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";

export default function AccountingPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const companyId = "nalakath-holdings-main";

  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "journalEntries"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: entries, isLoading } = useCollection(entriesQuery);

  const handleAddEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const amount = Number(formData.get("amount"));
    const type = formData.get("type");

    const newEntry = {
      companyId,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      status: "Verified",
      totalDebit: type === "Debit" ? amount : 0,
      totalCredit: type === "Credit" ? amount : 0,
      postedByUserId: "system-admin",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "journalEntries"), newEntry);
    setIsAddOpen(false);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">General Ledger</h1>
                <p className="text-muted-foreground">Detailed record of all company financial transactions.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 border-white/10">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                      <Plus className="h-4 w-4" /> New Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Add Journal Entry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddEntry} className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="description">Description</Label>
                        <Input id="description" name="description" placeholder="Transaction details..." required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input id="amount" name="amount" type="number" required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="type">Type</Label>
                          <Select name="type" defaultValue="Debit">
                            <SelectTrigger>
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Debit">Debit (+)</SelectItem>
                              <SelectItem value="Credit">Credit (-)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Transaction Date</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full text-black">Post Entry</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Search ledger..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Debit (₹)</TableHead>
                      <TableHead className="text-right">Credit (₹)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : entries?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No ledger entries yet.</TableCell></TableRow>
                    ) : (
                      entries?.map((tx) => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 ios-transition">
                          <TableCell className="text-muted-foreground">{tx.date}</TableCell>
                          <TableCell className="font-semibold">{tx.description}</TableCell>
                          <TableCell className="text-right font-mono font-medium text-green-500">
                            {tx.totalDebit > 0 ? `+${tx.totalDebit.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-destructive">
                            {tx.totalCredit > 0 ? `-${tx.totalCredit.toLocaleString()}` : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="rounded-full text-[10px] bg-green-500/10 text-green-500 border-green-500/20" variant="outline">
                              {tx.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Liquidity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">₹2.4 Cr</div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Audit Score</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono text-green-500">98/100</div>
                </CardContent>
              </Card>
              <Card className="glass border-white/5">
                <CardHeader className="pb-2">
                  <CardTitle className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Entries</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold font-mono">{entries?.length || 0}</div>
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
