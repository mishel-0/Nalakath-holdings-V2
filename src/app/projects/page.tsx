
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Activity, HardHat, Pencil, Trash2, MoreVertical, Droplets, Building2, Wallet } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking, updateDocumentNonBlocking, deleteDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { useDivision } from "@/context/DivisionContext";

export default function ProjectsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const { activeDivision } = useDivision();
  const router = useRouter();
  const { toast } = useToast();
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any>(null);
  const companyId = activeDivision.id;

  const profileDocRef = useMemoFirebase(() => {
    if (!user || !db) return null;
    return doc(db, "userProfiles", user.uid);
  }, [user, db]);

  const { data: profile, isLoading: isProfileLoading } = useDoc(profileDocRef);

  useEffect(() => {
    if (activeDivision.id !== "nalakath-holdings-main") {
      toast({
        variant: "destructive",
        title: "Section Unavailable",
        description: "The Projects module is restricted to Group HQ.",
      });
      router.replace("/");
      return;
    }

    if (!isProfileLoading && profile && profile.role !== "Admin") {
      toast({
        variant: "destructive",
        title: "Access Restricted",
        description: "Project management is reserved for Administrators.",
      });
      router.replace("/");
    }
  }, [profile, isProfileLoading, router, toast, activeDivision]);

  const projectsQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "projects"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: projects, isLoading } = useCollection(projectsQuery);

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newProject = {
      companyId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      vendorName: formData.get("vendorName") as string,
      startDate: formData.get("startDate") as string,
      status: "Planning",
      budgetAmount: Number(formData.get("budget")),
      actualCost: 0,
      image: "https://picsum.photos/seed/" + Math.random() + "/600/400",
      progress: 0,
      investorLiquidity: Number(formData.get("investorLiquidity")) || 0,
      companyLiquidity: Number(formData.get("companyLiquidity")) || 0,
      materialAllocation: Number(formData.get("materialAllocation")) || 0,
      labourAllocation: Number(formData.get("labourAllocation")) || 0,
      landAllocation: Number(formData.get("landAllocation")) || 0,
      profitMarginAllocation: Number(formData.get("profitMarginAllocation")) || 0,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "projects"), newProject);
    setIsAddOpen(false);
    toast({ title: "Project Created", description: `Initialized ${newProject.name} for ${activeDivision.name}.` });
  };

  const handleUpdateProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingProject) return;

    const formData = new FormData(e.currentTarget);
    const updatedData = {
      ...editingProject,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      vendorName: formData.get("vendorName") as string,
      startDate: formData.get("startDate") as string,
      budgetAmount: Number(formData.get("budget")),
      progress: Number(formData.get("progress")),
      investorLiquidity: Number(formData.get("investorLiquidity")),
      companyLiquidity: Number(formData.get("companyLiquidity")),
      materialAllocation: Number(formData.get("materialAllocation")),
      labourAllocation: Number(formData.get("labourAllocation")),
      landAllocation: Number(formData.get("landAllocation")),
      profitMarginAllocation: Number(formData.get("profitMarginAllocation")),
      actualCost: Number(formData.get("actualCost")),
      status: formData.get("status") as string,
      updatedAt: new Date().toISOString(),
    };

    updateDocumentNonBlocking(doc(db, "companies", companyId, "projects", editingProject.id), updatedData);
    setEditingProject(null);
    toast({ title: "Project Updated", description: "Project details modified." });
  };

  const handleDeleteProject = (id: string) => {
    deleteDocumentNonBlocking(doc(db, "companies", companyId, "projects", id));
    toast({ variant: "destructive", title: "Project Deleted", description: "Venture removed from records." });
  };

  if (isProfileLoading || (profile && profile.role !== "Admin") || activeDivision.id !== "nalakath-holdings-main") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4 animate-in fade-in duration-500">
          <div className="w-16 h-16 rounded-full gold-gradient animate-pulse shadow-lg shadow-primary/20" />
          <p className="text-primary font-mono tracking-widest uppercase text-[10px] opacity-50">Authorizing Entry...</p>
        </div>
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline uppercase truncate">HQ Projects</h1>
                <p className="text-muted-foreground truncate">Portfolio for {activeDivision.name}.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 gold-gradient text-black font-bold hover:opacity-90 px-6">
                    <Plus className="h-4 w-4" /> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
                  <DialogHeader>
                    <DialogTitle>Launch New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProject} className="space-y-6 py-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label>Project Name</Label>
                        <Input name="name" required className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Handling Vendor (Construction)</Label>
                        <Input name="vendorName" required placeholder="e.g. Nalakath Construction" className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                    </div>
                    
                    <div className="grid gap-2">
                      <Label>Description</Label>
                      <Textarea name="description" required className="bg-white/5 border-white/10 rounded-xl min-h-[80px]" />
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Liquidity Split (%)</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Investors</Label>
                          <Input name="investorLiquidity" type="number" min="0" max="100" defaultValue="50" required className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Company</Label>
                          <Input name="companyLiquidity" type="number" min="0" max="100" defaultValue="50" required className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                      </div>
                    </div>

                    <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                      <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cost Allocation (%)</p>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Material</Label>
                          <Input name="materialAllocation" type="number" defaultValue="40" className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Labour</Label>
                          <Input name="labourAllocation" type="number" defaultValue="30" className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Land</Label>
                          <Input name="landAllocation" type="number" defaultValue="20" className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                        <div className="grid gap-2">
                          <Label className="text-[10px]">Profit</Label>
                          <Input name="profitMarginAllocation" type="number" defaultValue="10" className="bg-white/5 border-white/10 rounded-xl" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="grid gap-2">
                        <Label>Total Budget (₹)</Label>
                        <Input name="budget" type="number" required className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                      <div className="grid gap-2">
                        <Label>Start Date</Label>
                        <Input name="startDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} className="bg-white/5 border-white/10 rounded-xl" />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Start Project</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                <p className="text-muted-foreground animate-pulse text-xs font-bold uppercase tracking-widest">FETCHING VENTURES...</p>
              ) : projects?.length === 0 ? (
                <Card className="glass border-white/5 col-span-full py-20 flex flex-col items-center justify-center text-center gap-4 border-dashed">
                  <HardHat className="h-12 w-12 text-primary/20" />
                  <p className="text-muted-foreground">No active projects found for this division.</p>
                </Card>
              ) : (
                projects?.map((project) => (
                  <Card key={project.id} className="glass border-white/5 overflow-hidden group hover:scale-[1.01] ios-transition relative">
                    <div className="absolute top-2 right-2 z-10">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full bg-black/50 hover:bg-black/80 text-white border-none backdrop-blur-md">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="glass">
                          <DropdownMenuItem onClick={() => setEditingProject(project)} className="text-xs cursor-pointer">
                            <Pencil className="h-3 w-3 mr-2" /> Edit Project
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDeleteProject(project.id)} className="text-xs text-destructive cursor-pointer">
                            <Trash2 className="h-3 w-3 mr-2" /> Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                    <div className="relative h-48 w-full">
                      <Image 
                        src={project.image || "https://picsum.photos/seed/default/600/400"} 
                        alt={project.name}
                        fill
                        className="object-cover group-hover:scale-105 ios-transition"
                        data-ai-hint="construction architecture"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                      <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                        <div className="max-w-[70%]">
                          <h3 className="text-lg font-bold truncate">{project.name}</h3>
                          <p className="text-[10px] text-white/60 truncate flex items-center gap-1">
                            <Building2 className="h-3 w-3" /> {project.vendorName || "Not Assigned"}
                          </p>
                        </div>
                        <Badge className="rounded-full bg-green-500 text-black text-[9px] uppercase font-bold tracking-widest border-none px-2">
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-6 space-y-6">
                      <div className="space-y-2">
                        <div className="flex justify-between text-[10px] uppercase font-bold tracking-widest mb-1">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Activity className="h-3 w-3" /> Construction Progress
                          </span>
                          <span className="text-foreground">{project.progress || 0}%</span>
                        </div>
                        <Progress value={project.progress || 0} className="h-1.5 bg-secondary/50" />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
                            <span className="text-primary/70 flex items-center gap-1"><Wallet className="h-2.5 w-2.5" /> Investor</span>
                            <span>{project.investorLiquidity || 0}%</span>
                          </div>
                          <Progress value={project.investorLiquidity || 0} className="h-1 bg-primary/20" />
                        </div>
                        <div className="space-y-2">
                          <div className="flex justify-between text-[9px] uppercase font-bold tracking-widest">
                            <span className="text-green-500/70 flex items-center gap-1"><Building2 className="h-2.5 w-2.5" /> Company</span>
                            <span>{project.companyLiquidity || 0}%</span>
                          </div>
                          <Progress value={project.companyLiquidity || 0} className="h-1 bg-green-500/20" />
                        </div>
                      </div>
                      
                      <div className="pt-4 border-t border-white/5 flex justify-between items-center">
                        <div className="space-y-1 min-w-0">
                          <p className="text-[9px] uppercase tracking-wider text-muted-foreground font-bold">Project Budget</p>
                          <p className="text-sm font-bold truncate">₹{project.budgetAmount?.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="flex items-center gap-2">
                           <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary" title="Allocated">
                              <Droplets className="h-4 w-4" />
                           </div>
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

      <Dialog open={!!editingProject} onOpenChange={(open) => !open && setEditingProject(null)}>
        <DialogContent className="glass border-white/10 sm:max-w-[600px] max-h-[90vh] overflow-y-auto custom-scrollbar">
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
          </DialogHeader>
          {editingProject && (
            <form onSubmit={handleUpdateProject} className="space-y-6 py-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Project Name</Label>
                  <Input name="name" defaultValue={editingProject.name} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Handling Vendor</Label>
                  <Input name="vendorName" defaultValue={editingProject.vendorName} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              
              <div className="grid gap-2">
                <Label>Description</Label>
                <Textarea name="description" defaultValue={editingProject.description} required className="bg-white/5 border-white/10 rounded-xl" />
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Liquidity Split (%)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px]">Investors</Label>
                    <Input name="investorLiquidity" type="number" defaultValue={editingProject.investorLiquidity} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px]">Company</Label>
                    <Input name="companyLiquidity" type="number" defaultValue={editingProject.companyLiquidity} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-white/5 border border-white/5 space-y-4">
                <p className="text-[10px] font-black uppercase tracking-widest text-primary">Cost Allocation (%)</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="grid gap-2">
                    <Label className="text-[10px]">Material</Label>
                    <Input name="materialAllocation" type="number" defaultValue={editingProject.materialAllocation} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px]">Labour</Label>
                    <Input name="labourAllocation" type="number" defaultValue={editingProject.labourAllocation} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px]">Land</Label>
                    <Input name="landAllocation" type="number" defaultValue={editingProject.landAllocation} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                  <div className="grid gap-2">
                    <Label className="text-[10px]">Profit</Label>
                    <Input name="profitMarginAllocation" type="number" defaultValue={editingProject.profitMarginAllocation} className="bg-white/5 border-white/10 rounded-xl" />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Budget (₹)</Label>
                  <Input name="budget" type="number" defaultValue={editingProject.budgetAmount} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Actual Cost (₹)</Label>
                  <Input name="actualCost" type="number" defaultValue={editingProject.actualCost} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label>Progress (%)</Label>
                  <Input name="progress" type="number" min="0" max="100" defaultValue={editingProject.progress} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Input name="status" defaultValue={editingProject.status} required className="bg-white/5 border-white/10 rounded-xl" />
                </div>
              </div>
              <DialogFooter>
                <Button type="submit" className="w-full text-black gold-gradient font-bold h-12 rounded-xl">Update Project</Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>
      <BottomNav />
    </div>
  );
}
