
"use client";

import { useMemo } from "react";
import { Navbar } from "@/components/layout/Navbar";
import { Sidebar } from "@/components/layout/Sidebar";
import { BottomNav } from "@/components/layout/BottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { History, ShieldCheck, User, Clock, Info } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase } from "@/firebase";
import { collection, query, orderBy, limit } from "firebase/firestore";
import { cn } from "@/lib/utils";

export default function LogsPage() {
  const db = useFirestore();

  const logsQuery = useMemoFirebase(() => {
    return query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100));
  }, [db]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="flex">
        <Sidebar />
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header>
              <div className="flex items-center gap-3 mb-2">
                <Badge variant="outline" className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest">
                  System Audit
                </Badge>
                <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold uppercase tracking-widest">
                   <ShieldCheck className="h-3 w-3" /> Integrity Verified
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline flex items-center gap-3">
                Activity Logs
                <History className="h-8 w-8 text-primary" />
              </h1>
              <p className="text-muted-foreground">Comprehensive trail of all modifications across business divisions.</p>
            </header>

            <Card className="glass border-white/5 overflow-hidden rounded-[2rem]">
              <CardContent className="p-0">
                <Table>
                  <TableHeader className="bg-white/5">
                    <TableRow className="border-white/5">
                      <TableHead className="w-48 uppercase tracking-widest text-[9px] font-bold px-6"><Clock className="h-3 w-3 inline mr-2" />Timestamp</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold">Action</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold">Entity</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold"><User className="h-3 w-3 inline mr-2" />User ID</TableHead>
                      <TableHead className="uppercase tracking-widest text-[9px] font-bold px-6">ID Reference</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground animate-pulse font-mono tracking-widest">FETCHING LOGS...</TableCell></TableRow>
                    ) : logs?.length === 0 ? (
                      <TableRow><TableCell colSpan={5} className="text-center py-20 text-muted-foreground">No activity recorded yet.</TableCell></TableRow>
                    ) : (
                      logs?.map((log) => (
                        <TableRow key={log.id} className="border-white/5 hover:bg-white/5 ios-transition group">
                          <TableCell className="text-muted-foreground font-mono text-[10px] px-6">
                            {log.timestamp?.toDate ? log.timestamp.toDate().toLocaleString() : 'Recent'}
                          </TableCell>
                          <TableCell>
                            <Badge className={cn(
                              "rounded-full text-[9px] font-bold uppercase tracking-widest px-3",
                              log.action === "DELETE" ? "bg-destructive text-destructive-foreground" : 
                              log.action === "CREATE" ? "bg-green-500 text-green-950" : "bg-primary text-black"
                            )}>
                              {log.action}
                            </Badge>
                          </TableCell>
                          <TableCell className="font-semibold text-xs opacity-80 uppercase tracking-tighter">
                            {log.entity}
                          </TableCell>
                          <TableCell className="font-mono text-[10px] text-muted-foreground truncate max-w-[120px]">
                            {log.userId}
                          </TableCell>
                          <TableCell className="px-6">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-[9px] text-primary/70">{log.entityId}</span>
                              {log.details && (
                                <Info className="h-3 w-3 text-muted-foreground opacity-30 cursor-help" />
                              )}
                            </div>
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
