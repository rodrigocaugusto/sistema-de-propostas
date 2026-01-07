'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { login } from '@/app/auth/actions';
import { requestPasswordReset } from '@/app/actions';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    // Honeypot Field for Bot Protection
    const [honeypot, setHoneypot] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    // Forgot Password State
    const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);
    const [forgotEmail, setForgotEmail] = useState('');
    const [isRecovering, setIsRecovering] = useState(false);

    useEffect(() => {
        // Clear any previous state if needed
    }, []);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email || !password) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIsLoading(true);

        try {
            // Pass honeypot to login action
            const result = await login(email, password, honeypot);

            if (result.success) {
                toast.success('Login realizado com sucesso!');
                router.push('/dashboard');
                router.refresh();
            } else {
                toast.error(result.error || 'Erro ao fazer login');
            }
        } catch {
            toast.error('Erro ao fazer login. Tente novamente.');
        } finally {
            setIsLoading(false);
        }
    };

    const handleRecoverPassword = async () => {
        if (!forgotEmail) {
            toast.error("Digite seu e-mail.");
            return;
        }

        setIsRecovering(true);
        try {
            const result = await requestPasswordReset(forgotEmail);
            if (result.success) {
                toast.success(result.message);
                setIsForgotPasswordOpen(false);
                setForgotEmail('');
            } else {
                toast.error(result.error);
            }
        } catch {
            toast.error("Erro ao solicitar recuperação.");
        } finally {
            setIsRecovering(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center p-4">
            {/* Background decorations */}
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto flex justify-center">
                        <img
                            src="/system-logo.png"
                            alt="Sistema de Propostas"
                            className="h-20 w-auto object-contain dark:invert"
                        />
                    </div>
                    <CardDescription className="text-slate-500 dark:text-slate-400">
                        Faça login para acessar o sistema
                    </CardDescription>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-5">

                        {/* Honeypot Field (Invisible to users, visible to bots) */}
                        <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
                            <label htmlFor="_fax">Fax Number</label>
                            <input
                                type="text"
                                id="_fax"
                                name="_fax"
                                tabIndex={-1}
                                autoComplete="off"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                E-mail
                            </Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="seu@email.com"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="pl-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-violet-500"
                                    disabled={isLoading}
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password" className="text-sm font-medium text-slate-700 dark:text-slate-300">
                                Senha
                            </Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="pl-10 pr-10 h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 focus:ring-violet-500"
                                    disabled={isLoading}
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25 text-white font-medium"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Entrando...
                                </>
                            ) : (
                                'Entrar'
                            )}
                        </Button>
                    </form>

                    <div className="mt-6 pt-6 border-t border-slate-100 dark:border-slate-800 flex justify-center">
                        <Dialog open={isForgotPasswordOpen} onOpenChange={setIsForgotPasswordOpen}>
                            <DialogTrigger asChild>
                                <Button variant="link" className="text-sm text-slate-500 dark:text-slate-400 hover:text-violet-600 dark:hover:text-violet-400">
                                    Esqueceu sua senha?
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Recuperação de Senha</DialogTitle>
                                    <DialogDescription>
                                        Uma nova senha segura será gerada e enviada para o seu e-mail cadastrado.
                                    </DialogDescription>
                                </DialogHeader>

                                <div className="py-4 space-y-4">
                                    <div className="bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/50 rounded-lg p-3 flex items-start gap-3">
                                        <AlertCircle className="h-5 w-5 text-amber-600 dark:text-amber-500 flex-shrink-0 mt-0.5" />
                                        <p className="text-sm text-amber-800 dark:text-amber-400">
                                            Atenção: Ao confirmar esta ação, sua senha atual será imediatamente invalidada.
                                        </p>
                                    </div>

                                    <div className="space-y-2">
                                        <Label htmlFor="forgot-email">E-mail Cadastrado</Label>
                                        <Input
                                            id="forgot-email"
                                            value={forgotEmail}
                                            onChange={(e) => setForgotEmail(e.target.value)}
                                            placeholder="exemplo@email.com"
                                        />
                                    </div>
                                </div>

                                <DialogFooter>
                                    <Button variant="outline" onClick={() => setIsForgotPasswordOpen(false)}>Cancelar</Button>
                                    <Button onClick={handleRecoverPassword} disabled={isRecovering}>
                                        {isRecovering && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                        Gerar Nova Senha
                                    </Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}
