'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { createTrialAccount } from '@/app/auth/actions';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2, Lock, Mail, Building2, User } from 'lucide-react';
import Link from 'next/link';

export default function RegisterPage() {
    const router = useRouter();
    const [formData, setFormData] = useState({
        companyName: '',
        userName: '',
        email: '',
        password: ''
    });
    const [honeypot, setHoneypot] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData({ ...formData, [e.target.id]: e.target.value });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!formData.companyName || !formData.userName || !formData.email || !formData.password) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIsLoading(true);

        try {
            const result = await createTrialAccount({
                ...formData,
                honeypot
            });

            if (result.success) {
                toast.success('Conta criada! Verifique seu email.');
                router.push(`/register/email-sent?email=${encodeURIComponent(formData.email)}`);
            } else {
                toast.error(result.error || 'Erro ao criar conta');
                setIsLoading(false);
            }
        } catch {
            toast.error('Erro ao processar cadastro. Tente novamente.');
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            <Card className="w-full max-w-md relative z-10 border-0 shadow-2xl bg-white/95 dark:bg-slate-900/95 backdrop-blur-xl">
                <CardHeader className="space-y-4 text-center pb-2">
                    <div className="mx-auto flex justify-center">
                        <img
                            src="/system-logo.png"
                            alt="DL Pro"
                            className="h-20 w-auto object-contain dark:invert"
                        />
                    </div>
                    <div className="space-y-1">
                        <CardTitle className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
                            Comece seu Teste Grátis
                        </CardTitle>
                        <CardDescription className="text-slate-500 dark:text-slate-400">
                            7 dias de acesso total. Sem cartão de crédito.
                        </CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {/* Honeypot */}
                        <div className="opacity-0 absolute -z-10 h-0 w-0 overflow-hidden" aria-hidden="true">
                            <input
                                type="text"
                                value={honeypot}
                                onChange={(e) => setHoneypot(e.target.value)}
                                tabIndex={-1}
                                autoComplete="off"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="companyName">Nome da Empresa</Label>
                            <div className="relative">
                                <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="companyName"
                                    placeholder="Sua Empresa Ltda"
                                    value={formData.companyName}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="userName">Seu Nome</Label>
                            <div className="relative">
                                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="userName"
                                    placeholder="João Silva"
                                    value={formData.userName}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="email">E-mail Profissional</Label>
                            <div className="relative">
                                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="joao@suaempresa.com"
                                    value={formData.email}
                                    onChange={handleChange}
                                    className="pl-10"
                                    disabled={isLoading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="password">Senha</Label>
                            <div className="relative">
                                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                                <Input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    placeholder="••••••••"
                                    value={formData.password}
                                    onChange={handleChange}
                                    className="pl-10 pr-10"
                                    disabled={isLoading}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full h-11 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg text-white font-medium mt-2"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Criando conta...
                                </>
                            ) : (
                                'Criar Conta Grátis'
                            )}
                        </Button>

                        <p className="text-center text-sm text-slate-500 mt-4">
                            Já tem uma conta?{' '}
                            <Link href="/login" className="text-violet-600 hover:underline font-medium">
                                Fazer Login
                            </Link>
                        </p>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
