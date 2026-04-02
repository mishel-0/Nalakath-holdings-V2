"use client";

import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Plus, HardHat, Activity } from "lucide-react";
import Image from "next/image";
import { cn } from "@/lib/utils";

const projects = [
  {
    id: 1,
    name: "Azure Luxury Tower",
    division: "Construction",
    budget: 120000000,
    spent: 84000000,
    progress: 70,
    status: "On Track",
    image: "https://picsum.photos/seed/tower1/600/400"
  },
  {
    id: 2,
    name: "Grand Plaza Renovation",
    division: "Hospitality",
    budget: 25000000,
    spent: 27000000,
    progress: 95,
    status: "Over Budget",
    image: "https://picsum.photos/seed/hotel2/600/400"
  },
  {
    id: 3,
    name: "Logistics Hub Expansion",
    division: "Trading",
    budget: 40000000,
    spent: 12000000,
    progress: 30,
    status: "On Track",
    image: "https://picsum.photos/seed/warehouse1/600/400"
  },
  {
    id: 4,
    name: "Metro Office Suites",
    division: "Real Estate",
    budget: 80000000,
    spent: 45000000,
    progress: 55,
    status: "On Track",
    image: "https://picsum.photos/seed/office1/600/400"
  }
];

export default function ProjectsPage() {
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
              <Button className="rounded-full gap-2 shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 text-black">
                <Plus className="h-4 w-4" />
                New Project
              </Button>
            </header>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3">
              {projects.map((project) => (
                <Card key={project.id} className="glass border-white/5 overflow-hidden group hover:scale-[1.01] ios-transition">
                  <div className="relative h-48 w-full">
                    <Image 
                      src={project.image} 
                      alt={project.name}
                      fill
                      className="object-cover group-hover:scale-105 ios-transition"
                      data-ai-hint="construction building"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                    <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                      <div>
                        <Badge variant="outline" className="bg-white/10 backdrop-blur-md border-white/20 text-white font-medium mb-1">
                          {project.division}
                        </Badge>
                        <h3 className="text-lg font-bold">{project.name}</h3>
                      </div>
                      <Badge className={cn(
                        "rounded-full",
                        project.status === "Over Budget" ? "bg-destructive" : "bg-green-500"
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
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Total Budget</p>
                          <p className="text-sm font-bold">₹{project.budget.toLocaleString('en-IN')}</p>
                        </div>
                        <div className="space-y-1">
                          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Actual Spent</p>
                          <p className={cn(
                            "text-sm font-bold",
                            project.spent > project.budget ? "text-destructive" : "text-foreground"
                          )}>
                            ₹{project.spent.toLocaleString('en-IN')}
                          </p>
                        </div>
                      </div>

                      <div className="pt-4 flex items-center justify-between border-t border-white/5">
                        <div className="flex -space-x-2">
                          {[1, 2, 3].map((i) => (
                            <div key={i} className="h-8 w-8 rounded-full border-2 border-primary bg-black flex items-center justify-center text-[10px] font-bold text-primary">
                              NH
                            </div>
                          ))}
                          <div className="h-8 w-8 rounded-full border-2 border-white bg-secondary flex items-center justify-center text-[10px] font-bold text-muted-foreground">
                            +2
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" className="text-primary hover:bg-primary/5 rounded-full">
                          View Details
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </main>
      </div>
      <BottomNav />
    </div>
  );
}
