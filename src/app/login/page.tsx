'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useFirestore } from '@/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, ArrowRight, ShieldCheck, UserCog } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Admin');
  const [loading, setLoading] = useState(false);
  const [isRegistering, setIsRegistering] = useState(false);
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create UserProfile in Firestore
        await setDoc(doc(db, "userProfiles", user.uid), {
          id: user.uid,
          firebaseUid: user.uid,
          email: user.email,
          role: role,
          companyIds: ["nalakath-holdings-main"],
          preferredCompanyId: "nalakath-holdings-main",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        });

        toast({ title: "Account Created", description: `${role} credentials registered successfully.` });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Welcome back", description: "Secure session initiated." });
      }
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: error.message || "Invalid credentials provided. Please ensure you have registered first.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/20 rotate-3">
            <span className="text-black font-bold text-3xl">N</span>
          </div>
        </div>

        <Card className="glass border-white/10 shadow-2xl overflow-hidden">
          <CardHeader className="text-center pt-8">
            <CardTitle className="text-2xl font-headline font-bold tracking-tight">
              {isRegistering ? "Register Access" : "Ledger Access"}
            </CardTitle>
            <CardDescription className="text-muted-foreground">
              {isRegistering 
                ? "Create a new account for Nalakath Holdings staff." 
                : "Enter credentials to access financial records."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-8">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="staff@nalakath.com"
                    className="pl-10 bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Security Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-10 bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              {isRegistering && (
                <div className="space-y-2">
                  <Label htmlFor="role">Assign Role</Label>
                  <div className="relative">
                    <UserCog className="absolute left-3 top-3 h-4 w-4 text-muted-foreground z-10" />
                    <Select onValueChange={setRole} defaultValue={role}>
                      <SelectTrigger className="pl-10 bg-white/5 border-white/10 rounded-xl h-12 focus-visible:ring-primary/30">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="Admin">Administrator</SelectItem>
                        <SelectItem value="Accountant">Accountant</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-12 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 ios-transition group"
              >
                {loading ? "Verifying..." : (isRegistering ? "Create Account" : "Access Ledger")}
                {!loading && <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 ios-transition" />}
              </Button>
            </form>

            <div className="mt-8 pt-6 border-t border-white/5 flex flex-col items-center gap-4">
              <Button 
                variant="link" 
                onClick={() => setIsRegistering(!isRegistering)}
                className="text-xs text-muted-foreground hover:text-primary"
              >
                {isRegistering ? "Already have an account? Login" : "Register Admin/Staff"}
              </Button>
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/5">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-widest">
                  Encrypted Session
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-8 text-xs text-muted-foreground font-medium uppercase tracking-widest opacity-50">
          Nalakath Holdings @2026
        </p>
      </div>
    </div>
  );
}