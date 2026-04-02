
"use client";

import { useState, useEffect } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, Activity, HardHat, Lock } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import Image from "next/image";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, doc } from "firebase/firestore";
import { addDocumentNonBlocking } from "@/firebase/non-blocking-updates";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";

export default function ProjectsPage() {
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
        description: "Project management is reserved for Administrators.",
      });
      router.replace("/");
    }
  }, [profile, isProfileLoading, router, toast]);

  const projectsQuery = useMemoFirebase(() => {
    return query(collection(db, "companies", companyId, "projects"), orderBy("createdAt", "desc"));
  }, [db, companyId]);

  const { data: projects, isLoading } = useCollection(projectsQuery);

  if (isProfileLoading || (profile && profile.role !== "Admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="animate-pulse text-primary font-mono tracking-widest uppercase">Validating Credentials...</div>
      </div>
    );
  }

  const handleAddProject = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const now = new Date().toISOString();
    
    const newProject = {
      companyId,
      name: formData.get("name") as string,
      description: formData.get("description") as string,
      startDate: formData.get("startDate") as string,
      status: "Planning",
      budgetAmount: Number(formData.get("budget")),
      actualCost: 0,
      image: "https://picsum.photos/seed/" + Math.random() + "/600/400",
      progress: 0,
      createdAt: now,
      updatedAt: now,
    };

    addDocumentNonBlocking(collection(db, "companies", companyId, "projects"), newProject);
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
                <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline">Projects</h1>
                <p className="text-muted-foreground">Manage ongoing construction and business ventures.</p>
              </div>
              <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
                <DialogTrigger asChild>
                  <Button className="rounded-full gap-2 bg-primary text-black hover:bg-primary/90">
                    <Plus className="h-4 w-4" /> New Project
                  </Button>
                </DialogTrigger>
                <DialogContent className="glass border-white/10 sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>Launch New Project</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleAddProject} className="space-y-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="name">Project Name</Label>
                      <Input id="name" name="name" placeholder="Villa Phase 2, Hotel Expansion, etc." required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea id="description" name="description" placeholder="Brief scope of the project..." required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="budget">Total Budget (₹)</Label>
                      <Input id="budget" name="budget" type="number" required />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="startDate">Start Date</Label>
                      <Input id="startDate" name="startDate" type="date" required defaultValue={new Date().toISOString().split('T')[0]} />
                    </div>
                    <DialogFooter>
                      <Button type="submit" className="w-full text-black">Start Project</Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {isLoading ? (
                <p className="text-muted-foreground">Syncing project data...</p>
              ) : projects?.length === 0 ? (
                <Card className="glass border-white/5 col-span-full py-20 flex flex-col items-center justify-center text-center gap-4 border-dashed">
                  <HardHat className="h-12 w-12 text-primary/20" />
                  <p className="text-muted-foreground">No active projects. Click "New Project" to begin.</p>
                </Card>
              ) : (
                projects?.map((project) => (
                  <Card key={project.id} className="glass border-white/5 overflow-hidden group hover:scale-[1.01] ios-transition">
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
                          <p className="text-xs text-white/60 truncate">{project.description}</p>
                        </div>
                        <Badge className={cn(
                          "rounded-full whitespace-nowrap",
                          project.actualCost > project.budgetAmount ? "bg-destructive" : "bg-green-500"
                        )}>
                          {project.status}
                        </Badge>
                      </div>
                    </div>
                    <CardContent className="pt-6">
                      <div className="space-y-4">
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground flex items-center gap-1">
                            <Activity className="h-4 w-4" /> Progress
                          </span>
                          <span className="font-semibold">{project.progress}%</span>
                        </div>
                        <Progress value={project.progress} className="h-2 bg-secondary/50" />
                        
                        <div className="grid grid-cols-2 gap-4 pt-2">
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Budget</p>
                            <p className="text-sm font-bold">₹{project.budgetAmount?.toLocaleString('en-IN')}</p>
                          </div>
                          <div className="space-y-1">
                            <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Actual</p>
                            <p className={cn(
                              "text-sm font-bold",
                              project.actualCost > project.budgetAmount ? "text-destructive" : "text-foreground"
                            )}>
                              ₹{project.actualCost?.toLocaleString('en-IN')}
                            </p>
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
      <BottomNav />
    </div>
  );
}
