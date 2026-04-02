
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, MapPin, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function AssetsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
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
        description: "Asset management is restricted to Administrators.",
      });
      router.replace("/");
    }
  }, [profile, isProfileLoading, router, toast]);

  const assetsQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "assets"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: assets, isLoading } = useCollection(assetsQuery);

  if (isProfileLoading || (profile && profile.role !== "Admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-primary font-mono tracking-widest uppercase">Authorizing...</div>
      </div>
    );
  }

  const handleAddAsset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newAsset = {
      companyId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      purchaseDate: formData.get("purchaseDate") as string,
      purchasePrice: Number(formData.get("price")),
      assetType: formData.get("type") as string,
      usefulLifeYears: 5,
      salvageValue: 0,
      depreciationMethod: "Straight Line",
      currentBookValue: Number(formData.get("price")),
      accumulatedDepreciation: 0,
      status: "Active",
      location: formData.get("location") as string,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "assets"), newAsset);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Assets</h1>
                <p className="text-muted-foreground">Capital equipment and property inventory.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> Add Asset
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Register New Asset</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddAsset} className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Asset Name</Label>
                      <Input id="name" name="name" placeholder="Construction Crane, Office Building, etc." required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="type">Asset Type</Label>
                      <Input id="type" name="type" placeholder="Machinery, Real Estate, Vehicle" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="price">Purchase Price (₹)</Label>
                      <Input id="price" name="price" type="number" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="location">Location</Label>
                      <Input id="location" name="location" placeholder="Site Alpha, HQ, etc." required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="purchaseDate">Purchase Date</Label>
                      <Input id="purchaseDate" name="purchaseDate" type="date" required />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full text-black">Register Asset</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <p className="text-muted-foreground">Loading assets...</p>
              ) : assets?.length === 0 ? (
                <Card className="glass border-white/5 col-span-full py-12 text-center">
                  <p className="text-muted-foreground">No assets found. Start by adding one.</p>
                </Card>
              ) : (
                assets?.map((asset) => (
                  <Card key={asset.id} className="glass border-white/5 hover:scale-[1.02] ios-transition">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                          <Layers className="h-6 w-6 text-primary" />
                        </div>
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20">
                          {asset.assetType}
                        </Badge>
                      </div>
                      <CardTitle className="mt-4 text-xl">{asset.name}</CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <MapPin className="h-4 w-4" /> {asset.location}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="h-4 w-4" /> Purchased {asset.purchaseDate}
                      </div>
                      <div className="pt-4 border-t border-white/5">
                        <p className="text-xs uppercase tracking-wider text-muted-foreground">Current Book Value</p>
                        <p className="text-2xl font-bold font-mono text-primary">₹{asset.currentBookValue?.toLocaleString('en-IN')}</p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
