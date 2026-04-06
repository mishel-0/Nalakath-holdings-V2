"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Landmark, TrendingUp, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function LoansPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState<any>(null);
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
        description: "Liability management is restricted to Administrators.",
      });
      router.replace("/");
    }
  }, [profile, isProfileLoading, router, toast]);

  const loansQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "loans"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: loans, isLoading } = useCollection(loansQuery);

  const handleAddLoan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newLoan = {
      companyId,
      lenderName: formData.get("lender") as string,
      loanType: formData.get("type") as string,
      principalAmount: Number(formData.get("amount")),
      interestRate: Number(formData.get("rate")) / 100,
      issueDate: formData.get("issueDate") as string,
      maturityDate: formData.get("maturityDate") as string,
      paymentFrequency: "Monthly",
      totalPayments: 60,
      outstandingBalance: Number(formData.get("amount")),
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "loans"), newLoan);
    setIsAddOpen(false);
    toast({ title: "Loan Recorded", description: `Added liability for ${newLoan.lenderName}.` });
  };

  const handleUpdateLoan = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingLoan) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      lenderName: formData.get("lender") as string,
      loanType: formData.get("type") as string,
      principalAmount: Number(formData.get("amount")),
      interestRate: Number(formData.get("rate")) / 100,
      outstandingBalance: Number(formData.get("balance")),
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "loans", editingLoan.id), updatedData);
    setEditingLoan(null);
    toast({ title: "Loan Updated", description: "Liability details modified." });
  };

  const handleDeleteLoan = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "loans", id));
    toast({ variant: "destructive", title: "Loan Deleted", description: "Liability removed from records." });
  };

  if (isProfileLoading || (profile && profile.role !== "Admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-primary font-mono tracking-widest uppercase">Checking Permissions...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-20 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Loans & Liabilities</h1>
                <p className="text-muted-foreground">Manage financial obligations and interest tracking.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> New Loan
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Record New Loan</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddLoan} className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="lender">Lender Name</Label>
                      <Input id="lender" name="lender" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Loan Type</Label>
                      <Input id="type" name="type" required />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="amount">Principal (₹)</Label>
                        <Input id="amount" name="amount" type="number" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="rate">Interest Rate (%)</Label>
                        <Input id="rate" name="rate" type="number" step="0.01" required />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="issueDate">Issue Date</Label>
                        <Input id="issueDate" name="issueDate" type="date" required />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="maturityDate">Maturity Date</Label>
                        <Input id="maturityDate" name="maturityDate" type="date" required />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full text-black">Record Loan</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <div className="grid gap-6 lg:grid-cols-2">
              {isLoading ? (
                <p className="text-muted-foreground">Loading loans...</p>
              ) : loans?.length === 0 ? (
                <Card className="glass border-white/5 col-span-full py-12 text-center">
                  <p className="text-muted-foreground">No loans recorded yet.</p>
                </Card>
              ) : (
                loans?.map((loan) => (
                  <Card key={loan.id} className="glass border-white/5 overflow-hidden relative">
                    <div className="absolute top-4 right-4 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem onClick={() => setEditingLoan(loan)} className="text-xs cursor-pointer">
                            <Pencil className="h-3 w-3 mr-2" /> Edit Details
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteLoan(loan.id)} className="text-xs text-destructive cursor-pointer">
                            <Trash2 className="h-3 w-3 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <CardHeader className="flex flex-row items-center justify-between pr-12">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-primary/10 rounded-xl">
                          <Landmark className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <CardTitle className="text-lg">{loan.lenderName}</CardTitle>
                          <p className="text-xs text-muted-foreground">{loan.loanType}</p>
                        </div>
                      </div>
                      <Badge className="bg-orange-500/10 text-orange-500 border-orange-500/20">{(loan.interestRate * 100).toFixed(1)}% APR</Badge>
                    </CardHeader>
                    <CardContent className="space-y-6">
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Outstanding Balance</p>
                          <p className="text-2xl font-bold font-mono">₹{loan.outstandingBalance?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="space-y-1 text-right">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Principal</p>
                          <p className="text-lg font-semibold text-muted-foreground">₹{loan.principalAmount?.toLocaleString('en-IN')}</p>
                        </div>
                      </div>
                      <div className="flex justify-between text-sm">
                        <div className="flex items-center gap-1.5 text-muted-foreground">
                          <Calendar className="h-4 w-4" /> {loan.maturityDate}
                        </div>
                        <div className="flex items-center gap-1.5 text-green-500 font-medium">
                          <TrendingUp className="h-4 w-4" /> Flow Optimal
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>

      <Dialog open={!!editingLoan} onOpenChange={(open) => !open && setEditingLoan(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Loan Details</DialogTitle>
          </DialogHeader>
          {editingLoan && (
            <form onSubmit={handleUpdateLoan} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-l-lender">Lender Name</Label>
                <Input id="edit-l-lender" name="lender" defaultValue={editingLoan.lenderName} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-l-type">Loan Type</Label>
                <Input id="edit-l-type" name="type" defaultValue={editingLoan.loanType} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-l-amount">Principal (₹)</Label>
                  <Input id="edit-l-amount" name="amount" type="number" defaultValue={editingLoan.principalAmount} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-l-rate">Interest Rate (%)</Label>
                  <Input id="edit-l-rate" name="rate" type="number" step="0.01" defaultValue={editingLoan.interestRate * 100} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-l-balance">Outstanding Balance (₹)</Label>
                <Input id="edit-l-balance" name="balance" type="number" defaultValue={editingLoan.outstandingBalance} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full text-black">Update Loan</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}
