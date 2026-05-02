"use client";

import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Plus, 
  Search, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  FileText, 
  Printer, 
  X,
  CheckCircle2,
  Clock,
  FolderPlus,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, deleteDoc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

// EXECUTIVE COLORS FROM PYTHON MODEL
const DARK = "#0C0A07";
const GOLD = "#C9A84C";
const GOLD3 = "#F0E4B8";
const STRIPE = "#F7F2E8";
const MID = "#6B5C42";
const BORDER = "#CEBB8A";



export default function ExpensesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { activeDivision } = useDivision();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPhaseOpen, setIsPhaseOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const [selectedPhaseId, setSelectedPhaseId] = useState("all");
  const [search, setSearch] = useState("");
  const companyId = activeDivision.id;

  const phasesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "phases"), orderBy("createdAt", "asc"));
  }, [db, companyId]);

  const expensesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "expenses"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: phases } = useCollection(phasesQuery);
  const { data: expenses, isLoading: isExpensesLoading } = useCollection(expensesQuery);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    let filtered = expenses;
    if (selectedPhaseId !== "all") {
      filtered = filtered.filter(e => e.phaseId === selectedPhaseId);
    }
    if (activeTab !== "all") {
      filtered = filtered.filter(e => e.expenseType === activeTab);
    }
    if (search) {
      filtered = filtered.filter(e => 
        e.description?.toLowerCase().includes(search.toLowerCase()) || 
        e.clientName?.toLowerCase().includes(search.toLowerCase())
      );
    }
    return filtered;
  }, [expenses, selectedPhaseId, activeTab, search]);

  const handleAddPhase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    addDocumentNonBlocking(collection(db, "companies", companyId, "phases"), {
      name: formData.get("name") as string,
      createdAt: now,
    });
    setIsPhaseOpen(false);
    toast({ title: "Phase Created", description: `Initialized ${formData.get("name")} phase.` });
  };

  const handleUpdatePhase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPhase) return;
    const formData = new FormData(e.currentTarget);
    updateDocumentNonBlocking(doc(db, "companies", companyId, "phases", editingPhase.id), {
      name: formData.get("name") as string,
    });
    setEditingPhase(null);
    toast({ title: "Phase Updated", description: "Phase modified successfully." });
  };

  const handleDeletePhase = (id: string) => {
    deleteDoc(doc(db, "companies", companyId, "phases", id));
    if (selectedPhaseId === id) setSelectedPhaseId("all");
    toast({ variant: "destructive", title: "Phase Deleted", description: "Phase removed." });
  };

  const syncToLedger = (expId: string, data: any, isDelete = false) => {
    const ledgerRef = doc(db, "companies", companyId, "journalEntries", expId);
    if (isDelete) {
      deleteDoc(ledgerRef);
      return;
    }

    const journalEntry = {
      companyId,
      date: data.expenseDate,
      description: `[${data.expenseType}] ${data.description} - ${data.clientName || 'General'}`,
      status: "Verified",
      totalDebit: data.expenseType === "Client Invoice" ? 0 : data.amount,
      totalCredit: data.expenseType === "Client Invoice" ? data.amount : 0,
      postedByUserId: "system_sync",
      sourceModule: "Expenses",
      sourceId: expId,
      updatedAt: new Date().toISOString(),
    };

    setDoc(ledgerRef, journalEntry, { merge: true });
  };

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const expId = Math.random().toString(36).substring(7);
    
    const newExpense = {
      id: expId,
      companyId,
      phaseId: formData.get("phaseId") as string,
      expenseDate: formData.get("date") as string,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      expenseCategory: formData.get("category") as string,
      expenseType: formData.get("expenseType") as string,
      clientName: formData.get("clientName") || "",
      clientGstin: formData.get("clientGstin") || "",
      invoiceNumber: formData.get("invoiceNumber") || "",
      status: formData.get("status") || "Unpaid",
      createdAt: now,
      updatedAt: now,
    };

    setDoc(doc(db, "companies", companyId, "expenses", expId), newExpense);
    syncToLedger(expId, newExpense);
    setIsAddOpen(false);
    toast({ title: "Entry Logged", description: "Record saved and synced to Ledger." });
  };

  const handleUpdateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      ...editingExpense,
      phaseId: formData.get("phaseId") as string,
      expenseDate: formData.get("date") as string,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      expenseCategory: formData.get("category") as string,
      expenseType: formData.get("expenseType"),
      clientName: formData.get("clientName") || "",
      clientGstin: formData.get("clientGstin") || "",
      invoiceNumber: formData.get("invoiceNumber") || "",
      status: formData.get("status"),
      updatedAt: new Date().toISOString(),
    };

    setDoc(doc(db, "companies", companyId, "expenses", editingExpense.id), updatedData);
    syncToLedger(editingExpense.id, updatedData);
    setEditingExpense(null);
    toast({ title: "Entry Updated", description: "Record modified successfully." });
  };

  const handleDeleteExpense = (id: string) => {
    deleteDoc(doc(db, "companies", companyId, "expenses", id));
    syncToLedger(id, null, true);
    toast({ variant: "destructive", title: "Record Deleted", description: "Entry removed." });
  };



  return (
    <main className="flex-1 px-4 py-8 md:pl-80 md:pr-12 md:pt-32 mb-24 md:mb-0 overflow-hidden">
      <div className="flex flex-col gap-8 max-w-7xl mx-auto">
        <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="min-w-0">
            <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">Financial Ops</h1>
            <p className="text-muted-foreground truncate">Phase-based ledger for {activeDivision.name}.</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isPhaseOpen} onOpenChange={setIsPhaseOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5 h-11 px-6">
                  <FolderPlus className="h-4 w-4" /> New Phase
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 sm:max-w-[400px]">
                <DialogHeader>
                  <DialogTitle>Add Project Phase</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddPhase} className="space-y-4 py-4">
                  <div className="grid gap-2">
                    <Label>Phase Name</Label>
                    <Input name="name" placeholder="e.g. Phase 1: Planning" required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Create Phase</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>

            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-11 px-6 shadow-lg shadow-primary/20 shrink-0">
                  <Plus className="h-4 w-4" /> New Entry
                </Button>
              </DialogTrigger>
              <DialogContent className="glass border-white/10 sm:max-w-[500px]">
                <DialogHeader>
                  <DialogTitle>Log Operational Entry</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Assigned Phase</Label>
                      <Select name="phaseId" required>
                        <SelectTrigger>
                          <SelectValue placeholder="Select Phase" />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          {phases?.map(p => (
                            <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Type</Label>
                      <Select name="expenseType" defaultValue="General">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="General">General Expense</SelectItem>
                          <SelectItem value="Client Invoice">Client Invoice</SelectItem>
                          <SelectItem value="Supplier Payment">Supplier Payment</SelectItem>
                          <SelectItem value="Labour Payment">Labour Payment</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Status</Label>
                      <Select name="status" defaultValue="Unpaid">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="glass">
                          <SelectItem value="Paid">Paid</SelectItem>
                          <SelectItem value="Unpaid">Unpaid</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid gap-2">
                      <Label>Date</Label>
                      <Input name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                  </div>

                  <div className="grid gap-2">
                    <Label>Description</Label>
                    <Input name="description" required placeholder="Description of work" />
                  </div>

                  <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                    <p className="text-[10px] uppercase font-bold tracking-widest text-primary">Contextual Details</p>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label className="text-[10px]">Entity Name</Label>
                        <Input name="clientName" placeholder="Client/Vendor" />
                      </div>
                      <div className="grid gap-2">
                        <Label className="text-[10px]">Reference #</Label>
                        <Input name="invoiceNumber" placeholder="INV-000" />
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label className="text-[10px]">GSTIN</Label>
                      <Input name="clientGstin" placeholder="GST Registration No." />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid gap-2">
                      <Label>Amount (₹)</Label>
                      <Input name="amount" type="number" step="0.01" required />
                    </div>
                    <div className="grid gap-2">
                      <Label>Category</Label>
                      <Input name="category" placeholder="Operational, etc." required />
                    </div>
                  </div>

                  <DialogFooter>
                    <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl mt-2">Initialize Record</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </header>

        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <Button 
              variant={selectedPhaseId === "all" ? "default" : "outline"} 
              onClick={() => setSelectedPhaseId("all")}
              className={cn("rounded-full h-10 px-6 shrink-0", selectedPhaseId === "all" ? "gold-gradient text-black border-none" : "border-white/10")}
            >
              All Phases
            </Button>
            {phases?.map(p => (
              <div key={p.id} className="flex items-center gap-1 shrink-0 group">
                <Button 
                  variant={selectedPhaseId === p.id ? "default" : "outline"} 
                  onClick={() => setSelectedPhaseId(p.id)}
                  className={cn("rounded-full h-10 px-6", selectedPhaseId === p.id ? "gold-gradient text-black border-none" : "border-white/10")}
                >
                  {p.name}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full opacity-0 group-hover:opacity-100 ios-transition">
                      <MoreHorizontal className="h-3 w-3" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="glass">
                    <DropdownMenuItem onClick={() => setEditingPhase(p)} className="text-xs cursor-pointer">
                      <Pencil className="h-3 w-3 mr-2" /> Rename
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleDeletePhase(p.id)} className="text-xs text-destructive cursor-pointer">
                      <Trash2 className="h-3 w-3 mr-2" /> Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ))}
          </div>

          <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
            <TabsList className="glass p-1 rounded-full h-12 w-fit mb-8 border-white/10 overflow-x-auto max-w-full">
              <TabsTrigger value="all" className="rounded-full px-6 text-[10px] uppercase font-bold tracking-widest">Total Feed</TabsTrigger>
              <TabsTrigger value="Client Invoice" className="rounded-full px-6 text-[10px] uppercase font-bold tracking-widest">Client Invoices</TabsTrigger>
              <TabsTrigger value="Supplier Payment" className="rounded-full px-6 text-[10px] uppercase font-bold tracking-widest">Suppliers</TabsTrigger>
              <TabsTrigger value="Labour Payment" className="rounded-full px-6 text-[10px] uppercase font-bold tracking-widest">Labour</TabsTrigger>
            </TabsList>

            <Card className="gold-glass control-center-card overflow-hidden rounded-[2.5rem]">
              <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4 flex flex-row items-center justify-between">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search records..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-full border-white/10 bg-white/5" 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold px-6">Date</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold">Entity / Description</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold">Status</TableHead>
                      <TableHead className="text-right uppercase tracking-widest text-[9px] font-bold px-6">Amount (₹)</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isExpensesLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-mono text-[10px] tracking-widest uppercase">Syncing...</TableCell></TableRow>
                    ) : filteredExpenses.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-sm">No records found.</TableCell></TableRow>
                    ) : (
                      filteredExpenses.map((exp) => (
                        <TableRow key={exp.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                          <TableCell className="text-muted-foreground font-mono text-xs px-6">{exp.expenseDate}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-sm truncate max-w-[250px]">{exp.clientName || "General Entry"}</span>
                              <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{exp.description}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "rounded-full text-[8px] uppercase font-bold tracking-widest px-2.5 py-0.5 flex items-center gap-1 w-fit",
                              exp.status === "Paid" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-orange-500/10 text-orange-500 border-orange-500/20"
                            )} variant="outline">
                              {exp.status === "Paid" ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Clock className="h-2.5 w-2.5" />}
                              {exp.status || "Unpaid"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm px-6">
                            ₹{exp.amount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass rounded-2xl">
                                <DropdownMenuItem onClick={() => setEditingExpense(exp)} className="text-xs cursor-pointer">
                                  <Pencil className="h-3 w-3 mr-2" /> Modify Entry
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteExpense(exp.id)} className="text-xs text-destructive cursor-pointer">
                                  <Trash2 className="h-3 w-3 mr-2" /> Purge Record
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
          </Tabs>
        </div>
      </div>


    </main>
  );
}
