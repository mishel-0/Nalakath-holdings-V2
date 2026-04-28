"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, MapPin, Calendar, MoreVertical, Pencil, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDivision } from "@/context/DivisionContext";

export default function AssetsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { activeDivision } = useDivision();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingAsset, setEditingAsset] = useState<any>(null);
  const companyId = activeDivision.id;

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
    toast({ title: "Asset Registered", description: `Added ${newAsset.name} to ${activeDivision.name}.` });
  };

  const handleUpdateAsset = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAsset) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      name: formData.get("name") as string,
      assetType: formData.get("type") as string,
      purchasePrice: Number(formData.get("price")),
      location: formData.get("location") as string,
      currentBookValue: Number(formData.get("bookValue")),
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "assets", editingAsset.id), updatedData);
    setEditingAsset(null);
    toast({ title: "Asset Updated", description: "Asset records modified successfully." });
  };

  const handleDeleteAsset = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "assets", id));
    toast({ variant: "destructive", title: "Asset Removed", description: "Asset deleted from inventory." });
  };

  return (
    <main className="flex-1 px-4 py-8 md:pl-80 md:pr-12 md:pt-32 mb-24 md:mb-0 overflow-hidden">
      {isProfileLoading ? (
        <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
          <div className="w-12 h-12 rounded-full gold-gradient animate-pulse" />
          <p className="text-primary font-mono text-[10px] uppercase tracking-widest opacity-50">Auditing Physical Capital...</p>
        </div>
      ) : (
        <div className="flex flex-col gap-8 max-w-7xl mx-auto">
          <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">Assets</h1>
              <p className="text-muted-foreground truncate">Inventory for {activeDivision.name}.</p>
            </div>
            <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
              <DialogTrigger asChild>
                <Button className="rounded-full gap-2 gold-gradient text-black font-bold hover:opacity-90 px-6">
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
                    <Input id="name" name="name" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="type">Asset Type</Label>
                    <Input id="type" name="type" placeholder="Machinery, Real Estate, etc." required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="price">Purchase Price (₹)</Label>
                    <Input id="price" name="price" type="number" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="location">Location</Label>
                    <Input id="location" name="location" required />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="purchaseDate">Purchase Date</Label>
                    <Input id="purchaseDate" name="purchaseDate" type="date" required />
                  </div>
                  <DialogFooter>
                    <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Register Asset</Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          </header>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {isLoading ? (
              <p className="text-muted-foreground animate-pulse uppercase text-xs font-bold tracking-widest">FETCHING ASSETS...</p>
            ) : assets?.length === 0 ? (
              <Card className="glass border-white/5 col-span-full py-12 text-center border-dashed">
                <p className="text-muted-foreground">No assets found for this division.</p>
              </Card>
            ) : (
              assets?.map((asset) => (
                <Card key={asset.id} className="gold-glass control-center-card hover:scale-[1.02] ios-transition relative overflow-hidden border-primary/20">
                  <div className="absolute top-4 right-4 z-10">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full hover:bg-white/10">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="glass">
                        <DropdownMenuItem onClick={() => setEditingAsset(asset)} className="text-xs cursor-pointer">
                          <Pencil className="h-3 w-3 mr-2" /> Edit Asset
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteAsset(asset.id)} className="text-xs text-destructive cursor-pointer">
                          <Trash2 className="h-3 w-3 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="p-3 bg-primary/10 rounded-2xl">
                        <Layers className="h-6 w-6 text-primary" />
                      </div>
                      <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 text-[10px] tracking-widest font-bold uppercase">
                        {asset.assetType}
                      </Badge>
                    </div>
                    <CardTitle className="mt-4 text-xl truncate">{asset.name}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground truncate">
                      <MapPin className="h-4 w-4" /> {asset.location}
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" /> Purchased {asset.purchaseDate}
                    </div>
                    <div className="pt-4 border-t border-white/5">
                      <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold mb-1">Current Book Value</p>
                      <p className="text-2xl font-bold font-mono text-primary truncate" title={asset.currentBookValue?.toLocaleString('en-IN')}>₹{asset.currentBookValue?.toLocaleString('en-IN')}</p>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      )}

      <Dialog open={!!editingAsset} onOpenChange={(open) => !open && setEditingAsset(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Edit Asset</DialogTitle>
          </DialogHeader>
          {editingAsset && (
            <form onSubmit={handleUpdateAsset} className="space-y-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="edit-a-name">Asset Name</Label>
                <Input id="edit-a-name" name="name" defaultValue={editingAsset.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-a-type">Asset Type</Label>
                <Input id="edit-a-type" name="type" defaultValue={editingAsset.assetType} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="edit-a-price">Purchase Price (₹)</Label>
                  <Input id="edit-a-price" name="price" type="number" defaultValue={editingAsset.purchasePrice} required />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="edit-a-book">Current Book Value (₹)</Label>
                  <Input id="edit-a-book" name="bookValue" type="number" defaultValue={editingAsset.currentBookValue} required />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit-a-location">Location</Label>
                <Input id="edit-a-location" name="location" defaultValue={editingAsset.location} required />
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Update Asset</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}
