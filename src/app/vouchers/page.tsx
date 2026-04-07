
"use client";

import { useState, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, MoreHorizontal, Pencil, Trash2, FileSpreadsheet, Layers, IndianRupee } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useRouter } from "next/navigation";
import { useDivision } from "@/context/DivisionContext";

export default function VouchersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { activeDivision } = useDivision();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [search, setSearch] = useState("");
  const companyId = activeDivision.id;

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileDocRef);

  useEffect(() => {
    if (!isProfileLoading && profile && profile.role !== "Admin" && profile.role !== "Accountant") {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Payment Vouchers are restricted to Administrators and Accountants.",
      });
      router.replace("/");
    }
  }, [profile, isProfileLoading, router, toast]);

  const vouchersQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "vouchers"), orderBy("date", "desc"));
  }, [db, companyId]);

  const { data: vouchers, isLoading } = useCollection(vouchersQuery);

  const filteredVouchers = useMemo(() => {
    if (!vouchers) return [];
    return vouchers.filter(v => 
      v.vendorName?.toLowerCase().includes(search.toLowerCase()) || 
      v.voucherNumber?.toLowerCase().includes(search.toLowerCase()) ||
      v.phaseName?.toLowerCase().includes(search.toLowerCase()) ||
      v.description?.toLowerCase().includes(search.toLowerCase()) ||
      v.expenseCategory?.toLowerCase().includes(search.toLowerCase())
    );
  }, [vouchers, search]);

  const stats = useMemo(() => {
    if (!vouchers) return { total: 0, pending: 0, paid: 0 };
    return vouchers.reduce((acc, v) => ({
      total: acc.total + (v.amount || 0),
      pending: acc.pending + (v.status === "Pending" ? (v.amount || 0) : 0),
      paid: acc.paid + (v.status === "Paid" ? (v.amount || 0) : 0)
    }), { total: 0, pending: 0, paid: 0 });
  }, [vouchers]);

  const handleAddVoucher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newVoucher = {
      companyId,
      voucherNumber: formData.get("voucherNumber") as string,
      division: activeDivision.division,
      vendorName: formData.get("vendorName") as string,
      date: formData.get("date") as string,
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("paymentMethod") as string,
      status: formData.get("status") || "Pending",
      phaseName: formData.get("phaseName") || "N/A",
      description: formData.get("description") || "",
      expenseCategory: "Manual Voucher",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "vouchers"), newVoucher);
    setIsAddOpen(false);
    toast({ title: "Voucher Created", description: `Recorded for ${newVoucher.vendorName} in ${activeDivision.name}.` });
  };

  const handleUpdateVoucher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVoucher) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      voucherNumber: formData.get("voucherNumber") as string,
      vendorName: formData.get("vendorName") as string,
      date: formData.get("date") as string,
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("paymentMethod") as string,
      status: formData.get("status") as string,
      phaseName: formData.get("phaseName") as string,
      description: formData.get("description") as string,
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "vouchers", editingVoucher.id), updatedData);
    setEditingVoucher(null);
    toast({ title: "Voucher Updated", description: "Payment voucher modified successfully." });
  };

  const handleDeleteVoucher = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "vouchers", id));
    toast({ variant: "destructive", title: "Voucher Deleted", description: "Record removed." });
  };

  const handleExportCSV = () => {
    if (!filteredVouchers.length) {
      toast({ variant: "destructive", title: "Export Failed", description: "No records to export." });
      return;
    }
    
    // Header definition for CSV
    const headers = [
      "DATE",
      "VOUCHER_ID",
      "DIVISION",
      "PROJECT_PHASE",
      "ENTITY_VENDOR",
      "CATEGORY",
      "DESCRIPTION",
      "AMOUNT_INR",
      "STATUS",
      "METHOD"
    ];

    // Map rows and escape quotes correctly for CSV
    const rows = filteredVouchers.map(v => [
      v.date || '',
      v.voucherNumber || '',
      activeDivision.division || '',
      v.phaseName || 'N/A',
      (v.vendorName || '').replace(/"/g, '""'),
      v.expenseCategory || 'General',
      (v.description || '').replace(/"/g, '""'),
      v.amount || 0,
      v.status || 'Pending',
      v.paymentMethod || 'N/A'
    ]);

    // Build CSV content with BOM for Excel compatibility
    const csvContent = headers.join(",") + "\n" + 
      rows.map(row => row.map(cell => `"${cell}"`).join(",")).join("\n");
    
    // Add UTF-8 BOM to ensure Excel opens it correctly with multiple columns
    const blob = new Blob(["\ufeff" + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `NALAKATH_VOUCHERS_${activeDivision.id.toUpperCase()}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    toast({ title: "Export Successful", description: "Audit-ready Excel ledger downloaded." });
  };

  if (isProfileLoading || (profile && profile.role !== "Admin" && profile.role !== "Accountant")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full gold-gradient animate-pulse shadow-lg shadow-primary/20" />
          <p className="text-primary font-mono tracking-widest uppercase text-xs">Authorizing Access...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0 overflow-hidden">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">Payment Vouchers</h1>
                <p className="text-muted-foreground truncate">Fiscal audit trail for {activeDivision.name}.</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5 h-11 px-6 shadow-sm" onClick={handleExportCSV}>
                  <FileSpreadsheet className="h-4 w-4 text-green-500" /> Export Audit Ledger
                </Button>
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-11 px-6 shadow-lg shadow-primary/20">
                      <Plus className="h-4 w-4" /> New Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Register Payment Voucher</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddVoucher} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="voucherNumber">Voucher ID</Label>
                          <Input id="voucherNumber" name="voucherNumber" placeholder="V-000" required className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="status">Status</Label>
                          <Select name="status" defaultValue="Pending">
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass">
                              <SelectItem value="Pending">Pending</SelectItem>
                              <SelectItem value="Paid">Paid</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="phaseName">Target Phase</Label>
                        <Input id="phaseName" name="phaseName" placeholder="e.g. Phase 2: Operations" className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vendorName">Vendor / Entity</Label>
                        <Input id="vendorName" name="vendorName" placeholder="Recipient Name" required className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="description">Details</Label>
                        <Input id="description" name="description" className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input id="amount" name="amount" type="number" step="0.01" required className="bg-white/5 border-white/10 rounded-xl font-mono" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="paymentMethod">Method</Label>
                          <Select name="paymentMethod" defaultValue="Bank Transfer">
                            <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="glass">
                              <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                              <SelectItem value="Cash">Cash</SelectItem>
                              <SelectItem value="Cheque">Cheque</SelectItem>
                              <SelectItem value="Journal Transfer">Journal Transfer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Posting Date</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl mt-2">Initialize Voucher</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Division Commitment" value={stats.total} icon={IndianRupee} />
              <StatCard title="Paid & Settled" value={stats.paid} color="text-green-500" icon={IndianRupee} />
              <StatCard title="Outstanding Liabilities" value={stats.pending} color="text-primary" icon={IndianRupee} />
            </div>

            <Card className="glass border-white/5 overflow-hidden rounded-[2rem]">
              <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search audit trail..." 
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
                      <TableHead className="w-24 uppercase tracking-[0.2em] text-[9px] font-bold px-6">ID</TableHead>
                      <TableHead className="uppercase tracking-[0.2em] text-[9px] font-bold">Voucher Details</TableHead>
                      <TableHead className="uppercase tracking-[0.2em] text-[9px] font-bold">Category</TableHead>
                      <TableHead className="text-right uppercase tracking-[0.2em] text-[9px] font-bold">Amount (₹)</TableHead>
                      <TableHead className="text-center uppercase tracking-[0.2em] text-[9px] font-bold px-6">Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground animate-pulse font-mono text-[10px] tracking-widest uppercase">Syncing Ledger...</TableCell></TableRow>
                    ) : filteredVouchers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground italic text-sm">No vouchers recorded for this division.</TableCell></TableRow>
                    ) : (
                      filteredVouchers.map((v) => (
                        <TableRow key={v.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                          <TableCell className="font-mono text-xs font-bold text-primary px-6">{v.voucherNumber}</TableCell>
                          <TableCell className="py-4">
                            <div className="flex flex-col gap-0.5">
                              <span className="font-bold text-sm truncate max-w-[250px]">{v.vendorName}</span>
                              <div className="flex items-center gap-2">
                                <span className="text-[10px] text-muted-foreground italic truncate max-w-[180px]">{v.description}</span>
                                {v.phaseName && (
                                  <Badge variant="outline" className="text-[8px] uppercase tracking-tighter h-4 border-white/5 bg-white/5 text-muted-foreground">
                                    <Layers className="h-2 w-2 mr-1" /> {v.phaseName}
                                  </Badge>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="secondary" className="bg-white/5 text-[9px] uppercase tracking-widest font-bold">
                              {v.expenseCategory || "General"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm truncate max-w-[150px]">
                            ₹{v.amount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-center px-6">
                            <Badge className={cn(
                              "rounded-full text-[9px] uppercase font-bold tracking-widest px-3 py-0.5",
                              v.status === "Paid" ? "bg-green-500/10 text-green-500 border-green-500/20" : "bg-primary/10 text-primary border-primary/20"
                            )} variant="outline">
                              {v.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                                  <MoreHorizontal className="h-4 w-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="glass rounded-2xl">
                                <DropdownMenuItem onClick={() => setEditingVoucher(v)} className="text-xs cursor-pointer">
                                  <Pencil className="h-3 w-3 mr-2" /> Modify Record
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteVoucher(v.id)} className="text-xs text-destructive cursor-pointer">
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
          </div>
        </main>
      </div>

      <Dialog open={!!editingVoucher} onOpenChange={(open) => !open && setEditingVoucher(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Voucher # {editingVoucher?.voucherNumber}</DialogTitle>
          </DialogHeader>
          {editingVoucher && (
            <form onSubmit={handleUpdateVoucher} className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-v-number">Voucher ID</Label>
                  <Input id="edit-v-number" name="voucherNumber" defaultValue={editingVoucher.voucherNumber} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-v-status">Status</Label>
                  <Select name="status" defaultValue={editingVoucher.status}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="Pending">Pending</SelectItem>
                      <SelectItem value="Paid">Paid</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-v-phase">Phase</Label>
                <Input id="edit-v-phase" name="phaseName" defaultValue={editingVoucher.phaseName} />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-v-vendor">Vendor / Recipient</Label>
                <Input id="edit-v-vendor" name="vendorName" defaultValue={editingVoucher.vendorName} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-v-desc">Description</Label>
                <Input id="edit-v-desc" name="description" defaultValue={editingVoucher.description} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-v-amount">Amount (₹)</Label>
                  <Input id="edit-v-amount" name="amount" type="number" step="0.01" defaultValue={editingVoucher.amount} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-v-method">Method</Label>
                  <Select name="paymentMethod" defaultValue={editingVoucher.paymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="glass">
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Cheque">Cheque</SelectItem>
                      <SelectItem value="Journal Transfer">Journal Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-v-date">Posting Date</Label>
                <Input id="edit-v-date" name="date" type="date" defaultValue={editingVoucher.date} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl mt-2">Update Record</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}

function StatCard({ title, value, color = "text-foreground", icon: Icon }: any) {
  return (
    <Card className="glass border-white/5 min-w-0 overflow-hidden group">
      <CardContent className="p-6 flex flex-col gap-1 overflow-hidden relative">
        {Icon && <Icon className="absolute right-4 top-4 h-12 w-12 opacity-5 text-muted-foreground group-hover:scale-110 ios-transition" />}
        <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-muted-foreground truncate">{title}</p>
        <p className={`text-xl md:text-2xl font-black font-mono truncate ${color}`} title={value.toLocaleString('en-IN')}>
          ₹{value.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
        </p>
      </CardContent>
    </Card>
  );
}
