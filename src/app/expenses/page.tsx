
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
  Receipt, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  FileText, 
  Printer, 
  X,
  CheckCircle2,
  Clock,
  Layers,
  FolderPlus,
  Send,
  Building2,
  Phone,
  Mail,
  MapPin
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc, setDoc, deleteDoc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

// Utility for Amount in Words
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

  return "Rupees " + inWords(Math.floor(num)) + " Only";
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
    return filtered;
  }, [expenses, selectedPhaseId, activeTab]);

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
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "phases", id));
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

  // Professional Invoice Data
  const getInvoiceCalculations = (amount: number) => {
    const taxableValue = amount;
    const cgst = taxableValue * 0.09;
    const sgst = taxableValue * 0.09;
    const tds = taxableValue * 0.02;
    const totalPayable = taxableValue + cgst + sgst - tds;
    return { taxableValue, cgst, sgst, tds, totalPayable };
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
                    <Button className="rounded-full gap-2 gold-gradient text-black font-bold hover:opacity-90 shadow-lg shadow-primary/20 px-6 h-11 shrink-0">
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
                        <Input name="description" required placeholder="Description of work or purchase" />
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
                          <Label className="text-[10px]">GSTIN (for Client Invoices)</Label>
                          <Input name="clientGstin" placeholder="GST Registration No." />
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label>Amount (₹)</Label>
                          <Input name="amount" type="number" step="0.01" required className="font-mono" />
                        </div>
                        <div className="grid gap-2">
                          <Label>Category</Label>
                          <Input name="category" placeholder="Infrastructure, etc." required />
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
                      <Input placeholder="Search records..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                    </div>
                    <Badge variant="outline" className="hidden md:flex bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest px-3">
                      {filteredExpenses.length} Entries in {selectedPhaseId === 'all' ? 'All Phases' : phases?.find(p => p.id === selectedPhaseId)?.name}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader className="bg-white/5">
                        <TableRow className="border-white/5">
                          <TableHead className="uppercase tracking-widest text-[9px] font-bold px-6">Date</TableHead>
                          <TableHead className="uppercase tracking-widest text-[9px] font-bold">Entity / Description</TableHead>
                          <TableHead className="uppercase tracking-widest text-[9px] font-bold">Phase</TableHead>
                          <TableHead className="uppercase tracking-widest text-[9px] font-bold">Status</TableHead>
                          <TableHead className="text-right uppercase tracking-widest text-[9px] font-bold px-6">Amount (₹)</TableHead>
                          <TableHead className="w-16"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {isExpensesLoading ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground animate-pulse font-mono text-[10px] tracking-widest uppercase">Syncing Kernel...</TableCell></TableRow>
                        ) : filteredExpenses.length === 0 ? (
                          <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic text-sm">No records found for this criteria.</TableCell></TableRow>
                        ) : (
                          filteredExpenses.map((exp) => {
                            const phaseName = phases?.find(p => p.id === exp.phaseId)?.name || "Unassigned";
                            return (
                              <TableRow key={exp.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                                <TableCell className="text-muted-foreground font-mono text-xs px-6">{exp.expenseDate}</TableCell>
                                <TableCell className="py-4">
                                  <div className="flex flex-col gap-0.5">
                                    <span className="font-bold text-sm truncate max-w-[200px]">{exp.clientName || "General Entry"}</span>
                                    <span className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">{exp.description}</span>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="text-[8px] uppercase border-white/10 text-muted-foreground">{phaseName}</Badge>
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
                                <TableCell className="text-right font-mono font-bold text-sm px-6 truncate">
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
                            );
                          })
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
            <Card className="w-full max-w-4xl bg-white text-black overflow-hidden rounded-[1rem] print:rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300 font-sans">
              <Button 
                variant="ghost" 
                size="icon" 
                className="absolute top-4 right-4 print:hidden h-10 w-10 bg-zinc-100 hover:bg-zinc-200 rounded-full z-50" 
                onClick={() => setInvoiceToPrint(null)}
              >
                <X className="h-5 w-5" />
              </Button>
              
              {/* HEADER SECTION - BLACK & GOLD */}
              <div className="bg-[#1a1a1a] p-8 md:p-12 text-white flex justify-between items-start border-b-[6px] border-[#b8860b]">
                <div className="flex gap-6 items-center">
                  <div className="h-20 w-20 bg-white rounded-xl flex items-center justify-center p-2 shadow-inner">
                    <Building2 className="h-14 w-14 text-black" />
                  </div>
                  <div className="space-y-1">
                    <h1 className="text-3xl font-black tracking-tight text-[#ffd700] uppercase leading-none">
                      {isPhase1 ? "UNIVERSAL CONSTRUCTION HUB" : "NALAKATH CONSTRUCTIONS"}
                    </h1>
                    <p className="text-sm font-bold text-zinc-400">Private Limited</p>
                    <div className="mt-2 h-px w-full bg-zinc-700" />
                    <p className="text-[10px] text-zinc-400 font-medium tracking-wide leading-relaxed pt-1">
                      Building Trust. Building Kerala.<br />
                      Nalakath Hub, Ward No. 4, Areecode, Malappuram, Kerala 673639<br />
                      +91 97444 00100 | info@nalakathindia.com | GSTIN: 32XXXXX1234Z5
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <Badge className="bg-[#b8860b] text-white rounded-full px-4 py-1 text-[10px] font-black tracking-widest uppercase">
                    ORIGINAL FOR RECIPIENT
                  </Badge>
                </div>
              </div>

              {/* TAX INVOICE BAR */}
              <div className="bg-[#ffd700]/90 px-8 py-3 flex justify-between items-center border-b border-[#b8860b]">
                <h2 className="text-xl font-black text-black uppercase tracking-widest">TAX INVOICE</h2>
                <span className="text-[10px] font-bold text-black uppercase opacity-60">Subject to Malappuram Jurisdiction</span>
              </div>

              <div className="p-8 md:p-12 space-y-10">
                {/* INFO BLOCKS */}
                <div className="grid grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="bg-zinc-100 rounded-lg p-4 border border-zinc-200">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-200 pb-2">INVOICE DETAILS</h3>
                      <div className="grid grid-cols-2 gap-y-2 text-xs">
                        <span className="font-bold text-zinc-500">Invoice Number:</span>
                        <span className="font-bold text-black">{invoiceToPrint.invoiceNumber || 'NC-2025-' + invoiceToPrint.id.substring(0,4).toUpperCase()}</span>
                        <span className="font-bold text-zinc-500">Invoice Date:</span>
                        <span className="font-bold text-black">{invoiceToPrint.expenseDate}</span>
                        <span className="font-bold text-zinc-500">Due Date:</span>
                        <span className="font-bold text-black">{invoiceToPrint.expenseDate}</span>
                        <span className="font-bold text-zinc-500">Payment Terms:</span>
                        <span className="font-bold text-black">Net 30 Days</span>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="bg-zinc-100 rounded-lg p-4 border border-zinc-200">
                      <h3 className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-200 pb-2">BILL TO</h3>
                      <div className="space-y-1">
                        <p className="text-lg font-black text-black uppercase leading-tight">
                          {invoiceToPrint.clientName || "Oval Palace Resort"}
                        </p>
                        <p className="text-[10px] font-bold text-zinc-500 uppercase leading-relaxed">
                          Infrastructure & Portfolio Development Unit<br />
                          {invoiceToPrint.clientGstin ? `GSTIN: ${invoiceToPrint.clientGstin}` : "Unregistered / Internal Transfer"}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* PROJECT BAR */}
                <div className="bg-[#1a1a1a] rounded-lg px-6 py-3 flex gap-4 items-center">
                  <Badge className="bg-[#b8860b] text-white text-[9px] font-black tracking-widest uppercase">PROJECT</Badge>
                  <p className="text-xs font-bold text-white uppercase tracking-wide truncate">
                    {currentInvoicePhase?.name || 'N/A'}: {invoiceToPrint.description}
                  </p>
                  {!isPhase1 && (
                    <Badge variant="outline" className="ml-auto text-[8px] border-white/20 text-[#ffd700] uppercase font-bold px-2 py-0.5">
                      INCL. SUPPLIER & LABOUR COSTS
                    </Badge>
                  )}
                </div>

                {/* ITEMS TABLE */}
                <div className="overflow-hidden rounded-lg border border-zinc-200">
                  <table className="w-full text-left">
                    <thead className="bg-[#1a1a1a] text-white">
                      <tr>
                        <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest w-12">#</th>
                        <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest">Description of Work / Materials</th>
                        <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-center">HSN/SAC</th>
                        <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-center">Qty</th>
                        <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-center">Rate (₹)</th>
                        <th className="py-4 px-4 text-[9px] font-black uppercase tracking-widest text-right">Amount (₹)</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-100">
                      <tr className="bg-white">
                        <td className="p-4 text-xs font-bold text-zinc-400">1</td>
                        <td className="p-4">
                          <p className="text-xs font-black text-black uppercase">{invoiceToPrint.description}</p>
                          <p className="text-[9px] text-zinc-400 font-bold uppercase mt-1">Operational Module: {invoiceToPrint.expenseCategory}</p>
                        </td>
                        <td className="p-4 text-center text-xs font-mono text-zinc-500">9954</td>
                        <td className="p-4 text-center text-xs font-bold">1</td>
                        <td className="p-4 text-center text-xs font-mono">₹{invoiceToPrint.amount.toLocaleString()}</td>
                        <td className="p-4 text-right text-xs font-mono font-black">₹{invoiceToPrint.amount.toLocaleString()}</td>
                      </tr>
                      {/* Placeholders for visual consistency */}
                      {[2].map(i => (
                        <tr key={i} className="bg-zinc-50/50">
                          <td className="p-4 text-xs font-bold text-zinc-300">{i}</td>
                          <td className="p-4 text-[10px] text-zinc-300 italic">No additional line items</td>
                          <td className="p-4"></td>
                          <td className="p-4"></td>
                          <td className="p-4"></td>
                          <td className="p-4 text-right text-xs font-mono text-zinc-300">-</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* TOTALS & BREAKDOWN */}
                <div className="flex justify-between items-start gap-10">
                  <div className="flex-1">
                    <div className="bg-zinc-50 p-4 rounded-lg border border-dashed border-zinc-200">
                      <p className="text-[9px] font-black text-zinc-400 uppercase tracking-widest mb-1">Amount In Words</p>
                      <p className="text-xs font-black text-black uppercase italic">{numberToWords(calcs.totalPayable)}</p>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-6 mt-8">
                      <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-200 pb-2">BANK DETAILS</h4>
                        <div className="space-y-1 text-[10px] font-bold">
                          <div className="flex justify-between">
                            <span className="text-zinc-400">Bank:</span>
                            <span className="text-black">State Bank of India</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">A/C Name:</span>
                            <span className="text-black">{isPhase1 ? "Universal Hub" : "Nalakath Constructions Pvt Ltd"}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">A/C No:</span>
                            <span className="text-black">32XXXXXXXXX51</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-zinc-400">IFSC:</span>
                            <span className="text-black">SBIN0001234</span>
                          </div>
                        </div>
                      </div>
                      <div className="bg-zinc-50 p-4 rounded-lg border border-zinc-200">
                        <h4 className="text-[9px] font-black text-zinc-500 uppercase tracking-widest mb-3 border-b border-zinc-200 pb-2">TERMS</h4>
                        <ul className="text-[9px] text-zinc-500 font-bold space-y-1 list-disc pl-3">
                          <li>Payment due within 30 days.</li>
                          <li>Materials as per approved specs.</li>
                          <li>Computer generated document.</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="w-80 space-y-3">
                    <div className="flex justify-between text-xs font-bold px-2">
                      <span className="text-zinc-500">Subtotal (before GST)</span>
                      <span className="font-mono">₹{calcs.taxableValue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold px-2">
                      <span className="text-zinc-500">CGST @ 9%</span>
                      <span className="font-mono">₹{calcs.cgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold px-2">
                      <span className="text-zinc-500">SGST @ 9%</span>
                      <span className="font-mono">₹{calcs.sgst.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between text-xs font-bold px-2 border-b border-zinc-100 pb-3">
                      <span className="text-red-500">TDS Deductible (Sec. 194C)</span>
                      <span className="font-mono text-red-500">- ₹{calcs.tds.toLocaleString()}</span>
                    </div>
                    <div className="bg-[#1a1a1a] p-5 rounded-xl text-white flex justify-between items-center shadow-xl">
                      <div className="space-y-1">
                        <p className="text-[9px] font-black text-[#ffd700] uppercase tracking-[0.2em]">TOTAL PAYABLE</p>
                        <p className="text-3xl font-black tracking-tighter leading-none">₹{calcs.totalPayable.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </div>

                <footer className="pt-16 flex justify-between items-end border-t border-zinc-100">
                  <div className="max-w-xs">
                    <p className="text-[9px] leading-relaxed text-zinc-400 font-bold italic">
                      We declare that this invoice shows the actual price of the goods/services described and that all particulars are true and correct to the best of our knowledge.
                    </p>
                  </div>
                  <div className="text-center space-y-4">
                    <div className="h-16 w-16 border border-[#b8860b]/30 rounded-full flex items-center justify-center mx-auto opacity-30">
                      <p className="text-[8px] font-black text-[#b8860b] rotate-12">VERIFIED</p>
                    </div>
                    <div className="space-y-1">
                      <div className="h-px w-48 bg-zinc-200 mx-auto" />
                      <p className="text-[10px] font-black text-black uppercase tracking-widest">Authorised Signatory</p>
                      <p className="text-[8px] font-bold text-zinc-400 uppercase">For {isPhase1 ? "Universal Hub" : "Nalakath Constructions Pvt. Ltd."}</p>
                    </div>
                  </div>
                </footer>
              </div>

              {/* STICKY FOOTER STRIP */}
              <div className="bg-[#1a1a1a] p-4 text-center print:hidden">
                <p className="text-[9px] font-black text-zinc-500 uppercase tracking-[0.5em]">
                  Nalakath Group of Companies | Malappuram, Kerala | Page 1 of 1
                </p>
              </div>

              <div className="print:hidden flex gap-4 justify-end p-8 border-t border-zinc-100 bg-zinc-50">
                <Button variant="outline" className="rounded-full px-8 gap-2 border-zinc-300 h-12 font-black uppercase text-[10px] tracking-widest" onClick={() => setInvoiceToPrint(null)}>
                  Discard Preview
                </Button>
                <Button className="rounded-full px-10 gap-2 h-12 font-black uppercase text-[10px] tracking-widest bg-black text-[#ffd700] hover:bg-zinc-900 shadow-xl" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Save PDF / Print
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

function SummaryCard({ title, value, color }: any) {
  return (
    <Card className="glass border-white/5 py-4 min-w-0">
      <CardContent className="p-6 flex flex-col gap-1 overflow-hidden">
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground truncate">{title}</p>
        <p className={`text-xl md:text-2xl font-bold font-mono truncate ${color}`} title={Math.abs(value).toLocaleString('en-IN')}>
          ₹{Math.abs(value).toLocaleString('en-IN')}
        </p>
      </CardContent>
    </Card>
  );
}
