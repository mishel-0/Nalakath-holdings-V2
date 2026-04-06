
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
  CreditCard
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
      // Specialized Fields
      clientName: formData.get("clientName") || "",
      clientGstin: formData.get("clientGstin") || "",
      invoiceNumber: formData.get("invoiceNumber") || "",
      supplierName: formData.get("supplierName") || "",
      labourName: formData.get("labourName") || "",
      status: "Recorded",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "expenses"), newExpense);
    setIsAddOpen(false);
    toast({ title: "Operation Logged", description: `Financial record saved for ${activeDivision.name}.` });
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
      supplierName: formData.get("supplierName") || "",
      labourName: formData.get("labourName") || "",
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "expenses", editingExpense.id), updatedData);
    setEditingExpense(null);
    toast({ title: "Record Modified", description: "Entry updated successfully." });
  };

  const handleDeleteExpense = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "expenses", id));
    toast({ variant: "destructive", title: "Record Purged", description: "Entry removed from ledger." });
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
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">Financial Ops</h1>
                <p className="text-muted-foreground truncate">Operational ledger for {activeDivision.name}.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 gold-gradient text-black font-bold hover:opacity-90 shadow-lg shadow-primary/20">
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
                        <Label>Operation Type</Label>
                        <Select name="expenseType" defaultValue="General">
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
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
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                    </div>

                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" required className="bg-white/5 border-white/10 rounded-xl" />
                    </div>

                    {/* Dynamic Fields based on Type would ideally use state, but for MVP we use a simple grid and let user fill what matters */}
                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <p className="text-[9px] uppercase font-bold tracking-widest text-primary">Specialized Context</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Client / Supplier / Labour</Label>
                          <Input name="clientName" placeholder="Name" className="bg-white/5 border-white/10 rounded-xl h-9" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Ref / Invoice #</Label>
                          <Input name="invoiceNumber" placeholder="ID-000" className="bg-white/5 border-white/10 rounded-xl h-9" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="category">Category</Label>
                        <Input id="category" name="category" placeholder="e.g. F&B, Maintenance" required className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required className="bg-white/5 border-white/10 rounded-xl font-mono" />
                      </div>
                    </div>

                    <DialogFooter>
                      <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Initialize Record</Button>
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

              <Card className="glass border-white/5 overflow-hidden rounded-[2rem]">
                <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4 flex flex-row items-center justify-between">
                  <div className="relative w-full md:w-96">
                    <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search records..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                  </div>
                  <Badge variant="outline" className="hidden md:flex bg-primary/5 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest px-3">
                    {filteredExpenses.length} Records Active
                  </Badge>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader className="bg-white/5">
                      <TableRow className="border-white/5">
                        <TableHead className="uppercase tracking-widest text-[9px] font-bold px-6">Date</TableHead>
                        <TableHead className="uppercase tracking-widest text-[9px] font-bold">Entity/Desc</TableHead>
                        <TableHead className="uppercase tracking-widest text-[9px] font-bold">Type</TableHead>
                        <TableHead className="text-right uppercase tracking-widest text-[9px] font-bold px-6">Amount (₹)</TableHead>
                        <TableHead className="w-16"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {isLoading ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse uppercase tracking-widest text-xs font-bold font-mono">Syncing Kernel...</TableCell></TableRow>
                      ) : filteredExpenses.length === 0 ? (
                        <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground italic">No specialized records found for this view.</TableCell></TableRow>
                      ) : (
                        filteredExpenses.map((exp) => (
                          <TableRow key={exp.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                            <TableCell className="text-muted-foreground font-mono text-xs px-6">{exp.expenseDate}</TableCell>
                            <TableCell className="py-4">
                              <div className="flex flex-col gap-0.5">
                                <span className="font-bold text-sm truncate max-w-[250px]">{exp.clientName || exp.supplierName || exp.labourName || "General Expense"}</span>
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[200px]">{exp.description}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn(
                                "text-[8px] font-bold uppercase tracking-widest px-2 py-0.5 border-transparent",
                                exp.expenseType === "Client Invoice" ? "bg-blue-500/10 text-blue-400" :
                                exp.expenseType === "Supplier Payment" ? "bg-orange-500/10 text-orange-400" :
                                exp.expenseType === "Labour Payment" ? "bg-purple-500/10 text-purple-400" :
                                "bg-white/5 text-muted-foreground"
                              )}>
                                {exp.expenseType || "General"}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-destructive px-6 truncate">
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
                                      <FileText className="h-3 w-3 mr-2" /> Generate Invoice
                                    </DropdownMenuItem>
                                  )}
                                  <DropdownMenuItem onClick={() => setEditingExpense(exp)} className="text-xs cursor-pointer">
                                    <Pencil className="h-3 w-3 mr-2" /> Edit Record
                                  </DropdownMenuItem>
                                  <DropdownMenuItem onClick={() => handleDeleteExpense(exp.id)} className="text-xs text-destructive cursor-pointer">
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
            </Tabs>
          </div>
        </main>
      </div>

      {/* Edit Dialog */}
      <Dialog open={!!editingExpense} onOpenChange={(open) => !open && setEditingExpense(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Modify Financial Entry</DialogTitle>
          </DialogHeader>
          {editingExpense && (
            <form onSubmit={handleUpdateExpense} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label>Operation Type</Label>
                <Select name="expenseType" defaultValue={editingExpense.expenseType || "General"}>
                  <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
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
                <Label>Entity Name</Label>
                <Input name="clientName" defaultValue={editingExpense.clientName || editingExpense.supplierName || editingExpense.labourName} className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-exp-description">Description</Label>
                <Input id="edit-exp-description" name="description" defaultValue={editingExpense.description} required className="bg-white/5 border-white/10 rounded-xl" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-exp-amount">Amount (₹)</Label>
                  <Input id="edit-exp-amount" name="amount" type="number" step="0.01" defaultValue={editingExpense.amount} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-exp-date">Date</Label>
                  <Input id="edit-exp-date" name="date" type="date" defaultValue={editingExpense.expenseDate} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Update Entry</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Invoice Generator Modal */}
      {invoiceToPrint && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 print:p-0 print:bg-white">
          <Card className="w-full max-w-4xl bg-white text-black overflow-hidden rounded-[2rem] print:rounded-none print:shadow-none shadow-2xl relative">
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute top-4 right-4 print:hidden" 
              onClick={() => setInvoiceToPrint(null)}
            >
              <X className="h-6 w-6" />
            </Button>
            
            <div className="p-12 print:p-8 space-y-12">
              <header className="flex justify-between items-start border-b border-zinc-100 pb-8">
                <div className="space-y-4">
                  <div className="space-y-1">
                    <h2 className="text-2xl font-black tracking-tighter uppercase">Nalakath Holdings</h2>
                    <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Group Parent Company</p>
                  </div>
                  <div className="pt-2">
                    <h3 className="text-lg font-bold text-primary uppercase">{activeDivision.name}</h3>
                    <p className="text-[10px] text-zinc-500 uppercase tracking-widest">{activeDivision.division} Division</p>
                  </div>
                </div>
                <div className="text-right space-y-1">
                  <h1 className="text-4xl font-black uppercase tracking-tighter">Tax Invoice</h1>
                  <p className="text-sm font-mono text-zinc-400">#{invoiceToPrint.invoiceNumber || 'INV-OVAL-' + invoiceToPrint.id.substring(0,5).toUpperCase()}</p>
                  <p className="text-xs text-zinc-500 pt-4 uppercase font-bold">Date: {invoiceToPrint.expenseDate}</p>
                </div>
              </header>

              <div className="grid grid-cols-2 gap-12">
                <div className="space-y-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Billed To</p>
                  <div className="space-y-1">
                    <p className="text-xl font-bold">{invoiceToPrint.clientName || "Valued Client"}</p>
                    <p className="text-sm text-zinc-500">GSTIN: {invoiceToPrint.clientGstin || "Unregistered"}</p>
                  </div>
                </div>
                <div className="space-y-4 text-right">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Payment Status</p>
                  <Badge className="bg-green-100 text-green-700 border-none px-4 py-1 text-[10px] font-black uppercase tracking-widest">
                    RECOGNIZED
                  </Badge>
                </div>
              </div>

              <div className="pt-8">
                <table className="w-full text-left">
                  <thead className="border-b-2 border-zinc-900">
                    <tr>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Description</th>
                      <th className="py-4 text-[10px] font-black uppercase tracking-widest">Category</th>
                      <th className="py-4 text-right text-[10px] font-black uppercase tracking-widest px-4">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-zinc-100">
                    <tr>
                      <td className="py-6 font-semibold text-lg">{invoiceToPrint.description}</td>
                      <td className="py-6 text-sm text-zinc-500 uppercase tracking-widest">{invoiceToPrint.expenseCategory}</td>
                      <td className="py-6 text-right font-mono font-bold text-xl px-4">₹{invoiceToPrint.amount.toLocaleString('en-IN')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <footer className="pt-12 border-t border-zinc-100 flex justify-between items-end">
                <div className="max-w-sm space-y-4">
                  <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">Terms & Notes</p>
                  <p className="text-[10px] leading-relaxed text-zinc-500">
                    This is an electronically generated fiscal document from the Nalakath Executive Data Engine. 
                    Valid for all internal accounting and audit cycles.
                  </p>
                </div>
                <div className="bg-zinc-50 p-8 rounded-[2rem] min-w-[250px] space-y-4">
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                    <span>Taxable Amount</span>
                    <span className="font-mono">₹{(invoiceToPrint.amount / 1.18).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="flex justify-between items-center text-[10px] font-bold text-zinc-400 uppercase">
                    <span>GST (18%)</span>
                    <span className="font-mono">₹{(invoiceToPrint.amount - (invoiceToPrint.amount / 1.18)).toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
                  </div>
                  <div className="pt-4 border-t border-zinc-200 flex justify-between items-end">
                    <span className="text-[10px] font-black uppercase tracking-widest">Total Payable</span>
                    <span className="text-3xl font-black tracking-tighter">₹{invoiceToPrint.amount.toLocaleString('en-IN')}</span>
                  </div>
                </div>
              </footer>

              <div className="print:hidden flex gap-4 justify-end pt-12 border-t border-zinc-100">
                <Button variant="outline" className="rounded-full px-8 gap-2 border-zinc-200 h-12 font-bold" onClick={() => setInvoiceToPrint(null)}>
                  Close Preview
                </Button>
                <Button className="rounded-full px-8 gap-2 h-12 font-bold bg-black text-white hover:bg-zinc-800" onClick={handlePrint}>
                  <Printer className="h-4 w-4" /> Print / Save PDF
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
