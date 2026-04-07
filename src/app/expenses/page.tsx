
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
  Send,
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

// Utility for Amount in Words (Indian Format)
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

  const { data: phases, isLoading: isPhasesLoading } = useCollection(phasesQuery);
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
    
    const newPhase = {
      name: formData.get("name") as string,
      createdAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "phases"), newPhase);
    setIsPhaseOpen(false);
    toast({ title: "Phase Created", description: `Initialized ${newPhase.name} for ${activeDivision.name}.` });
  };

  const handleUpdatePhase = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingPhase) return;
    const formData = new FormData(e.currentTarget);
    updateDocumentNonBlocking(doc(db, "companies", companyId, "phases", editingPhase.id), {
      name: formData.get("name") as string,
    });
    setEditingPhase(null);
    toast({ title: "Phase Updated", description: "Phase name modified successfully." });
  };

  const handleDeletePhase = (id: string) => {
    deleteDoc(doc(db, "companies", companyId, "phases", id));
    if (selectedPhaseId === id) setSelectedPhaseId("all");
    toast({ variant: "destructive", title: "Phase Deleted", description: "Phase removed from timeline." });
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
    toast({ title: "Entry Logged", description: "Financial record saved and synced to Ledger." });
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
    toast({ title: "Entry Updated", description: "Record and Ledger modified successfully." });
  };

  const handleDeleteExpense = (id: string) => {
    deleteDoc(doc(db, "companies", companyId, "expenses", id));
    syncToLedger(id, null, true);
    toast({ variant: "destructive", title: "Record Deleted", description: "Entry removed from Expenses and Ledger." });
  };

  const handleCreateVoucherFromExpense = (exp: any) => {
    const phaseName = phases?.find(p => p.id === exp.phaseId)?.name || "Unassigned";
    const now = new Date().toISOString();
    
    const newVoucher = {
      companyId,
      expenseId: exp.id,
      voucherNumber: exp.invoiceNumber || `V-${exp.id.substring(0, 6).toUpperCase()}`,
      division: activeDivision.division,
      vendorName: exp.clientName || "General Vendor",
      date: exp.expenseDate,
      amount: exp.amount,
      paymentMethod: "Journal Transfer",
      status: exp.status === "Paid" ? "Paid" : "Pending",
      phaseName: phaseName,
      description: exp.description,
      expenseCategory: exp.expenseType || exp.expenseCategory || "Operational",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "vouchers"), newVoucher);
    toast({ title: "Voucher Sync Complete", description: `Record pushed to Payment Vouchers for Audit.` });
  };

  const handlePrint = () => {
    window.print();
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
                                    <DropdownMenuItem onClick={() => handleCreateVoucherFromExpense(exp)} className="text-xs font-bold text-green-500 cursor-pointer">
                                      <Send className="h-3 w-3 mr-2" /> Push to Audit Vouchers
                                    </DropdownMenuItem>
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

      <Dialog open={!!editingPhase} onOpenChange={(open) => !open && setEditingPhase(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Edit Phase Details</DialogTitle>
          </DialogHeader>
          {editingPhase && (
            <form onSubmit={handleUpdatePhase} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Phase Name</Label>
                <Input name="name" defaultValue={editingPhase.name} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Update Phase</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modify Entry</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <form onSubmit={handleUpdateExpense} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Phase</Label>
                <Select name="phaseId" defaultValue={editingExpense.phaseId}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    {phases?.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingExpense.status}>
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
                  <Input name="date" type="date" defaultValue={editingExpense.expenseDate} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Entity Name</Label>
                <Input name="clientName" defaultValue={editingExpense.clientName} />
              </div>
              <div className="grid gap-2">
                <Label>Invoice/Reference #</Label>
                <Input name="invoiceNumber" defaultValue={editingExpense.invoiceNumber} />
              </div>
              <div className="grid gap-2">
                <Label>GSTIN</Label>
                <Input name="clientGstin" defaultValue={editingExpense.clientGstin} />
              </div>
              <div className="grid gap-2">
                <Label>Description</Label>
                <Input name="description" defaultValue={editingExpense.description} required />
              </div>
              <div className="grid gap-2">
                <Label>Amount (₹)</Label>
                <Input name="amount" type="number" step="0.01" defaultValue={editingExpense.amount} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Update Record</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {invoiceToPrint && (() => {
        const calcs = getInvoiceCalculations(invoiceToPrint.amount);
        const currentInvoicePhase = phases?.find(p => p.id === invoiceToPrint?.phaseId);
        const isPhase1 = currentInvoicePhase?.name.toLowerCase().includes("phase 1");
        
        return (
          <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
            <Card className="w-full max-w-4xl bg-white text-black overflow-hidden rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans border-none">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 print:hidden h-10 w-10 bg-zinc-100 hover:bg-zinc-200 rounded-full z-[110]" 
                onClick={() => setInvoiceToPrint(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* Header - PIXEL PERFECT RECREATION */}
              <div className="bg-[#0C0A07] p-10 md:p-12 text-white flex justify-between items-start border-b-[2px] border-[#C9A84C] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-[#C9A84C]" />
                <div className="flex gap-8 items-center relative z-10">
                  <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center border-2 border-[#C9A84C] p-2 shadow-xl">
                    <div className="h-full w-full bg-[#0C0A07] rounded-full flex items-center justify-center">
                      <span className="text-3xl font-black text-[#C9A84C]">NH</span>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-4xl font-black tracking-tight text-[#C9A84C] uppercase leading-none">
                      {isPhase1 ? "UNIVERSAL CONSTRUCTION HUB" : "NALAKATH CONSTRUCTIONS"}
                    </h1>
                    <p className="text-sm font-bold text-zinc-400 italic">Private Limited</p>
                    <div className="mt-3 h-[0.6px] w-[300px] bg-[#C9A84C] opacity-100" />
                    <p className="text-[11px] text-[#F0E4B8] font-bold tracking-widest pt-2 uppercase italic">
                      Building Trust. Building Kerala.
                    </p>
                    <p className="text-[10px] text-[#F5EDD6] font-medium leading-relaxed max-w-md mt-2">
                      Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639<br />
                      +91 97444 00100 | info@nalakathindia.com | GSTIN: 32XXXXX1234Z5
                    </p>
                  </div>
                </div>
              </div>

              {/* Title Band */}
              <div className="bg-[#C9A84C] px-10 py-3 flex justify-between items-center">
                <h2 className="text-xl font-black text-[#0C0A07] uppercase tracking-widest">TAX INVOICE</h2>
                <div className="flex gap-4 text-[9px] font-black text-[#0C0A07] uppercase opacity-80">
                  <span>Original for Recipient</span>
                  <span className="border-l border-black/20 pl-4">CGST + SGST</span>
                  <span className="border-l border-black/20 pl-4">Malappuram Jurisdiction</span>
                </div>
              </div>

              {/* Meta Boxes Grid */}
              <div className="p-10 md:p-12 pb-6 space-y-10">
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                      <div className="bg-[#C9A84C] px-4 py-1.5">
                        <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">INVOICE DETAILS</h3>
                      </div>
                      <div className="p-4 grid grid-cols-2 gap-y-3 text-[11px]">
                        <span className="font-bold text-[#6B5C42] uppercase">Invoice Number:</span>
                        <span className="font-black text-[#0C0A07]">{invoiceToPrint.invoiceNumber || 'NC-2025-0042'}</span>
                        <span className="font-bold text-[#6B5C42] uppercase">Invoice Date:</span>
                        <span className="font-black text-[#0C0A07]">{new Date(invoiceToPrint.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="font-bold text-[#6B5C42] uppercase">Due Date:</span>
                        <span className="font-black text-[#0C0A07]">{new Date(invoiceToPrint.expenseDate).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                        <span className="font-bold text-[#6B5C42] uppercase">Payment Terms:</span>
                        <span className="font-black text-[#0C0A07]">Net 30 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm h-full bg-[#FDFBF7]">
                      <div className="bg-[#C9A84C] px-4 py-1.5">
                        <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">BILL TO</h3>
                      </div>
                      <div className="p-4 h-full">
                        <p className="text-lg font-black text-[#0C0A07] uppercase leading-tight mb-2">
                          {invoiceToPrint.clientName || "Oval Palace Resort"}
                        </p>
                        <p className="text-[11px] font-bold text-[#6B5C42] uppercase leading-relaxed">
                          Infrastructure & Portfolio Development Unit<br />
                          Perinthalmanna, Kerala 679322<br />
                          {invoiceToPrint.clientGstin ? `GSTIN: ${invoiceToPrint.clientGstin}` : "Unregistered / Internal Transfer"}<br />
                          PO Ref: KSCB/PO/2025/0089
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Project Band */}
                <div className="bg-[#181410] rounded-lg px-6 py-2.5 flex gap-4 items-center border-l-[6px] border-[#C9A84C]">
                  <span className="text-[#DFC06A] text-[10px] font-black tracking-widest uppercase shrink-0">PROJECT:</span>
                  <p className="text-xs font-bold text-[#F5EDD6] uppercase tracking-wide truncate">
                    {currentInvoicePhase?.name || 'N/A'}: {invoiceToPrint.description}
                  </p>
                </div>

                {/* Main Table */}
                <div className="overflow-hidden rounded-lg border border-[#CEBB8A]">
                  <table className="w-full text-left">
                    <thead className="bg-[#0C0A07] text-[#C9A84C]">
                      <tr>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest w-12 border-r border-white/10 text-center">#</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest border-r border-white/10">Description of Work / Materials</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">HSN/SAC</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Qty</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">Unit</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right border-r border-white/10">Rate (Rs.)</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-center border-r border-white/10">GST %</th>
                        <th className="py-3 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (Rs.)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E0D4B0]">
                      <tr className="bg-white">
                        <td className="p-4 text-xs font-black text-[#6B5C42] border-r border-[#F7F2E8] text-center">1</td>
                        <td className="p-4 border-r border-[#F7F2E8]">
                          <p className="text-xs font-black text-[#0C0A07] uppercase">{invoiceToPrint.description}</p>
                          <p className="text-[9px] text-[#6B5C42] font-bold uppercase mt-1">Operational Ref: NC-OPS-{invoiceToPrint.id.toUpperCase()}</p>
                        </td>
                        <td className="p-4 text-center text-xs font-mono text-[#0C0A07] border-r border-[#F7F2E8]">9954</td>
                        <td className="p-4 text-center text-xs font-black border-r border-[#F7F2E8]">1</td>
                        <td className="p-4 text-center text-[10px] font-black border-r border-[#F7F2E8] uppercase">L.S.</td>
                        <td className="p-4 text-right text-xs font-mono border-r border-[#F7F2E8]">{invoiceToPrint.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                        <td className="p-4 text-center text-xs font-black border-r border-[#F7F2E8]">18</td>
                        <td className="p-4 text-right text-xs font-mono font-black">{invoiceToPrint.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</td>
                      </tr>
                      {[2, 3, 4].map(i => (
                        <tr key={i} className={cn("h-10", i % 2 === 0 ? "bg-[#F7F2E8]" : "bg-white")}>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 border-r border-[#E0D4B0]"></td>
                          <td className="p-4 text-right"></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Fiscal Summary */}
                <div className="flex justify-end mt-6">
                  <div className="w-96 space-y-2">
                    <div className="flex justify-between text-[11px] font-bold px-4">
                      <span className="text-[#6B5C42] uppercase tracking-widest">Subtotal (before GST)</span>
                      <span className="font-mono text-[#0C0A07]">Rs. {calcs.subtotal.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold px-4">
                      <span className="text-[#6B5C42] uppercase tracking-widest">CGST @ 9%</span>
                      <span className="font-mono text-[#0C0A07]">Rs. {calcs.cgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold px-4">
                      <span className="text-[#6B5C42] uppercase tracking-widest">SGST @ 9%</span>
                      <span className="font-mono text-[#0C0A07]">Rs. {calcs.sgst.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="flex justify-between text-[11px] font-bold px-4 border-b border-[#E0D4B0] pb-3">
                      <span className="text-[#A02818] uppercase tracking-widest">TDS Deductible (Sec. 194C)</span>
                      <span className="font-mono text-[#A02818]">- Rs. {calcs.tds.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</span>
                    </div>
                    <div className="bg-[#0C0A07] p-5 rounded-lg text-[#C9A84C] flex justify-between items-center shadow-lg border-l-[8px] border-[#C9A84C]">
                      <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-[0.2em]">TOTAL AMOUNT PAYABLE</p>
                        <p className="text-3xl font-black tracking-tighter leading-none text-[#DFC06A]">Rs. {calcs.totalPayable.toLocaleString('en-IN', { minimumFractionDigits: 2 })}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Amount in Words */}
                <div className="bg-[#F0E4B8] px-6 py-3 rounded-lg border border-[#CEBB8A] flex items-center gap-4">
                  <span className="text-[10px] font-black text-[#6B5C42] uppercase tracking-widest">Amount In Words:</span>
                  <p className="text-xs font-black text-[#0C0A07] uppercase italic">{numberToWords(calcs.totalPayable)}</p>
                </div>

                {/* Bank Details & Terms */}
                <div className="grid grid-cols-2 gap-12 pt-4">
                  <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                    <div className="bg-[#C9A84C] px-4 py-1.5">
                      <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">BANK DETAILS</h3>
                    </div>
                    <div className="p-4 grid grid-cols-2 gap-y-2 text-[11px]">
                      <span className="font-bold text-[#6B5C42]">Bank:</span>
                      <span className="font-black text-[#0C0A07]">State Bank of India, Perinthalmanna</span>
                      <span className="font-bold text-[#6B5C42]">Account Name:</span>
                      <span className="font-black text-[#0C0A07]">{isPhase1 ? "Universal Construction Hub" : "Nalakath Constructions Pvt. Ltd."}</span>
                      <span className="font-bold text-[#6B5C42]">Account No.:</span>
                      <span className="font-black text-[#0C0A07] font-mono">32XXXXXXXXX51</span>
                      <span className="font-bold text-[#6B5C42]">IFSC Code:</span>
                      <span className="font-black text-[#0C0A07] font-mono">SBIN0001234</span>
                      <span className="font-bold text-[#6B5C42]">Account Type:</span>
                      <span className="font-black text-[#0C0A07] uppercase">Current Account</span>
                    </div>
                  </div>

                  <div className="rounded-lg overflow-hidden border border-[#CEBB8A] shadow-sm bg-[#FDFBF7]">
                    <div className="bg-[#C9A84C] px-4 py-1.5">
                      <h3 className="text-[10px] font-black text-[#0C0A07] uppercase tracking-widest">TERMS & CONDITIONS</h3>
                    </div>
                    <div className="p-4 h-full">
                      <ul className="text-[10px] text-[#0C0A07] font-bold space-y-1.5 list-decimal pl-4">
                        <li>Payment due within 30 days of invoice date.</li>
                        <li>Interest @ 18% p.a. charged on overdue amounts.</li>
                        <li>Materials supplied per approved BOQ specifications.</li>
                        <li>Disputes subject to Malappuram jurisdiction only.</li>
                        <li>This is a computer-generated invoice.</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Signatory Section */}
                <footer className="pt-16 flex justify-between items-end">
                  <div className="max-w-xs">
                    <p className="text-[10px] leading-relaxed text-[#6B5C42] font-bold italic border-t border-[#E0D4B0] pt-4">
                      We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct to the best of our knowledge.
                    </p>
                  </div>
                  <div className="text-center space-y-6">
                    <div className="h-20 w-20 border-[3px] border-[#C9A84C]/40 rounded-full flex items-center justify-center mx-auto opacity-40 -rotate-12">
                      <p className="text-[9px] font-black text-[#C9A84C] uppercase text-center leading-none">Verified<br/>Audit<br/>2026</p>
                    </div>
                    <div className="space-y-1.5">
                      <div className="h-[0.8px] w-56 bg-[#CEBB8A] mx-auto" />
                      <p className="text-[11px] font-black text-[#0C0A07] uppercase tracking-widest">Authorised Signatory</p>
                      <p className="text-[9px] font-bold text-[#6B5C42] uppercase">For {isPhase1 ? "Universal Hub" : "Nalakath Constructions Pvt. Ltd."}</p>
                    </div>
                  </div>
                </footer>
              </div>

              {/* Bottom Strip */}
              <div className="bg-[#0C0A07] py-4 px-10 text-white flex justify-between items-center print:border-t-0 border-t border-white/10">
                <p className="text-[9px] font-black tracking-[0.2em] text-[#DFC06A]">
                  {isPhase1 ? "UNIVERSAL HUB" : "NALAKATH CONSTRUCTIONS PVT. LTD."}
                </p>
                <div className="flex gap-6 text-[8px] font-bold text-[#F5EDD6] uppercase tracking-widest">
                  <span>Areecode, Malappuram</span>
                  <span>+91 97444 00100</span>
                  <span>nalakathindia.com</span>
                  <span className="text-[#C9A84C]">Page 1 of 1</span>
                </div>
              </div>

              <div className="print:hidden flex gap-4 justify-end p-8 border-t border-zinc-100 bg-zinc-50 mt-10">
                <Button variant="outline" className="rounded-full px-8 gap-2 border-zinc-300 h-14 font-black uppercase text-[11px] tracking-widest hover:bg-zinc-100" onClick={() => setInvoiceToPrint(null)}>
                  Discard Preview
                </Button>
                <Button className="rounded-full px-12 gap-3 h-14 font-black uppercase text-[11px] tracking-widest bg-[#0C0A07] text-[#C9A84C] hover:bg-black shadow-2xl shadow-black/20" onClick={handlePrint}>
                  <Printer className="h-5 w-5" /> Save PDF / Print
                </Button>
              </div>
            </Card>
          </div>
        );
      })()}

      <BottomNav />
    </div>
  );
}
