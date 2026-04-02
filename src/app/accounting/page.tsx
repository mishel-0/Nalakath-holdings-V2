"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Filter, CheckCircle2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";

export default function AccountingPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const companyId = "nalakath-holdings-main";

  const entriesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "journalEntries"), orderBy("date", "desc"));
  }, [db, companyId]);

  const { data: entries, isLoading } = useCollection(entriesQuery);

  const filteredEntries = useMemo(() => {
    if (!entries) return [];
    return entries.filter(e => 
      e.description?.toLowerCase().includes(search.toLowerCase())
    );
  }, [entries, search]);

  const totals = useMemo(() => {
    if (!entries) return { debit: 0, credit: 0 };
    return entries.reduce((acc, tx) => ({
      debit: acc.debit + (tx.totalDebit || 0),
      credit: acc.credit + (tx.totalCredit || 0)
    }), { debit: 0, credit: 0 });
  }, [entries]);

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
      postedByUserId: "admin",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "journalEntries"), newEntry);
    setIsAddOpen(false);
    toast({ title: "Entry Posted", description: "Journal entry has been recorded in the general ledger." });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">General Ledger</h1>
                <p className="text-muted-foreground">Comprehensive record of group financial activity.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5">
                  <Download className="h-4 w-4" /> Export Ledger
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2 gold-gradient text-black font-bold">
                      <Plus className="h-4 w-4" /> Post Entry
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>New Journal Entry</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddEntry} className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="description">Transaction Details</Label>
                        <Input id="description" name="description" placeholder="e.g. Office Rent Payment" required className="bg-white/5 rounded-xl border-white/10" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input id="amount" name="amount" type="number" required className="bg-white/5 rounded-xl border-white/10" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="type">Transaction Type</Label>
                          <Select name="type" defaultValue="Debit">
                            <SelectTrigger className="bg-white/5 rounded-xl border-white/10">
                              <SelectValue placeholder="Select type" />
                            </SelectTrigger>
                            <SelectContent className="glass">
                              <SelectItem value="Debit">Debit (+)</SelectItem>
                              <SelectItem value="Credit">Credit (-)</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Posting Date</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 rounded-xl border-white/10" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Post to Ledger</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            {/* Account Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-3">
              <SummaryCard title="Total Debits" value={totals.debit} color="text-foreground" />
              <SummaryCard title="Total Credits" value={totals.credit} color="text-primary" />
              <SummaryCard title="Net Balance" value={totals.credit - totals.debit} color={totals.credit >= totals.debit ? "text-green-500" : "text-destructive"} />
            </div>

            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4">
                <div className="flex flex-col sm:flex-row items-center gap-4">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input 
                      placeholder="Search transactions..." 
                      value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="pl-9 h-10 rounded-full border-white/10 bg-white/5 focus-visible:ring-primary/30" 
                    />
                  </div>
                  <Button variant="ghost" size="sm" className="rounded-full gap-2 text-xs">
                    <Filter className="h-3 w-3" /> Filters
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-32 uppercase tracking-widest text-[10px] font-bold">Date</TableHead>
                      <TableHead className="uppercase tracking-widest text-[10px] font-bold">Description</TableHead>
                      <TableHead className="text-right uppercase tracking-widest text-[10px] font-bold">Debit (₹)</TableHead>
                      <TableHead className="text-right uppercase tracking-widest text-[10px] font-bold">Credit (₹)</TableHead>
                      <TableHead className="text-center uppercase tracking-widest text-[10px] font-bold">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-mono tracking-widest">SYNCING LEDGER...</TableCell></TableRow>
                    ) : filteredEntries.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No ledger entries found.</TableCell></TableRow>
                    ) : (
                      filteredEntries.map((tx) => (
                        <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                          <TableCell className="text-muted-foreground font-mono text-xs">{tx.date}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span className="font-semibold">{tx.description}</span>
                              {tx.status === "Verified" && <CheckCircle2 className="h-3 w-3 text-primary opacity-50" />}
                            </div>
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-destructive">
                            {tx.totalDebit > 0 ? `₹${tx.totalDebit.toLocaleString('en-IN')}` : "-"}
                          </TableCell>
                          <TableCell className="text-right font-mono font-medium text-green-500">
                            {tx.totalCredit > 0 ? `₹${tx.totalCredit.toLocaleString('en-IN')}` : "-"}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className="rounded-full text-[9px] bg-primary/10 text-primary border-primary/20 px-2 py-0 h-5" variant="outline">
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
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}

function SummaryCard({ title, value, color }: any) {
  return (
    <Card className="glass border-white/5 py-4">
      <CardContent className="p-6 flex flex-col gap-1">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{title}</p>
        <p className={`text-2xl font-bold font-mono ${color}`}>₹{Math.abs(value).toLocaleString('en-IN')}</p>
      </CardContent>
    </Card>
  );
}