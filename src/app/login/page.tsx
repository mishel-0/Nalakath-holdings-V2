
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
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, ArrowRight, ShieldCheck, UserPlus, LogIn, UserCircle } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'Admin' | 'Accountant'>('Admin');
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const auth = useAuth();
  const db = useFirestore();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isRegistering) {
        // Create Auth User
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;

        // Create User Profile in Firestore
        const now = new Date().toISOString();
        const profileData = {
          id: user.uid,
          firebaseUid: user.uid,
          firstName: firstName || (role === 'Admin' ? 'System' : 'Group'),
          lastName: lastName || (role === 'Admin' ? 'Admin' : 'Accountant'),
          email: email,
          role: role,
          companyIds: ['nalakath-holdings-main'],
          preferredCompanyId: 'nalakath-holdings-main',
          createdAt: now,
          updatedAt: now,
        };

        await setDoc(doc(db, 'userProfiles', user.uid), profileData);
        
        toast({ 
          title: "Account Created", 
          description: `Welcome, ${profileData.firstName}. Your ${role} session is ready.` 
        });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
        toast({ title: "Secure Access Granted", description: "Authenticated session established." });
      }
      router.push('/');
    } catch (error: any) {
      console.error(error);
      const errorMessage = error.code === 'auth/email-already-in-use' 
        ? "This email is already registered. Please sign in." 
        : "Authentication failed. Please check your credentials.";
      
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: errorMessage,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      {/* Premium Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-10">
          <div className="w-20 h-20 rounded-3xl bg-primary flex items-center justify-center shadow-2xl shadow-primary/30 rotate-3 transform transition-transform hover:rotate-0 ios-transition">
            <span className="text-black font-bold text-4xl">N</span>
          </div>
        </div>

        <Card className="glass border-white/10 shadow-2xl overflow-hidden rounded-[2.5rem]">
          <CardHeader className="text-center pt-10">
            <CardTitle className="text-3xl font-headline font-bold tracking-tight">
              {isRegistering ? "Create Profile" : "Ledger Access"}
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              {isRegistering 
                ? "Register a new administrative or accounting user." 
                : "Premium Financial Suite for Nalakath Holdings."}
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleAuth} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">First Name</Label>
                      <Input
                        placeholder="Jane"
                        className="bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-primary/30"
                        value={firstName}
                        onChange={(e) => setFirstName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Last Name</Label>
                      <Input
                        placeholder="Doe"
                        className="bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-primary/30"
                        value={lastName}
                        onChange={(e) => setLastName(e.target.value)}
                        required
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Assigned Role</Label>
                    <Select onValueChange={(v: any) => setRole(v)} defaultValue="Admin">
                      <SelectTrigger className="bg-white/5 border-white/10 rounded-2xl h-12">
                        <SelectValue placeholder="Select role" />
                      </SelectTrigger>
                      <SelectContent className="glass">
                        <SelectItem value="Admin">Administrator (Full Access)</SelectItem>
                        <SelectItem value="Accountant">Accountant (Operations Only)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Email Identifier</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@nalakath.com"
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-primary/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground">Security Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-12 focus-visible:ring-primary/30"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-2xl bg-primary text-black font-bold hover:bg-primary/90 ios-transition group mt-4 text-lg"
              >
                {loading ? "Processing..." : isRegistering ? "Create Account" : "Initialize Session"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 ios-transition" />}
              </Button>
            </form>

            <button
              onClick={() => setIsRegistering(!isRegistering)}
              className="w-full mt-6 text-[10px] uppercase tracking-[0.2em] font-bold text-primary hover:text-white ios-transition flex items-center justify-center gap-2"
            >
              {isRegistering ? (
                <><LogIn className="h-3 w-3" /> Back to Sign In</>
              ) : (
                <><UserPlus className="h-3 w-3" /> Register Admin/Staff Account</>
              )}
            </button>

            <div className="mt-8 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                <ShieldCheck className="h-3 w-3 text-primary" />
                <span className="text-[8px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
                  Encrypted Ledger Session
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        <p className="text-center mt-10 text-[10px] text-muted-foreground font-bold uppercase tracking-[0.3em] opacity-40">
          Nalakath Holdings @2026
        </p>
      </div>
    </div>
  );
}
