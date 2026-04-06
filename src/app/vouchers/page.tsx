"use client";

import { useState, useRef, useMemo, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Upload, MoreHorizontal, Pencil, Trash2 } from "lucide-react";
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

export default function VouchersPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingVoucher, setEditingVoucher] = useState<any>(null);
  const [search, setSearch] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const companyId = "nalakath-holdings-main";

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileDocRef);

  useEffect(() => {
    if (!isProfileLoading && profile && profile.role !== "Admin") {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Payment Vouchers are restricted to Administrators.",
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
      v.voucherNumber?.toLowerCase().includes(search.toLowerCase())
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
      division: formData.get("division") as string,
      vendorName: formData.get("vendorName") as string,
      date: formData.get("date") as string,
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("paymentMethod") as string,
      status: formData.get("status") || "Pending",
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "vouchers"), newVoucher);
    setIsAddOpen(false);
    toast({ title: "Voucher Created", description: `Recorded for ${newVoucher.vendorName}` });
  };

  const handleUpdateVoucher = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingVoucher) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      voucherNumber: formData.get("voucherNumber") as string,
      division: formData.get("division") as string,
      vendorName: formData.get("vendorName") as string,
      date: formData.get("date") as string,
      amount: Number(formData.get("amount")),
      paymentMethod: formData.get("paymentMethod") as string,
      status: formData.get("status") as string,
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

  if (isProfileLoading || (profile && profile.role !== "Admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-primary font-mono tracking-widest uppercase">Authorizing...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Payment Vouchers</h1>
                <p className="text-muted-foreground">Proof of purchase and expenditure across divisions.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" className="rounded-full gap-2 border-white/10 hover:bg-white/5 h-10 px-4" onClick={() => fileInputRef.current?.click()}>
                  <Upload className="h-4 w-4" /> Import
                </Button>
                <input type="file" ref={fileInputRef} className="hidden" />
                <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                  <DialogTrigger asChild>
                    <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-10 px-4">
                      <Plus className="h-4 w-4" /> New Voucher
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                    <DialogHeader>
                      <DialogTitle>Register Proof of Purchase</DialogTitle>
                    </DialogHeader>
                    <form onSubmit={handleAddVoucher} className="space-y-4 py-4">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="voucherNumber">Voucher ID</Label>
                          <Input id="voucherNumber" name="voucherNumber" required className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="status">Initial Status</Label>
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
                        <Label htmlFor="division">Division</Label>
                        <Select name="division" defaultValue="Construction">
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="Construction">Construction</SelectItem>
                            <SelectItem value="Hospitality">Hospitality</SelectItem>
                            <SelectItem value="Real Estate">Real Estate</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="vendorName">Vendor</Label>
                        <Input id="vendorName" name="vendorName" required className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label htmlFor="amount">Amount (₹)</Label>
                          <Input id="amount" name="amount" type="number" step="0.01" required className="bg-white/5 border-white/10 rounded-xl" />
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
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="date">Date</Label>
                        <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <DialogFooter>
                        <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Save Voucher</Button>
                      </DialogFooter>
                    </form>
                  </DialogContent>
                </Dialog>
              </div>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              <StatCard title="Total Committed" value={stats.total} />
              <StatCard title="Settled Payments" value={stats.paid} color="text-green-500" />
              <StatCard title="Outstanding Dues" value={stats.pending} color="text-primary" />
            </div>

            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search vouchers..." 
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
                      <TableHead className="w-24 uppercase tracking-widest text-[9px] font-bold">Voucher #</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold">Division</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold">Vendor</TableHead>
                      <TableHead className="text-right uppercase tracking-widest text-[9px] font-bold">Amount (₹)</TableHead>
                      <TableHead className="text-center uppercase tracking-widest text-[9px] font-bold">Status</TableHead>
                      <TableHead className="w-16"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground animate-pulse font-mono text-xs uppercase tracking-widest">Syncing...</TableCell></TableRow>
                    ) : filteredVouchers.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center py-20 text-muted-foreground">No vouchers registered.</TableCell></TableRow>
                    ) : (
                      filteredVouchers.map((v) => (
                        <TableRow key={v.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                          <TableCell className="font-mono text-xs font-bold text-primary">{v.voucherNumber}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-[9px] font-bold uppercase tracking-tighter opacity-70 border-white/10 px-2 py-0">
                              {v.division}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-sm">{v.vendorName}</TableCell>
                          <TableCell className="text-right font-mono font-bold text-sm">
                            ₹{v.amount?.toLocaleString('en-IN')}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge className={cn(
                              "rounded-full text-[9px] uppercase font-bold tracking-widest px-2",
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
                              <DropdownMenuContent align="end" className="glass">
                                <DropdownMenuItem onClick={() => setEditingVoucher(v)} className="text-xs cursor-pointer">
                                  <Pencil className="h-3 w-3 mr-2" /> Edit
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleDeleteVoucher(v.id)} className="text-xs text-destructive cursor-pointer">
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
          </div>
        </main>
      </div>

      <Dialog open={!!editingVoucher} onOpenChange={(open) => !open && setEditingVoucher(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Payment Voucher</DialogTitle>
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
                <Label htmlFor="edit-v-division">Division</Label>
                <Select name="division" defaultValue={editingVoucher.division}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="glass">
                    <SelectItem value="Construction">Construction</SelectItem>
                    <SelectItem value="Hospitality">Hospitality</SelectItem>
                    <SelectItem value="Real Estate">Real Estate</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-v-vendor">Vendor</Label>
                <Input id="edit-v-vendor" name="vendorName" defaultValue={editingVoucher.vendorName} required />
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
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-v-date">Date</Label>
                <Input id="edit-v-date" name="date" type="date" defaultValue={editingVoucher.date} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl">Update Voucher</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}

function StatCard({ title, value, color = "text-foreground" }: any) {
  return (
    <Card className="glass border-white/5">
      <CardContent className="p-5 flex flex-col gap-1">
        <p className="text-[9px] uppercase tracking-[0.2em] font-bold text-muted-foreground">{title}</p>
        <p className={`text-xl font-bold font-mono ${color}`}>₹{value.toLocaleString('en-IN')}</p>
      </CardContent>
    </Card>
  );
}
