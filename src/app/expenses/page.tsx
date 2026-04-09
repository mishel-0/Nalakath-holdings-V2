"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
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

function indianNumberFormat(n: number): string {
  const parts = n.toFixed(2).split(".");
  let lastThree = parts[0].substring(parts[0].length - 3);
  const otherNumbers = parts[0].substring(0, parts[0].length - 3);
  if (otherNumbers !== "") lastThree = "," + lastThree;
  const res = otherNumbers.replace(/\B(?=(\d{2})+(?!\d))/g, ",") + lastThree + "." + parts[1];
  return res;
}

function numberToWords(num: number): string {
  const a = ['', 'One ', 'Two ', 'Three ', 'Four ', 'Five ', 'Six ', 'Seven ', 'Eight ', 'Nine ', 'Ten ', 'Eleven ', 'Twelve ', 'Thirteen ', 'Fourteen ', 'Fifteen ', 'Sixteen ', 'Seventeen ', 'Eighteen ', 'Nineteen '];
  const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

  const inWords = (n: any): string => {
    if ((n = n.toString()).length > 9) return 'overflow';
    const n_array = ('000000000' + n).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
    if (!n_array) return '';
    let str = '';
    str += (Number(n_array[1]) != 0) ? (a[Number(n_array[1])] || b[Number(n_array[1][0])] + ' ' + a[Number(n_array[1][1])]) + 'Crore ' : '';
    str += (Number(n_array[2]) != 0) ? (a[Number(n_array[2])] || b[Number(n_array[2][0])] + ' ' + a[Number(n_array[2][1])]) + 'Lakh ' : '';
    str += (Number(n_array[3]) != 0) ? (a[Number(n_array[3])] || b[Number(n_array[3][0])] + ' ' + a[Number(n_array[3][1])]) + 'Thousand ' : '';
    str += (Number(n_array[4]) != 0) ? (a[Number(n_array[4])] || b[Number(n_array[4][0])] + ' ' + a[Number(n_array[4][1])]) + 'Hundred ' : '';
    str += (Number(n_array[5]) != 0) ? ((str != '') ? 'and ' : '') + (a[Number(n_array[5])] || b[Number(n_array[5][0])] + ' ' + a[Number(n_array[5][1])]) : '';
    return str;
  };

  return "RUPEES " + inWords(Math.floor(num)).toUpperCase() + "ONLY";
}

export default function ExpensesPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const { activeDivision } = useDivision();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isPhaseOpen, setIsPhaseOpen] = useState(false);
  const [editingPhase, setEditingPhase] = useState<any>(null);
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);
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

  const getInvoiceCalculations = (amount: number) => {
    const subtotal = amount;
    const cgst = subtotal * 0.09;
    const sgst = subtotal * 0.09;
    const tds = subtotal * 0.02; 
    const totalPayable = subtotal + cgst + sgst - tds;
    return { subtotal, cgst, sgst, tds, totalPayable };
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-20 md:mb-0">
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

                <Card className="glass border-white/5 overflow-hidden rounded-[2.5rem]">
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
                                    {exp.expenseType === "Client Invoice" && (
                                      <DropdownMenuItem onClick={() => setInvoiceToPrint(exp)} className="text-xs font-bold text-primary cursor-pointer">
                                        <FileText className="h-3 w-3 mr-2" /> Generate Tax Invoice
                                      </DropdownMenuItem>
                                    )}
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
      </div>

      {invoiceToPrint && (() => {
        const calcs = getInvoiceCalculations(invoiceToPrint.amount);
        
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
            <Card className="w-full max-w-4xl bg-white text-[#0C0A07] overflow-hidden rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans border-none pb-10">
              <Button variant="ghost" size="icon" className="absolute top-4 right-4 print:hidden h-10 w-10 bg-black/10 hover:bg-black/20 text-black rounded-full z-[110]" onClick={() => setInvoiceToPrint(null)}>
                <X className="h-5 w-5" />
              </Button>
              
              {/* HEADER - STRICT PYTHON MODEL */}
              <div style={{ backgroundColor: DARK }} className="h-[108px] w-full relative flex items-center px-10">
                <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-1" />
                <div style={{ backgroundColor: GOLD }} className="absolute bottom-0 left-0 w-full h-0.5" />
                
                <div className="flex items-center gap-6">
                  <div style={{ borderColor: GOLD }} className="h-16 w-16 rounded-full border-2 flex items-center justify-center text-white font-black text-xl">NH</div>
                  <div>
                    <h1 style={{ color: GOLD }} className="text-2xl font-black tracking-tight uppercase">NALAKATH CONSTRUCTIONS PVT. LTD.</h1>
                    <p style={{ color: GOLD3 }} className="text-[10px] italic font-medium opacity-80">Building Trust. Building Kerala.</p>
                    <p className="text-[8px] text-white/60 mt-1 uppercase tracking-widest font-bold">Nalakath Hub, Areecode, Malappuram | GSTIN: 32XXXXXX1234Z5</p>
                  </div>
                </div>
              </div>

              {/* TITLE BAND */}
              <div style={{ backgroundColor: GOLD }} className="h-8 w-full flex items-center justify-between px-10">
                <span className="text-sm font-black uppercase text-black">Tax Invoice</span>
                <span className="text-[9px] font-bold text-black/70 uppercase">Original for Recipient | CGST + SGST | Malappuram Jurisdiction</span>
              </div>

              <div className="p-10 space-y-8">
                {/* Meta Grid */}
                <div className="grid grid-cols-2 gap-10">
                  <div style={{ backgroundColor: '#FDFBF7', borderColor: BORDER }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Invoice Details</span>
                    </div>
                    <div className="mt-6 space-y-2">
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Invoice Number:</span><span className="font-black">{invoiceToPrint.invoiceNumber || 'NC-2026-001'}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Invoice Date:</span><span className="font-black">{new Date(invoiceToPrint.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                      <div className="flex justify-between text-xs"><span style={{ color: MID }} className="font-bold uppercase tracking-widest text-[9px]">Payment Terms:</span><span className="font-black">Net 30 Days</span></div>
                    </div>
                  </div>

                  <div style={{ backgroundColor: '#FDFBF7', borderColor: BORDER }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Bill To</span>
                    </div>
                    <div className="mt-6">
                      <p className="text-sm font-black uppercase text-black mb-1">{invoiceToPrint.clientName}</p>
                      <p style={{ color: MID }} className="text-[10px] font-bold uppercase leading-relaxed">{invoiceToPrint.clientGstin || "NO ADDRESS RECORDED"}</p>
                    </div>
                  </div>
                </div>

                {/* PROJECT BAND */}
                <div style={{ backgroundColor: "#181410" }} className="rounded-lg h-8 flex items-center px-4 gap-3">
                  <span style={{ color: "#DFC06A" }} className="text-[9px] font-black uppercase">Project:</span>
                  <span className="text-[10px] text-white/80 font-medium uppercase truncate">{invoiceToPrint.description}</span>
                </div>

                {/* TABLE */}
                <div style={{ borderColor: BORDER }} className="border rounded-lg overflow-hidden">
                  <table className="w-full text-left border-collapse">
                    <thead style={{ backgroundColor: DARK }}>
                      <tr>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">#</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">Work Description</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">HSN/SAC</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Qty</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right border-r border-white/10">Rate (Rs.)</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">GST %</th>
                        <th style={{ color: GOLD }} className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="text-[11px] font-medium">
                      <tr className="border-b border-[#E0D4B0]">
                        <td className="p-4 text-center border-r border-[#DDD0A8]">1</td>
                        <td className="p-4 uppercase border-r border-[#DDD0A8]">{invoiceToPrint.description}</td>
                        <td className="p-4 text-center border-r border-[#DDD0A8] text-muted-foreground">9954</td>
                        <td className="p-4 text-center border-r border-[#DDD0A8]">
                          <p className="font-black text-sm">1.00</p>
                          <p className="text-[8px] font-bold text-muted-foreground">UNIT</p>
                        </td>
                        <td className="p-4 text-right border-r border-[#DDD0A8] font-mono">{indianNumberFormat(invoiceToPrint.amount)}</td>
                        <td className="p-4 text-center border-r border-[#DDD0A8]">18.0</td>
                        <td className="p-4 text-right font-black font-mono">{indianNumberFormat(invoiceToPrint.amount)}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* TOTALS */}
                <div className="flex justify-end pt-4">
                  <div className="w-[320px] space-y-2">
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>Subtotal (before GST)</span><span className="font-mono text-black">Rs. {indianNumberFormat(calcs.subtotal)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>CGST (9%)</span><span className="font-mono text-black">Rs. {indianNumberFormat(calcs.cgst)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#6B5C42]"><span>SGST (9%)</span><span className="font-mono text-black">Rs. {indianNumberFormat(calcs.sgst)}</span></div>
                    <div className="flex justify-between text-[10px] font-bold px-2 text-[#A02818] border-b border-black/5 pb-2"><span>TDS (Sec. 194C)</span><span className="font-mono">- Rs. {indianNumberFormat(calcs.tds)}</span></div>
                    
                    <div style={{ backgroundColor: DARK }} className="relative mt-4 rounded-lg p-4 flex justify-between items-center shadow-xl">
                      <div className="space-y-0.5">
                        <p style={{ color: GOLD }} className="text-[8px] font-black uppercase tracking-[0.2em]">Total Amount Payable</p>
                        <p style={{ color: GOLD }} className="text-2xl font-black tracking-tight">Rs. {indianNumberFormat(calcs.totalPayable)}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* AMOUNT IN WORDS */}
                <div style={{ backgroundColor: GOLD3, borderColor: BORDER }} className="border rounded-lg p-4 flex items-center gap-6">
                  <span className="text-[9px] font-black text-[#6B5C42] uppercase tracking-[0.1em] shrink-0">Amount in Words:</span>
                  <p className="text-[10px] font-black italic text-black leading-relaxed uppercase">{numberToWords(calcs.totalPayable)}</p>
                </div>

                {/* BANK PANELS */}
                <div className="grid grid-cols-2 gap-10">
                  <div style={{ borderColor: BORDER, backgroundColor: '#FDFBF7' }} className="border rounded-xl p-6 relative overflow-hidden">
                    <div style={{ backgroundColor: GOLD }} className="absolute top-0 left-0 w-full h-6 px-4 flex items-center">
                      <span className="text-[9px] font-black text-black uppercase">Bank Details</span>
                    </div>
                    <div className="mt-6 space-y-1.5 text-[10px]">
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Bank:</span><span className="font-black text-black">STATE BANK OF INDIA</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">Account No.:</span><span className="font-black text-black font-mono">32XXXXXXXXXX51</span></div>
                      <div className="flex justify-between"><span className="text-muted-foreground font-bold uppercase tracking-widest text-[8px]">IFSC Code:</span><span className="font-black text-black font-mono">SBIN0001234</span></div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-center justify-end">
                    <div className="text-center space-y-1">
                      <div className="h-[1px] w-48 bg-black mx-auto mb-2" />
                      <p className="text-[10px] font-black text-black uppercase tracking-[0.1em]">Authorised Signatory</p>
                      <p className="text-[8px] font-bold text-muted-foreground uppercase">For Nalakath Constructions Pvt. Ltd.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* FOOTER */}
              <div style={{ backgroundColor: DARK }} className="h-10 w-full flex items-center justify-center border-t border-white/5">
                <p style={{ color: GOLD3 }} className="text-[8px] font-medium uppercase tracking-[0.3em]">Nalakath Constructions Pvt. Ltd. • Building Trust. Building Kerala.</p>
              </div>

              {/* PRINT ACTIONS */}
              <div className="print:hidden flex gap-4 justify-center mt-6 pt-6 border-t border-zinc-100">
                <Button variant="outline" className="rounded-full px-8 h-12 font-bold uppercase text-[10px] tracking-widest" onClick={() => setInvoiceToPrint(null)}>Discard Preview</Button>
                <Button className="rounded-full px-12 h-12 font-bold uppercase text-[10px] tracking-widest gold-gradient text-black shadow-xl" onClick={() => window.print()}><Printer className="h-4 w-4 mr-2" /> Export to PDF</Button>
              </div>
            </Card>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
