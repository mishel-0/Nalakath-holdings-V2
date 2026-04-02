
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";

export default function InvoicesPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const companyId = "nalakath-holdings-main"; // Using a stable ID for the group

  const invoicesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "invoices"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: invoices, isLoading } = useCollection(invoicesQuery);

  const handleAddInvoice = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newInvoice = {
      companyId,
      invoiceNumber: formData.get("invoiceNumber") as string,
      type: formData.get("type") as string,
      customerName: formData.get("customerName") as string,
      issueDate: formData.get("issueDate") as string,
      dueDate: formData.get("dueDate") as string,
      status: "Draft",
      subtotal: Number(formData.get("amount")),
      taxAmount: Number(formData.get("amount")) * 0.05,
      totalAmount: Number(formData.get("amount")) * 1.05,
      amountPaid: 0,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "invoices"), newInvoice);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Invoices</h1>
                <p className="text-muted-foreground">Manage billing and accounts receivable.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 border-white/10">
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                      <Plus className="h-4 w-4" /> New Invoice
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Create New Invoice</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddInvoice} className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="invoiceNumber">Invoice Number</Label>
                        <Input id="invoiceNumber" name="invoiceNumber" placeholder="INV-001" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">Type</Label>
                        <Select name="type" defaultValue="Sales">
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Sales">Sales (Income)</SelectItem>
                            <SelectItem value="Purchase">Purchase (Bill)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="customerName">Contact Name</Label>
                        <Input id="customerName" name="customerName" placeholder="Client or Vendor Name" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Base Amount (₹)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="issueDate">Issue Date</Label>
                          <Input id="issueDate" name="issueDate" type="date" required />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="dueDate">Due Date</Label>
                          <Input id="dueDate" name="dueDate" type="date" required />
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full text-black">Create Invoice</Button>
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
                  <Input placeholder="Search invoices..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead>Invoice #</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Total (₹)</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : invoices?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-10 text-muted-foreground">No invoices found.</TableCell></TableRow>
                    ) : (
                      invoices?.map((inv) => (
                        <TableRow key={inv.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-medium flex items-center gap-2">
                            <FileText className="h-4 w-4 text-primary" />
                            {inv.invoiceNumber}
                          </TableCell>
                          <TableCell>{inv.customerName}</TableCell>
                          <TableCell className="text-muted-foreground">{inv.issueDate}</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            ₹{inv.totalAmount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "rounded-full text-[10px]",
                              inv.status === "Paid" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                            )} variant="outline">
                              {inv.status}
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
