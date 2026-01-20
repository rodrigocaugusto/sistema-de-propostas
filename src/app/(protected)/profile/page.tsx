'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    getCurrentUser,
    changePassword,
    logout,
    updateUser,
} from '@/app/auth/actions';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Camera,
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
    X,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    isSuperAdmin: boolean;
    phone?: string | null;
    avatarUrl?: string | null;
}

// Helper to get Gravatar URL
function getGravatarUrl(email: string, size: number = 200): string {
    const hash = email.toLowerCase().trim();
    const encoded = btoa(hash).replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
    return `https://www.gravatar.com/avatar/${encoded.slice(0, 32)}?s=${size}&d=mp`;
}

// Get user initials
function getUserInitials(name: string): string {
    return name
        .split(' ')
        .map(part => part.charAt(0))
        .slice(0, 2)
        .join('')
        .toUpperCase();
}

export default function ProfilePage() {
    const router = useRouter();
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [user, setUser] = useState<UserData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

    // Profile form
    const [name, setName] = useState('');
    const [phone, setPhone] = useState('');
    const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

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
        setUser(userData as UserData);
        setName(userData.name);
        setPhone(userData.phone || '');
        setAvatarUrl(userData.avatarUrl || null);
        setIsLoading(false);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user || !name.trim()) return;

        setIsSaving(true);
        try {
            const result = await updateUser(user.id, {
                name: name.trim(),
                phone: phone.trim(),
                avatarUrl: avatarUrl,
            });
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

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        // Validate file type
        if (!file.type.startsWith('image/')) {
            toast.error('Por favor, selecione uma imagem válida');
            return;
        }

        // Validate file size (max 2MB)
        if (file.size > 2 * 1024 * 1024) {
            toast.error('A imagem deve ter no máximo 2MB');
            return;
        }

        setIsUploadingAvatar(true);
        try {
            // Convert to base64 for now (in production, should upload to cloud storage)
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64 = reader.result as string;

                // Update avatar locally first for preview
                setAvatarUrl(base64);

                // Auto-save to database
                if (user) {
                    const result = await updateUser(user.id, { avatarUrl: base64 });
                    if (result.success) {
                        toast.success('Foto atualizada com sucesso!');
                        router.refresh();
                    } else {
                        toast.error(result.error || 'Erro ao atualizar foto');
                        // Revert on error
                        setAvatarUrl(user.avatarUrl || null);
                    }
                }
                setIsUploadingAvatar(false);
            };
            reader.onerror = () => {
                toast.error('Erro ao processar imagem');
                setIsUploadingAvatar(false);
            };
            reader.readAsDataURL(file);
        } catch {
            toast.error('Erro ao fazer upload da imagem');
            setIsUploadingAvatar(false);
        }
    };

    const handleRemoveAvatar = async () => {
        if (!user) return;

        setIsUploadingAvatar(true);
        try {
            const result = await updateUser(user.id, { avatarUrl: null });
            if (result.success) {
                setAvatarUrl(null);
                toast.success('Foto removida. Usando Gravatar.');
                router.refresh();
            } else {
                toast.error(result.error || 'Erro ao remover foto');
            }
        } catch {
            toast.error('Erro ao remover foto');
        } finally {
            setIsUploadingAvatar(false);
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

    const displayAvatarUrl = avatarUrl || (user?.email ? getGravatarUrl(user.email, 200) : undefined);
    const userInitials = user?.name ? getUserInitials(user.name) : 'U';

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
                <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-2 sm:gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">Meu Perfil</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">Gerencie suas informações</p>
                            </div>
                        </div>
                        <div className="flex gap-2 sm:gap-3 items-center">
                            <ThemeToggle />
                            {user?.isSuperAdmin && (
                                <Link href="/admin" className="hidden sm:block">
                                    <Button variant="outline" size="sm" className="border-indigo-500 text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-950/20">
                                        <Shield className="mr-2 h-4 w-4" />
                                        Admin
                                    </Button>
                                </Link>
                            )}
                            {user?.role === 'admin' && (
                                <Link href="/users" className="hidden sm:block">
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
                                <LogOut className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Sair</span>
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-6">
                {/* User Info Card with Avatar */}
                <Card className="border-0 shadow-lg bg-gradient-to-r from-violet-500 to-indigo-600 text-white overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32" />
                    <CardContent className="relative z-10 pt-6">
                        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-6">
                            {/* Avatar with Upload */}
                            <div className="relative group">
                                <Avatar className="h-24 w-24 sm:h-28 sm:w-28 border-4 border-white/30 shadow-xl">
                                    <AvatarImage src={displayAvatarUrl} alt={user?.name || 'Usuário'} />
                                    <AvatarFallback className="bg-white/20 text-white text-2xl sm:text-3xl font-bold">
                                        {userInitials}
                                    </AvatarFallback>
                                </Avatar>

                                {/* Upload overlay */}
                                <div
                                    className="absolute inset-0 rounded-full bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isUploadingAvatar ? (
                                        <Loader2 className="h-6 w-6 animate-spin" />
                                    ) : (
                                        <Camera className="h-6 w-6" />
                                    )}
                                </div>

                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={handleAvatarUpload}
                                />

                                {/* Remove button */}
                                {avatarUrl && (
                                    <button
                                        onClick={handleRemoveAvatar}
                                        className="absolute -top-1 -right-1 h-6 w-6 rounded-full bg-red-500 flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                        title="Remover foto"
                                    >
                                        <X className="h-3 w-3" />
                                    </button>
                                )}
                            </div>

                            <div className="text-center sm:text-left min-w-0 flex-1">
                                <h2 className="text-2xl sm:text-3xl font-bold truncate">{user?.name}</h2>
                                <p className="text-violet-100 flex items-center justify-center sm:justify-start gap-2 mt-1">
                                    <Mail className="h-4 w-4 shrink-0" />
                                    <span className="truncate">{user?.email}</span>
                                </p>
                                <div className="flex items-center justify-center sm:justify-start gap-2 mt-2">
                                    <Shield className="h-4 w-4 shrink-0" />
                                    <span className="text-sm capitalize px-3 py-1 bg-white/20 rounded-full">
                                        {user?.role === 'admin' ? 'Administrador' : 'Usuário'}
                                    </span>
                                </div>
                                <p className="text-xs text-violet-200 mt-3">
                                    Clique na foto para alterar ou use o{' '}
                                    <a
                                        href="https://gravatar.com"
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="underline hover:text-white"
                                    >
                                        Gravatar
                                    </a>
                                    {' '}do seu email
                                </p>
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
                                    <Label htmlFor="phone">Telefone / WhatsApp</Label>
                                    <Input
                                        id="phone"
                                        value={phone}
                                        onChange={(e) => setPhone(e.target.value)}
                                        placeholder="(00) 00000-0000"
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
