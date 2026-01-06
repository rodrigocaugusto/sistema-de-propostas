'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import {
    getCurrentUser,
    changePassword,
    logout,
    updateUser,
} from '@/app/auth/actions';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    LogOut,
    Mail,
    Save,
    Shield,
    User,
    Users,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    isSuperAdmin: boolean;
}

export default function ProfilePage() {
    const router = useRouter();
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);

    // Profile form
    const [name, setName] = useState('');

    // Password form
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPassword, setShowCurrentPassword] = useState(false);
    const [showNewPassword, setShowNewPassword] = useState(false);

    useEffect(() => {
        loadUser();
    }, []);

    const loadUser = async () => {
        const userData = await getCurrentUser();
        if (!userData) {
            router.push('/login');
            return;
        }
        setUser(userData);
        setName(userData.name);
        setIsLoading(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setIsSaving(true);
        try {
            const result = await updateUser(user.id, { name: name.trim() });
            if (result.success) {
                toast.success('Perfil atualizado com sucesso!');
                router.refresh();
            } else {
                toast.error(result.error || 'Erro ao atualizar perfil');
            }
        } catch {
            toast.error('Erro ao atualizar perfil');
        } finally {
            setIsSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!currentPassword || !newPassword || !confirmPassword) {
            toast.error('Preencha todos os campos');
            return;
        }

        if (newPassword.length < 8) {
            toast.error('A nova senha deve ter no mínimo 8 caracteres');
            return;
        }

        if (newPassword !== confirmPassword) {
            toast.error('As senhas não coincidem');
            return;
        }

        setIsChangingPassword(true);
        try {
            const result = await changePassword(currentPassword, newPassword);
            if (result.success) {
                toast.success('Senha alterada com sucesso!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                toast.error(result.error || 'Erro ao alterar senha');
            }
        } catch {
            toast.error('Erro ao alterar senha');
        } finally {
            setIsChangingPassword(false);
        }
    };

    const handleLogout = async () => {
        await logout();
    };

    if (isLoading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 flex items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-violet-500" />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
            {/* Header */}
            <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
                <div className="max-w-4xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">Gerencie suas informações</p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <ThemeToggle />
                            {user?.isSuperAdmin && (
                                <Link href="/admin">
                                    <Button variant="outline" size="sm" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin
                                    </Button>
                                </Link>
                            )}
                            {user?.role === 'admin' && (
                                <Link href="/users">
                                    <Button variant="outline" size="sm">
                                        <Users className="mr-2 h-4 w-4" />
                                        Usuários
                                    </Button>
                                </Link>
                            )}
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={handleLogout}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                            >
                                <LogOut className="mr-2 h-4 w-4" />
                                Sair
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-6 py-8 space-y-6">
                {/* User Info Card */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white overflow-hidden">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                    <CardContent className="relative z-10 pt-6">
                        <div className="flex items-center gap-4">
                            <div className="h-16 w-16 rounded-2xl bg-white/20 flex items-center justify-center">
                                <User className="h-8 w-8" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold">{user?.name}</h2>
                                <p className="text-violet-100 flex items-center gap-2">
                                    <Mail className="h-4 w-4" />
                                    {user?.email}
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <Shield className="h-4 w-4" />
                                    <span className="text-sm capitalize px-2 py-0.5 bg-white/20 rounded-full">
                                        {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <div className="grid gap-6 md:grid-cols-2">
                    {/* Profile Settings */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <User className="h-5 w-5 text-violet-500" />
                                Informações Pessoais
                            </CardTitle>
                            <CardDescription>Atualize seus dados de perfil</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleUpdateProfile} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="name">Nome</Label>
                                    <Input
                                        id="name"
                                        value={name}
                                        onChange={(e) => setName(e.target.value)}
                                        placeholder="Seu nome completo"
                                        disabled={isSaving}
                                    />
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="email">E-mail</Label>
                                    <Input
                                        id="email"
                                        value={user?.email || ''}
                                        disabled
                                        className="bg-slate-100 dark:bg-slate-800"
                                    />
                                    <p className="text-xs text-slate-500">
                                        O e-mail não pode ser alterado
                                    </p>
                                </div>

                                <Button type="submit" disabled={isSaving} className="w-full">
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save className="mr-2 h-4 w-4" />
                                            Salvar Alterações
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>

                    {/* Change Password */}
                    <Card className="border-0 shadow-lg">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <KeyRound className="h-5 w-5 text-amber-500" />
                                Alterar Senha
                            </CardTitle>
                            <CardDescription>Mantenha sua conta segura</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <form onSubmit={handleChangePassword} className="space-y-4">
                                <div className="space-y-2">
                                    <Label htmlFor="currentPassword">Senha Atual</Label>
                                    <div className="relative">
                                        <Input
                                            id="currentPassword"
                                            type={showCurrentPassword ? 'text' : 'password'}
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={isChangingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showCurrentPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                </div>

                                <Separator />

                                <div className="space-y-2">
                                    <Label htmlFor="newPassword">Nova Senha</Label>
                                    <div className="relative">
                                        <Input
                                            id="newPassword"
                                            type={showNewPassword ? 'text' : 'password'}
                                            value={newPassword}
                                            onChange={(e) => setNewPassword(e.target.value)}
                                            placeholder="••••••••"
                                            disabled={isChangingPassword}
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowNewPassword(!showNewPassword)}
                                            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                        >
                                            {showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                        </button>
                                    </div>
                                    <p className="text-xs text-slate-500">Mínimo de 8 caracteres</p>
                                </div>

                                <div className="space-y-2">
                                    <Label htmlFor="confirmPassword">Confirmar Nova Senha</Label>
                                    <Input
                                        id="confirmPassword"
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        placeholder="••••••••"
                                        disabled={isChangingPassword}
                                    />
                                </div>

                                <Button
                                    type="submit"
                                    disabled={isChangingPassword}
                                    className="w-full bg-amber-500 hover:bg-amber-600"
                                >
                                    {isChangingPassword ? (
                                        <>
                                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                            Alterando...
                                        </>
                                    ) : (
                                        <>
                                            <KeyRound className="mr-2 h-4 w-4" />
                                            Alterar Senha
                                        </>
                                    )}
                                </Button>
                            </form>
                        </CardContent>
                    </Card>
                </div>
            </main>
        </div>
    );
}
