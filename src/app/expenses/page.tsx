
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
  Users, 
  HardHat, 
  Printer, 
  Download,
  X,
  CreditCard,
  CheckCircle2,
  Clock
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
  const [editingExpense, setEditingExpense] = useState<any>(null);
  const [invoiceToPrint, setInvoiceToPrint] = useState<any>(null);
  const [activeTab, setActiveTab] = useState("all");
  const companyId = activeDivision.id;

  const expensesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "expenses"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: expenses, isLoading } = useCollection(expensesQuery);

  const filteredExpenses = useMemo(() => {
    if (!expenses) return [];
    if (activeTab === "all") return expenses;
    return expenses.filter(e => e.expenseType === activeTab);
  }, [expenses, activeTab]);

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    const type = formData.get("expenseType") as string;
    
    const newExpense = {
      companyId,
      expenseDate: formData.get("date") as string,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      expenseCategory: formData.get("category") as string,
      expenseType: type,
      clientName: formData.get("clientName") || "",
      clientGstin: formData.get("clientGstin") || "",
      invoiceNumber: formData.get("invoiceNumber") || "",
      status: formData.get("status") || "Unpaid",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "expenses"), newExpense);
    setIsAddOpen(false);
    toast({ title: "Record Initialized", description: `Financial entry saved for ${activeDivision.name}.` });
  };

  const handleUpdateExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingExpense) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      expenseDate: formData.get("date") as string,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      expenseCategory: formData.get("category") as string,
      expenseType: formData.get("expenseType"),
      clientName: formData.get("clientName") || "",
      status: formData.get("status"),
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "expenses", editingExpense.id), updatedData);
    setEditingExpense(null);
    toast({ title: "Record Updated", description: "Entry modified successfully." });
  };

  const handleDeleteExpense = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "expenses", id));
    toast({ variant: "destructive", title: "Record Deleted", description: "Entry removed from ledger." });
  };

  const handlePrint = () => {
    window.print();
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
                <p className="text-muted-foreground truncate">Operational ledger for {activeDivision.name}.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 gold-gradient text-black font-bold hover:opacity-90 shadow-lg shadow-primary/20 px-6 h-11 shrink-0">
                    <Plus className="h-4 w-4" /> New Entry
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[500px]">
                  <DialogHeader>
                    <DialogTitle>Log Operation</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Type</Label>
                        <Select name="expenseType" defaultValue="General">
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
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
                      <div className="grid gap-2">
                        <Label>Payment Status</Label>
                        <Select name="status" defaultValue="Unpaid">
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="Paid">Paid (Settled)</SelectItem>
                            <SelectItem value="Unpaid">Unpaid (Due)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" required className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-primary">Contextual Details</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Client / Supplier Name</Label>
                          <Input name="clientName" placeholder="Entity Name" className="bg-white/5 border-white/10 rounded-xl h-10" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Reference / Inv #</Label>
                          <Input name="invoiceNumber" placeholder="REF-000" className="bg-white/5 border-white/10 rounded-xl h-10" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required className="bg-white/5 border-white/10 rounded-xl h-11 font-mono" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-xl h-11" />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" name="category" placeholder="e.g. Infrastructure, Maintenance" required className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl mt-2">Initialize Record</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <Tabs defaultValue="all" className="w-full" onValueChange={setActiveTab}>
              <TabsList className="glass p-1 rounded-full h-12 w-fit mb-8 border-white/10 overflow-x-auto max-w-full">
                <TabsTrigger value="all" className="rounded-full px-6 text-[10px] uppercase tracking-widest font-bold">Total Feed</TabsTrigger>
                <TabsTrigger value="Client Invoice" className="rounded-full px-6 text-[10px] uppercase tracking-widest font-bold">Client Invoices</TabsTrigger>
                <TabsTrigger value="Supplier Payment" className="rounded-full px-6 text-[10px] uppercase tracking-widest font-bold">Suppliers</TabsTrigger>
                <TabsTrigger value="Labour Payment" className="rounded-full px-6 text-[10px] uppercase tracking-widest font-bold">Labour</TabsTrigger>
              </TabsList>

              <Card className="glass border-white/5 overflow-hidden rounded-[2.5rem]">
                <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4 flex flex-row items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search operation stream..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                  </div>
                  <Badge variant="outline" className="hidden md:flex bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest px-3">
                    {filteredExpenses.length} Entries Logged
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="uppercase tracking-widest text-[9px] font-bold px-6">Date</TableHead>
                        <TableHead className="uppercase tracking-widest text-[9px] font-bold">Entity / Ref</TableHead>
                        <TableHead className="uppercase tracking-widest text-[9px] font-bold">Status</TableHead>
                        <TableHead className="text-right uppercase tracking-widest text-[9px] font-bold px-6">Amount (₹)</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse uppercase tracking-widest text-[10px] font-bold font-mono">Syncing Kernel...</TableCell></TableRow>
                      ) : filteredExpenses.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic text-sm">No specialized records found for this unit.</TableCell></TableRow>
                      ) : (
                        filteredExpenses.map((exp) => (
                          <TableRow key={exp.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                            <TableCell className="text-muted-foreground font-mono text-xs px-6">{exp.expenseDate}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-col gap-0.5 min-w-0">
                                <span className="font-bold text-sm truncate max-w-[200px]">{exp.clientName || "General Entry"}</span>
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">{exp.description}</span>
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
                            <TableCell className="text-right font-mono font-bold text-sm px-6 truncate overflow-hidden max-w-[150px]">
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
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modify Entry</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <form onSubmit={handleUpdateExpense} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select name="status" defaultValue={editingExpense.status || "Unpaid"}>
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
                  <Label htmlFor="edit-exp-date">Date</Label>
                  <Input id="edit-exp-date" name="date" type="date" defaultValue={editingExpense.expenseDate} required className="h-10" />
                </div>
              </div>
              <div className="grid gap-2">
                <Label>Entity Name</Label>
                <Input name="clientName" defaultValue={editingExpense.clientName} className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-exp-description">Description</Label>
                <Input id="edit-exp-description" name="description" defaultValue={editingExpense.description} required className="h-10" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-exp-amount">Amount (₹)</Label>
                <Input id="edit-exp-amount" name="amount" type="number" step="0.01" defaultValue={editingExpense.amount} required className="h-10" />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Update Record</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Corporate Invoice Generator Modal */}
      {invoiceToPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/95 backdrop-blur-md p-4 print:p-0 print:bg-white">
          <Card className="w-full max-w-4xl bg-white text-black overflow-hidden rounded-[2.5rem] print:rounded-none print:shadow-none shadow-2xl relative animate-in zoom-in-95 duration-300">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-6 right-6 print:hidden h-10 w-10 bg-zinc-100 hover:bg-zinc-200 rounded-full" 
              onClick={() => setInvoiceToPrint(null)}
            >
              <X className="h-5 w-5" />
            </Button>
            
            <div className="p-16 print:p-10 space-y-12 h-full overflow-y-auto max-h-[90vh] print:max-h-none print:overflow-visible custom-scrollbar">
              <header className="flex justify-between items-start border-b-4 border-zinc-900 pb-10">
                <div className="space-y-6">
                  <div className="space-y-1">
                    <h2 className="text-3xl font-black tracking-tighter uppercase leading-none">Nalakath Holdings</h2>
                    <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-[0.3em]">Executive Parent Group</p>
                  </div>
                  <div className="pt-2">
                    <div className="px-4 py-1.5 bg-zinc-900 text-white w-fit rounded-full mb-2">
                      <h3 className="text-xs font-bold uppercase tracking-widest">{activeDivision.name}</h3>
                    </div>
                    <p className="text-[10px] text-zinc-500 uppercase font-medium tracking-widest pl-1">{activeDivision.division} Portfolio Unit</p>
                  </div>
                </div>
                <div className="text-right space-y-2">
                  <h1 className="text-5xl font-black uppercase tracking-tighter text-zinc-900">Tax Invoice</h1>
                  <p className="text-sm font-mono font-bold text-zinc-400">REF: {invoiceToPrint.invoiceNumber || 'OVAL-' + invoiceToPrint.id.substring(0,6).toUpperCase()}</p>
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
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Client Identity</p>
                  <div className="space-y-1 pt-2">
                    <p className="text-2xl font-black text-zinc-900">{invoiceToPrint.clientName || "Recognized Asset"}</p>
                    <p className="text-xs font-mono text-zinc-500">GSTIN: {invoiceToPrint.clientGstin || "Unregistered / Internal"}</p>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest border-b border-zinc-100 pb-2">Fiscal Metadata</p>
                  <div className="pt-2">
                    <p className="text-xs leading-relaxed text-zinc-500 font-medium">
                      Generated via Nalakath Kernel V4.0<br />
                      Authorized Division Representative<br />
                      Compliance Period: Q2 2026
                    </p>
                  </div>
                </div>
              </div>

              <div className="pt-4">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-zinc-900">
                    <tr>
                      <th className="py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Detailed Description</th>
                      <th className="py-5 text-[10px] font-black uppercase tracking-widest text-zinc-400">Class</th>
                      <th className="py-5 text-right text-[10px] font-black uppercase tracking-widest text-zinc-400 pr-4">Base Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="py-8">
                        <p className="font-bold text-xl text-zinc-900 leading-tight">{invoiceToPrint.description}</p>
                        <p className="text-[10px] text-zinc-400 uppercase font-bold mt-1 tracking-widest">Operation Category: {invoiceToPrint.expenseCategory}</p>
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
                      1. This is a secure electronically generated fiscal document.<br />
                      2. Valid for all internal and external group audit procedures.<br />
                      3. Nalakath Holdings reserves all rights under the 2026 Fiscal Charter.<br />
                      4. Inquiries should be directed to the Group HQ Finance Division.
                    </p>
                  </div>
                  <div className="h-12 w-48 bg-zinc-50 rounded-2xl flex items-center justify-center border border-dashed border-zinc-200">
                    <p className="text-[8px] font-black text-zinc-300 uppercase tracking-[0.4em]">Secure Data Hash Verified</p>
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
                        <span className="text-[9px] font-black uppercase tracking-widest text-primary">Total Collection</span>
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
