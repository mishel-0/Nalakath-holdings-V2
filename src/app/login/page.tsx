'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Lock, Mail, ArrowRight, Info } from 'lucide-react';

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
      toast({ 
        title: "Access Authorized", 
        description: "Secure session initialized for Nalakath Holdings." 
      });
      router.push('/');
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Authentication Denied",
        description: "Invalid credentials or unauthorized access attempt.",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden font-sans">
      {/* Premium Gold Background Accents */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/20 rounded-full blur-[160px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[160px]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <Card className="bg-zinc-950/60 backdrop-blur-3xl border-white/10 shadow-2xl overflow-hidden rounded-[3rem]">
          <CardHeader className="text-center pt-12 px-8 border-none">
            <p className="text-primary text-[11px] font-black tracking-[0.5em] uppercase">
              NALAKATH HOLDINGS
            </p>
            <h2 className="text-3xl font-bold tracking-tight text-white mt-4">
              Executive Access
            </h2>
          </CardHeader>
          <CardContent className="p-10 pt-8">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 ml-1">Identity Profile</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-4 h-4 w-4 text-primary" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@nalakath.com"
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 text-white placeholder:text-muted-foreground/40 focus-visible:ring-primary/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground/60 ml-1">Secure Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-4 h-4 w-4 text-primary" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 bg-white/5 border-white/10 rounded-2xl h-14 text-white placeholder:text-muted-foreground/40 focus-visible:ring-primary/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-16 rounded-2xl gold-gradient text-black font-black hover:opacity-90 transition-all duration-300 mt-6 text-lg shadow-xl shadow-primary/20"
              >
                {loading ? "Authorizing..." : "Initialize Session"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>

            <div className="mt-10 border-t border-white/5 pt-8">
              <div className="flex items-center gap-4 p-5 rounded-3xl bg-white/5 border border-white/10">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <span className="text-[10px] text-muted-foreground/60 font-semibold leading-relaxed tracking-wide">
                  SECURE ENVIRONMENT. ALL SESSIONS ARE AUDITED FOR FISCAL COMPLIANCE. PUBLIC REGISTRATION IS DISABLED.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center mt-12 text-[10px] uppercase tracking-[0.5em] font-black text-white/20">
          NALAKATH HOLDINGS • EST. 2026
        </p>
      </div>
    </div>
  );
}