
"use client";

import { useState } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Receipt } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";

export default function ExpensesPage() {
  const db = useFirestore();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const companyId = "nalakath-holdings-main";

  const expensesQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "expenses"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: expenses, isLoading } = useCollection(expensesQuery);

  const handleAddExpense = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newExpense = {
      companyId,
      expenseDate: formData.get("date") as string,
      description: formData.get("description") as string,
      amount: Number(formData.get("amount")),
      expenseCategory: formData.get("category") as string,
      status: "Recorded",
      isRecurring: false,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "expenses"), newExpense);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Expenses</h1>
                <p className="text-muted-foreground">Track company spending and overheads.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> Log Expense
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Log New Expense</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddExpense} className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Input id="description" name="description" placeholder="Office Rent, Supplies, etc." required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="category">Category</Label>
                      <Input id="category" name="category" placeholder="Utilities, Travel, Payroll" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="amount">Amount (₹)</Label>
                      <Input id="amount" name="amount" type="number" step="0.01" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="date">Expense Date</Label>
                      <Input id="date" name="date" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full text-black">Save Expense</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <Card className="glass border-white/5 overflow-hidden">
              <CardHeader className="border-b border-white/5 bg-white/5">
                <div className="relative w-full md:w-96">
                  <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input placeholder="Filter by description..." className="pl-9 h-10 rounded-full border-white/10 bg-white/5" />
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead>Date</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead>Category</TableHead>
                      <TableHead className="text-right">Amount (₹)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">Loading...</TableCell></TableRow>
                    ) : expenses?.length === 0 ? (
                      <TableRow><TableCell colSpan={4} className="text-center py-10 text-muted-foreground">No expenses recorded.</TableCell></TableRow>
                    ) : (
                      expenses?.map((exp) => (
                        <TableRow key={exp.id} className="border-white/5 hover:bg-white/5">
                          <TableCell className="text-muted-foreground">{exp.expenseDate}</TableCell>
                          <TableCell className="font-semibold flex items-center gap-2">
                            <Receipt className="h-4 w-4 text-primary" />
                            {exp.description}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="bg-white/5 text-xs">{exp.expenseCategory}</Badge>
                          </TableCell>
                          <TableCell className="text-right font-mono font-bold text-destructive">
                            ₹{exp.amount?.toLocaleString('en-IN')}
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
