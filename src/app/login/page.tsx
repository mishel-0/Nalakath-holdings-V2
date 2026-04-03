
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
    <div className="min-h-screen flex items-center justify-center p-4 bg-black relative overflow-hidden">
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-accent/5 rounded-full blur-[120px]" />

      <div className="w-full max-w-md relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex justify-center mb-10">
          <div className="h-20 w-20 rounded-full gold-gradient flex items-center justify-center shadow-[0_0_40px_rgba(255,215,0,0.3)]">
            <span className="text-black font-black text-4xl">N</span>
          </div>
        </div>

        <Card className="glass border-white/10 shadow-2xl overflow-hidden rounded-[2rem]">
          <CardHeader className="text-center pt-10 px-8">
            <p className="text-muted-foreground text-[10px] font-bold tracking-[0.3em] uppercase">
              NALAKATH HOLDINGS
            </p>
          </CardHeader>
          <CardContent className="p-10 pt-6">
            <form onSubmit={handleAuth} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Identity Profile</Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@nalakath.com"
                    className="pl-12 bg-white/5 border-white/10 rounded-xl h-12 text-foreground focus-visible:ring-primary/50"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" title="password" className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground ml-1">Secure Key</Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-3.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    className="pl-12 bg-white/5 border-white/10 rounded-xl h-12 text-foreground focus-visible:ring-primary/50"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>
              </div>

              <Button
                type="submit"
                disabled={loading}
                className="w-full h-14 rounded-xl bg-primary text-black font-bold hover:bg-primary/90 ios-transition mt-4 text-lg shadow-lg shadow-primary/20"
              >
                {loading ? "Authorizing..." : "Initialize Session"}
                {!loading && <ArrowRight className="ml-2 h-5 w-5" />}
              </Button>
            </form>

            <div className="mt-10 border-t border-white/5 pt-6">
              <div className="flex items-center gap-3 p-4 rounded-xl bg-white/5 border border-white/10">
                <Info className="h-5 w-5 text-primary shrink-0" />
                <span className="text-[10px] text-muted-foreground font-semibold leading-tight">
                  Encrypted environment. All sessions audited for compliance.
                </span>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <p className="text-center mt-8 text-[10px] uppercase tracking-[0.3em] font-bold text-muted-foreground opacity-50">
          NALAKATH HOLDINGS © 2026
        </p>
      </div>
    </div>
  );
}
