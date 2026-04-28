"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { ShieldCheck, User, Clock, Info } from "lucide-react";
import { useCollection, useFirestore, useMemoFirebase, useUser, useDoc } from "@/firebase";
import { collection, query, orderBy, limit, doc } from "firebase/firestore";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

export default function LogsPage() {
  const db = useFirestore();
  const { user } = useUser();
  const router = useRouter();
  const { toast } = useToast();

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
        description: "System logs and audit trails are reserved for Administrators.",
      });
      router.replace("/");
    }
  }, [profile, isProfileLoading, router, toast]);

  const logsQuery = useMemoFirebase(() => {
    if (!db) return null;
    return query(collection(db, "auditLogs"), orderBy("timestamp", "desc"), limit(100));
  }, [db]);

  const { data: logs, isLoading } = useCollection(logsQuery);

  if (isProfileLoading || (profile && profile.role !== "Admin")) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <div className="flex flex-col items-center gap-4">
          <p className="animate-pulse text-primary font-mono tracking-widest uppercase text-xs">Verifying Credentials...</p>
        </div>
      </div>
    );
  }

  return (
  return (
    <>
        <main className="flex-1 px-4 py-6 md:pl-72 md:pr-8 md:py-8 mb-24 md:mb-0">
          <div className="flex flex-col gap-8 max-w-7xl mx-auto">
            <header>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <Badge variant="outline" className="rounded-full px-3 py-1 bg-primary/10 text-primary border-primary/20 text-[9px] font-bold uppercase tracking-widest">
                    System Audit
                  </Badge>
                  <div className="flex items-center gap-1 text-[9px] text-green-500 font-bold uppercase tracking-widest">
                    <ShieldCheck className="h-3 w-3" /> Integrity Verified
                  </div>
                </div>
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-foreground font-headline flex items-center gap-3">
                Activity Logs
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
    </>
  );
}
