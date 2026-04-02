"use client";

import { useState, useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, ListTree, PieChart, Wallet, CreditCard, Banknote, Landmark } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";

const accountTypeStyles: Record<string, { color: string, icon: any }> = {
  Asset: { color: "text-blue-400 border-blue-400/20 bg-blue-400/10", icon: Wallet },
  Liability: { color: "text-orange-400 border-orange-400/20 bg-orange-400/10", icon: Landmark },
  Equity: { color: "text-purple-400 border-purple-400/20 bg-purple-400/10", icon: PieChart },
  Income: { color: "text-green-400 border-green-400/20 bg-green-400/10", icon: Banknote },
  Expense: { color: "text-red-400 border-red-400/20 bg-red-400/10", icon: CreditCard },
};

export default function ChartOfAccountsPage() {
  const db = useFirestore();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [search, setSearch] = useState("");
  const companyId = "nalakath-holdings-main";

  const accountsQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "accounts"), orderBy("accountNumber", "asc"));
  }, [db, companyId]);

  const { data: accounts, isLoading } = useCollection(accountsQuery);

  const filteredAccounts = useMemo(() => {
    if (!accounts) return [];
    return accounts.filter(a => 
      a.name?.toLowerCase().includes(search.toLowerCase()) || 
      a.accountNumber?.toLowerCase().includes(search.toLowerCase())
    );
  }, [accounts, search]);

  const handleAddAccount = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newAccount = {
      companyId,
      name: formData.get("name") as string,
      accountNumber: formData.get("accountNumber") as string,
      description: formData.get("description") as string,
      chartOfAccountTypeId: formData.get("type") as string,
      balance: 0,
      isContraAccount: false,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "accounts"), newAccount);
    setIsAddOpen(false);
    toast({ title: "Account Created", description: `Added ${newAccount.name} to COA.` });
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline flex items-center gap-3">
                  Chart of Accounts
                  <ListTree className="h-8 w-8 text-primary" />
                </h1>
                <p className="text-muted-foreground">Master list of all ledger accounts across divisions.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 gold-gradient text-black font-bold h-10 px-6">
                    <Plus className="h-4 w-4" /> New Account
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Register COA Account</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAccount} className="space-y-4 py-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label htmlFor="accountNumber">Account #</Label>
                        <Input id="accountNumber" name="accountNumber" placeholder="1010" required className="bg-white/5 border-white/10 rounded-xl h-11" />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="type">Account Type</Label>
                        <Select name="type" defaultValue="Asset">
                          <SelectTrigger className="bg-white/5 border-white/10 rounded-xl h-11">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="glass">
                            <SelectItem value="Asset">Asset</SelectItem>
                            <SelectItem value="Liability">Liability</SelectItem>
                            <SelectItem value="Equity">Equity</SelectItem>
                            <SelectItem value="Income">Income</SelectItem>
                            <SelectItem value="Expense">Expense</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="name">Account Name</Label>
                      <Input id="name" name="name" placeholder="Cash on Hand" required className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" placeholder="Short description of account use" className="bg-white/5 border-white/10 rounded-xl h-11" />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full gold-gradient text-black font-bold h-12 rounded-xl mt-2">Create Account</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5 px-6 py-4">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input 
                    placeholder="Search accounts by name or code..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-9 h-10 rounded-full border-white/10 bg-white/5 focus-visible:ring-primary/30" 
                  />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5 hover:bg-transparent">
                      <TableHead className="w-32 uppercase tracking-[0.2em] text-[10px] font-bold px-6">Code</TableHead>
                      <TableHead className="uppercase tracking-[0.2em] text-[10px] font-bold">Account Name</TableHead>
                      <TableHead className="uppercase tracking-[0.2em] text-[10px] font-bold">Type</TableHead>
                      <TableHead className="text-right uppercase tracking-[0.2em] text-[10px] font-bold px-6">Balance (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground animate-pulse font-mono text-xs tracking-widest uppercase">Syncing Master Data...</TableCell></TableRow>
                    ) : filteredAccounts.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-20 text-muted-foreground font-medium">No accounts registered in Chart of Accounts.</TableCell></TableRow>
                    ) : (
                      filteredAccounts.map((account) => {
                        const style = accountTypeStyles[account.chartOfAccountTypeId as keyof typeof accountTypeStyles] || { color: "text-muted-foreground", icon: ListTree };
                        const Icon = style.icon;
                        return (
                          <TableRow key={account.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                            <TableCell className="font-mono text-xs font-bold text-primary px-6">{account.accountNumber}</TableCell>
                            <TableCell>
                              <div className="flex flex-col">
                                <span className="font-semibold text-sm">{account.name}</span>
                                <span className="text-[10px] text-muted-foreground truncate max-w-[200px]">{account.description || "No description provided"}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={cn("text-[9px] font-bold uppercase tracking-widest px-2 py-0.5 border-transparent flex items-center gap-1.5 w-fit", style.color)}>
                                <Icon className="h-3 w-3" />
                                {account.chartOfAccountTypeId}
                              </Badge>
                            </TableCell>
                            <TableCell className="text-right font-mono font-bold text-sm px-6">
                              ₹{account.balance?.toLocaleString('en-IN')}
                            </TableCell>
                          </TableRow>
                        );
                      })
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
