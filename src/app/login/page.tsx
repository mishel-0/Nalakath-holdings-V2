'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, ArrowRight, ShieldCheck } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const auth = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      await signInWithEmailAndPassword(auth, email, password);
      toast({ title: "Secure Access Granted", description: "Authenticated session established." });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Authentication Failed",
        description: "Invalid credentials. Please contact your system administrator.",
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
              Ledger Access
            </CardTitle>
            <CardDescription className="text-muted-foreground mt-2">
              Premium Financial Suite for Nalakath Holdings.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-10">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Email Identifier</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="admin@nalakath.com"
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 focus-visible:ring-primary/30"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-xs uppercase tracking-widest font-bold text-muted-foreground">Security Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 focus-visible:ring-primary/30"
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
                {loading ? "Verifying..." : "Initialize Session"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 ios-transition" />}
              </Button>
            </form>

            <div className="mt-10 pt-8 border-t border-white/5 flex flex-col items-center gap-4">
              <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/5">
                <ShieldCheck className="h-4 w-4 text-primary" />
                <span className="text-[10px] text-muted-foreground font-bold uppercase tracking-[0.2em]">
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
