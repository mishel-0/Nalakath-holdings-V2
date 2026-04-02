
"use client";

import { useState, useRef } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Download, Upload, Receipt, FileText } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function VouchersPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyId = "nalakath-holdings-main";

  const vouchersQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "vouchers"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: vouchers, isLoading } = useCollection(vouchersQuery);

  const handleAddVoucher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newVoucher = {
      companyId,
      voucherNumber: formData.get("voucherNumber") as string,
      division: formData.get("division") as string,
      vendorName: formData.get("vendorName") as string,
      date: formData.get("date") as string,
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("paymentMethod") as string,
      status: "Verified",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "vouchers"), newVoucher);
    setIsAddOpen(false);
    toast({ title: "Voucher Created", description: `Voucher ${newVoucher.voucherNumber} has been recorded.` });
  };

  const handleExport = () => {
    if (!vouchers || vouchers.length === 0) return;
    const dataStr = JSON.stringify(vouchers, null, 2);
    const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
    const exportFileDefaultName = `payment_vouchers_${new Date().toISOString().split('T')[0]}.json`;
    const linkElement = document.createElement('a');
    linkElement.setAttribute('href', dataUri);
    linkElement.setAttribute('download', exportFileDefaultName);
    linkElement.click();
  };

  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          json.forEach(item => {
            const { id, ...data } = item;
            addDocumentNonBlocking(collection(db, "companies", companyId, "vouchers"), {
              ...data,
              createdAt: new Date().toISOString(),
              updatedAt: new Date().toISOString(),
            });
          });
          toast({ title: "Import Successful", description: `${json.length} vouchers have been imported.` });
        }
      } catch (err) {
        toast({ variant: "destructive", title: "Import Failed", description: "Invalid file format." });
      }
    };
    reader.readAsText(file);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Payment Vouchers</h1>
                <p className="text-muted-foreground">Proof of transactions for division purchases.</p>
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleImport} 
                  accept=".json" 
                  className="hidden" 
                />
                <Button 
                  variant="outline" 
                  className="rounded-full gap-2 border-white/10"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="h-4 w-4" /> Import
                </Button>
                <Button 
                  variant="outline" 
                  className="rounded-full gap-2 border-white/10"
                  onClick={handleExport}
                >
                  <Download className="h-4 w-4" /> Export
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                      <Plus className="h-4 w-4" /> Create Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>New Payment Voucher</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddVoucher} className="space-y-4 py-4">
                      <div className="grid gap-2">
                        <Label htmlFor="voucherNumber">Voucher ID</Label>
                        <Input id="voucherNumber" name="voucherNumber" placeholder="PV-1001" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="division">Division</Label>
                        <Select name="division" defaultValue="Nalakath Construction">
                          <SelectTrigger>
                            <SelectValue placeholder="Select division" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="Nalakath Construction">Nalakath Construction</SelectItem>
                            <SelectItem value="Green Villa">Green Villa</SelectItem>
                            <SelectItem value="Oval Palace Resort">Oval Palace Resort</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vendorName">Vendor / Supplier</Label>
                        <Input id="vendorName" name="vendorName" placeholder="Acme Supplies Ltd." required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Amount (₹)</Label>
                        <Input id="amount" name="amount" type="number" step="0.01" required />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="date">Purchase Date</Label>
                          <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="paymentMethod">Method</Label>
                          <Select name="paymentMethod" defaultValue="Bank Transfer">
                            <SelectTrigger>
                              <SelectValue placeholder="Select method" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                              <SelectItem value="UPI">UPI</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full text-black">Record Proof</Button>
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
                  <Input placeholder="Search vouchers..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead>Voucher #</TableHead>
                      <TableHead>Division</TableHead>
                      <TableHead>Vendor</TableHead>
                      <TableHead>Date</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                      <TableHead className="text-center">Proof</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : vouchers?.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-10 text-muted-foreground">No vouchers found.</TableCell></TableRow>
                    ) : (
                      vouchers?.map((v) => (
                        <TableRow key={v.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="font-medium flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            {v.voucherNumber}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[10px] opacity-70 border-white/10">
                              {v.division}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold">{v.vendorName}</TableCell>
                          <TableCell className="text-muted-foreground">{v.date}</TableCell>
                          <TableCell className="text-right font-mono font-bold">
                            ₹{v.amount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-primary/20">
                              <FileText className="h-4 w-4 text-primary" />
                            </Button>
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
