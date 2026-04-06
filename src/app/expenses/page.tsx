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
  Settings2,
  Send
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDivision } from "@/context/DivisionContext";
import { cn } from "@/lib/utils";

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

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newExpense = {
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

    addDocumentNonBlocking(collection(db, "companies", companyId, "expenses"), newExpense);
    setIsAddOpen(false);
    toast({ title: "Entry Logged", description: "Financial record saved successfully." });
  };

  const handleUpdateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
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

    updateDocumentNonBlocking(doc(db, "companies", companyId, "expenses", editingExpense.id), updatedData);
    setEditingExpense(null);
    toast({ title: "Entry Updated", description: "Record modified successfully." });
  };

  const handleDeleteExpense = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "expenses", id));
    toast({ variant: "destructive", title: "Record Deleted", description: "Entry removed from ledger." });
  };

  const handleCreateVoucherFromExpense = (exp: any) => {
    const phaseName = phases?.find(p => p.id === exp.phaseId)?.name || "Unassigned";
    const now = new Date().toISOString();
    
    const newVoucher = {
      companyId,
      expenseId: exp.id,
      voucherNumber: `V-${exp.id.substring(0, 6).toUpperCase()}`,
      division: activeDivision.division,
      vendorName: exp.clientName || "General Vendor",
      date: exp.expenseDate,
      amount: exp.amount,
      paymentMethod: "Journal Transfer",
      status: exp.status === "Paid" ? "Paid" : "Pending",
      phaseName: phaseName,
      description: exp.description,
      expenseCategory: exp.expenseCategory,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "vouchers"), newVoucher);
    toast({ title: "Voucher Generated", description: `Financial record pushed to Payment Vouchers for ${phaseName}.` });
  };

  const handlePrint = () => {
    window.print();
  };

  const currentInvoicePhase = phases?.find(p => p.id === invoiceToPrint?.phaseId);
  const isNalakathInvoice = currentInvoicePhase && !currentInvoicePhase.name.toLowerCase().includes("phase 1");

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
                                        <Send className="h-3 w-3 mr-2" /> Push to Vouchers
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

      {invoiceToPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white overflow-y-auto">
          <Card className="w-full max-w-4xl bg-white text-black overflow-hidden rounded-[2.5rem] print:rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 print:hidden h-10 w-10 bg-zinc-100 hover:bg-zinc-200 rounded-full" 
              onClick={() => setInvoiceToPrint(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="p-16 print:p-10 space-y-12">
              <header className="flex justify-between items-start border-b-4 border-zinc-900 pb-10">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none text-zinc-900">
                      {isNalakathInvoice ? "Nalakath Construction Company" : "Universal Construction Hub"}
                    </h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">
                      {isNalakathInvoice ? "Infrastructure & Portfolio Development Unit" : "General Contracting Division"}
                    </p>
                  </div>
                  <div className="pt-2">
                    <div className="px-4 py-1.5 bg-zinc-900 text-white w-fit rounded-full mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest text-primary">Nalakath Holdings Group</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-widest pl-1">Executive Authorized Biller</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-zinc-900">Tax Invoice</h1>
                  <p className="text-sm font-mono font-bold text-zinc-400">REF: {invoiceToPrint.invoiceNumber || 'NCC-' + invoiceToPrint.id.substring(0,6).toUpperCase()}</p>
                  <div className="pt-4 space-y-1">
                    <p className="text-xs text-zinc-500 uppercase font-black">Issue Date: {invoiceToPrint.expenseDate}</p>
                    <Badge className={cn(
                      "rounded-full px-4 py-1 text-[10px] font-black uppercase tracking-tighter border-none",
                      invoiceToPrint.status === "Paid" ? "bg-green-100 text-green-700" : "bg-orange-100 text-orange-700"
                    )}>
                      {invoiceToPrint.status === "Paid" ? "PAID & SETTLED" : "PAYMENT OUTSTANDING"}
                    </Badge>
                  </div>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-20">
                <div className="space-y-4">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Billed To (Client Identity)</p>
                  <div className="space-y-1 pt-2">
                    <p className="text-2xl font-black text-zinc-900">{isNalakathInvoice ? "Oval Palace Resort" : invoiceToPrint.clientName || activeDivision.name}</p>
                    <p className="text-xs font-mono text-zinc-500 uppercase">Division: {activeDivision.division} Portfolio Unit</p>
                    <p className="text-xs font-mono text-zinc-500">GSTIN: {invoiceToPrint.clientGstin || "Unregistered / Internal Transfer"}</p>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Fiscal Metadata</p>
                  <div className="pt-2">
                    <p className="text-xs leading-relaxed text-zinc-500 font-medium">
                      Generated via Nalakath Kernel V4.5<br />
                      Primary Project: {activeDivision.name}<br />
                      Compliance Phase: {currentInvoicePhase?.name || 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-zinc-900">
                    <tr>
                      <th className="py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Detailed Description of Services / Works</th>
                      <th className="py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Class</th>
                      <th className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400 pr-4">Base Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="py-8">
                        <p className="font-bold text-xl text-zinc-900 leading-tight">{invoiceToPrint.description}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mt-1 tracking-widest">Construction Operations: {invoiceToPrint.expenseCategory}</p>
                        {isNalakathInvoice && (
                          <div className="mt-4 flex gap-4">
                            <Badge variant="outline" className="border-zinc-200 text-zinc-400 text-[8px] uppercase">Inclusive of Supplier Costs</Badge>
                            <Badge variant="outline" className="border-zinc-200 text-zinc-400 text-[8px] uppercase">Inclusive of Labour Payroll</Badge>
                          </div>
                        )}
                      </td>
                      <td className="py-8">
                        <Badge variant="outline" className="bg-zinc-50 text-zinc-600 border-zinc-200 text-[9px] font-bold uppercase tracking-widest">{invoiceToPrint.expenseType}</Badge>
                      </td>
                      <td className="py-8 text-right font-mono font-bold text-2xl text-zinc-900 pr-4">₹{invoiceToPrint.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <footer className="pt-16 border-t border-zinc-100 flex justify-between items-end gap-10">
                <div className="max-w-md space-y-6">
                  <div className="space-y-2">
                    <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Protocol & Terms</p>
                    <p className="text-[10px] leading-relaxed text-zinc-400 font-medium italic">
                      1. This is a secure electronically generated fiscal document from {isNalakathInvoice ? "Nalakath Construction" : "the Group Authorized Vendor"}.<br />
                      2. Valid for all internal and external group audit procedures for the Oval Palace development.<br />
                      3. Nalakath Construction reserves all rights under the 2026 Fiscal Charter.<br />
                      4. Inquiries should be directed to the Group Infrastructure HQ.
                    </p>
                  </div>
                  <div className="h-12 w-48 bg-zinc-50 rounded-2xl flex items-center justify-center border border-dashed border-zinc-200">
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em]">Infrastructure Data Verified</p>
                  </div>
                </div>
                
                <div className="bg-zinc-900 p-10 rounded-[3rem] min-w-[320px] text-white shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-4 opacity-10">
                    <FileText className="h-20 w-20 text-white" />
                  </div>
                  <div className="space-y-4 relative z-10">
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span>Taxable Value (Net)</span>
                      <span className="font-mono">₹{(invoiceToPrint.amount / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="flex justify-between items-center text-[10px] font-black uppercase tracking-widest text-zinc-500">
                      <span>GST Component (18%)</span>
                      <span className="font-mono">₹{(invoiceToPrint.amount - (invoiceToPrint.amount / 1.18)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                    </div>
                    <div className="pt-6 border-t border-zinc-800 mt-2 flex justify-between items-end">
                      <div className="space-y-1">
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Total Amount Due</span>
                        <p className="text-4xl font-black tracking-tighter text-white leading-none">₹{invoiceToPrint.amount.toLocaleString('en-IN')}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </footer>

              <div className="print:hidden flex gap-4 justify-end pt-12 border-t border-zinc-100 pb-6">
                <Button variant="outline" className="rounded-full px-8 gap-2 border-zinc-200 h-14 font-black uppercase text-[10px] tracking-widest hover:bg-zinc-50" onClick={() => setInvoiceToPrint(null)}>
                  Discard Preview
                </Button>
                <Button className="rounded-full px-10 gap-2 h-14 font-black uppercase text-[10px] tracking-widest bg-zinc-900 text-white hover:bg-black shadow-xl" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Save PDF / Print
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <BottomNav />
    </div>
  );
}