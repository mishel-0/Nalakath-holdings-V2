"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Filter, CheckCircle2, MoreHorizontal, Pencil, Trash2, BookOpen } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, setDoc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDivision } from "@/context/DivisionContext";

export default function AccountingPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { activeDivision } = useDivision();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingEntry, setEditingEntry] = useState<any>(null);
  const [search, setSearch] = useState("");
  const companyId = activeDivision.id;

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

  const syncBackToSource = (entryData: any) => {
    if (entryData.sourceModule === "Expenses" && entryData.sourceId) {
      const expenseRef = doc(db, "companies", companyId, "expenses", entryData.sourceId);
      const updatedExpense = {
        amount: entryData.totalDebit || entryData.totalCredit,
        expenseDate: entryData.date,
        description: entryData.description.replace(/^\[.*?\]\s/, ''),
        updatedAt: new Date().toISOString(),
      };
      updateDocumentNonBlocking(expenseRef, updatedExpense);
    }
  };

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
      postedByUserId: "manual_entry",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "journalEntries"), newEntry);
    setIsAddOpen(false);
    toast({ title: "Entry Posted", description: `Journal entry recorded for ${activeDivision.name}.` });
  };

  const handleUpdateEntry = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingEntry) return;

    const formData = new FormData(e.currentTarget);
    const amount = Number(formData.get("amount"));
    const type = formData.get("type");

    const updatedData = {
      ...editingEntry,
      date: formData.get("date") as string,
      description: formData.get("description") as string,
      totalDebit: type === "Debit" ? amount : 0,
      totalCredit: type === "Credit" ? amount : 0,
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "journalEntries", editingEntry.id), updatedData);
    syncBackToSource(updatedData);
    setEditingEntry(null);
    toast({ title: "Entry Updated", description: "Ledger and original operational record synced." });
  };

  const handleDeleteEntry = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "journalEntries", id));
    toast({ variant: "destructive", title: "Entry Deleted", description: "Ledger entry removed." });
  };

  return (
    <>
      <div className="flex flex-col gap-8">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">General Ledger</h1>
            <p className="text-muted-foreground truncate">Financial activity for {activeDivision.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5 h-10 px-4">
              <Download className="h-4 w-4" /> Export
            </Button>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-10 px-4">
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
                    <Input id="description" name="description" required className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" name="amount" type="number" required className="bg-white/5 border-white/10 rounded-xl" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Type</Label>
                      <Select name="type" defaultValue="Debit">
                        <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="Debit">Debit (+)</SelectItem>
                          <SelectItem value="Credit">Credit (-)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="date">Date</Label>
                    <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Post Entry</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="grid gap-4 sm:grid-cols-3">
          <SummaryCard title="Total Debits" value={totals.debit} color="text-foreground" />
          <SummaryCard title="Total Credits" value={totals.credit} color="text-primary" />
          <SummaryCard title="Net Balance" value={totals.credit - totals.debit} color={totals.credit >= totals.debit ? "text-green-500" : "text-destructive"} />
        </div>

        <Card className="gold-glass control-center-card overflow-hidden">
          <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input 
                placeholder="Search ledger..." 
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 h-10 rounded-full border-white/10 bg-white/5" 
              />
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-white/5">
                <TableRow className="border-white/5 hover:bg-transparent">
                  <TableHead className="w-32 uppercase tracking-widest text-[10px] font-bold px-6">Date</TableHead>
                  <TableHead className="uppercase tracking-widest text-[10px] font-bold">Description</TableHead>
                  <TableHead className="text-right uppercase tracking-widest text-[10px] font-bold">Debit (₹)</TableHead>
                  <TableHead className="text-right uppercase tracking-widest text-[10px] font-bold">Credit (₹)</TableHead>
                  <TableHead className="w-16"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-mono tracking-widest">SYNCING...</TableCell></TableRow>
                ) : filteredEntries.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No entries found for this division.</TableCell></TableRow>
                ) : (
                  filteredEntries.map((tx) => (
                    <TableRow key={tx.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                      <TableCell className="text-muted-foreground font-mono text-xs px-6">{tx.date}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold truncate max-w-[200px]">{tx.description}</span>
                          {tx.status === "Verified" && <CheckCircle2 className="h-3 w-3 text-primary opacity-50 shrink-0" />}
                          {tx.sourceModule && <Badge variant="outline" className="text-[8px] uppercase tracking-tighter border-white/10 opacity-50">{tx.sourceModule}</Badge>}
                        </div>
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-destructive truncate">
                        {tx.totalDebit > 0 ? `₹${tx.totalDebit.toLocaleString('en-IN')}` : "-"}
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium text-green-500 truncate">
                        {tx.totalCredit > 0 ? `₹${tx.totalCredit.toLocaleString('en-IN')}` : "-"}
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="glass">
                            <DropdownMenuItem onClick={() => setEditingEntry(tx)} className="text-xs cursor-pointer">
                              <Pencil className="h-3 w-3 mr-2" /> Edit Entry
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDeleteEntry(tx.id)} className="text-xs text-destructive cursor-pointer">
                              <Trash2 className="h-3 w-3 mr-2" /> Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      <Dialog open={!!editingEntry} onOpenChange={(open) => !open && setEditingEntry(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Journal Entry</DialogTitle>
          </DialogHeader>
          {editingEntry && (
            <form onSubmit={handleUpdateEntry} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-description">Description</Label>
                <Input id="edit-description" name="description" defaultValue={editingEntry.description} required className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-amount">Amount (₹)</Label>
                  <Input id="edit-amount" name="amount" type="number" defaultValue={editingEntry.totalDebit || editingEntry.totalCredit} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-type">Type</Label>
                  <Select name="type" defaultValue={editingEntry.totalDebit > 0 ? "Debit" : "Credit"}>
                    <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="Debit">Debit (+)</SelectItem>
                      <SelectItem value="Credit">Credit (-)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-date">Date</Label>
                <Input id="edit-date" name="date" type="date" defaultValue={editingEntry.date} required className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Update Entry</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

function SummaryCard({ title, value, color }: any) {
  return (
    <Card className="gold-glass control-center-card py-4 min-w-0">
      <CardContent className="p-6 flex flex-col gap-1 overflow-hidden">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground truncate">{title}</p>
        <p className={`text-xl md:text-2xl font-bold font-mono truncate ${color}`} title={Math.abs(value).toLocaleString('en-IN')}>
          ₹{Math.abs(value).toLocaleString('en-IN')}
        </p>
      </CardContent>
    </Card>
  );
}
