'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import {
    getCurrentUser,
    listUsers,
    createUser,
    updateUser,
    deleteUser,
    resetUserPassword,
    generateNewPassword,
} from '@/app/auth/actions';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Copy,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Plus,
    RefreshCw,
    Shield,
    ShieldCheck,
    Trash2,
    User,
    UserCheck,
    UserX,
    Users as UsersIcon,
    Wand2,
    Pencil,
} from 'lucide-react';
import { ThemeToggle } from '@/components/theme-toggle';

interface UserData {
    id: string;
    email: string;
    name: string;
    role: string;
    isActive: boolean;
    lastLogin: Date | null;
    createdAt: Date;
}

export default function UsersPage() {
    const router = useRouter();
    const [currentUser, setCurrentUser] = useState<{ id: string; role: string } | null>(null);
    const [users, setUsers] = useState<UserData[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Create user dialog
    const [showCreateDialog, setShowCreateDialog] = useState(false);
    const [newUserName, setNewUserName] = useState('');
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPassword, setNewUserPassword] = useState('');
    const [newUserRole, setNewUserRole] = useState('user');
    const [showNewUserPassword, setShowNewUserPassword] = useState(false);
    const [isCreating, setIsCreating] = useState(false);

    // Edit user dialog
    const [showEditDialog, setShowEditDialog] = useState(false);
    const [editingUser, setEditingUser] = useState<UserData | null>(null);
    const [editName, setEditName] = useState('');
    const [editRole, setEditRole] = useState('');
    const [editIsActive, setEditIsActive] = useState(true);
    const [isUpdating, setIsUpdating] = useState(false);

    // Reset password dialog
    const [showResetPasswordDialog, setShowResetPasswordDialog] = useState(false);
    const [resetPasswordUser, setResetPasswordUser] = useState<UserData | null>(null);
    const [newPassword, setNewPassword] = useState('');
    const [showResetPassword, setShowResetPassword] = useState(false);
    const [isResetting, setIsResetting] = useState(false);

    // Delete dialog
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [deletingUser, setDeletingUser] = useState<UserData | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const loadData = useCallback(async () => {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            router.push('/');
            return;
        }
        setCurrentUser(user);

        const usersList = await listUsers();
        setUsers(usersList);
        setIsLoading(false);
    }, [router]);

    useEffect(() => {
        loadData();
    }, [loadData]);

    const handleGeneratePassword = async () => {
        const password = await generateNewPassword();
        setNewUserPassword(password);
        setShowNewUserPassword(true);
    };

    const handleGenerateResetPassword = async () => {
        const password = await generateNewPassword();
        setNewPassword(password);
        setShowResetPassword(true);
    };

    const handleCopyPassword = (password: string) => {
        navigator.clipboard.writeText(password);
        toast.success('Senha copiada para a área de transferência');
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!newUserName.trim() || !newUserEmail.trim() || !newUserPassword) {
            toast.error('Preencha todos os campos');
            return;
        }

        setIsCreating(true);
        try {
            const result = await createUser({
                name: newUserName.trim(),
                email: newUserEmail.trim(),
                password: newUserPassword,
                role: newUserRole,
            });

            if (result.success) {
                toast.success('Usuário criado com sucesso!');
                setShowCreateDialog(false);
                setNewUserName('');
                setNewUserEmail('');
                setNewUserPassword('');
                setNewUserRole('user');
                loadData();
            } else {
                toast.error(result.error || 'Erro ao criar usuário');
            }
        } catch {
            toast.error('Erro ao criar usuário');
        } finally {
            setIsCreating(false);
        }
    };

    const handleEditUser = (user: UserData) => {
        setEditingUser(user);
        setEditName(user.name);
        setEditRole(user.role);
        setEditIsActive(user.isActive);
        setShowEditDialog(true);
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;

        setIsUpdating(true);
        try {
            const result = await updateUser(editingUser.id, {
                name: editName.trim(),
                role: editRole,
                isActive: editIsActive,
            });

            if (result.success) {
                toast.success('Usuário atualizado com sucesso!');
                setShowEditDialog(false);
                loadData();
            } else {
                toast.error(result.error || 'Erro ao atualizar usuário');
            }
        } catch {
            toast.error('Erro ao atualizar usuário');
        } finally {
            setIsUpdating(false);
        }
    };

    const handleResetPassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!resetPasswordUser || !newPassword) return;

        setIsResetting(true);
        try {
            const result = await resetUserPassword(resetPasswordUser.id, newPassword);

            if (result.success) {
                toast.success('Senha redefinida com sucesso!');
                setShowResetPasswordDialog(false);
                setNewPassword('');
            } else {
                toast.error(result.error || 'Erro ao redefinir senha');
            }
        } catch {
            toast.error('Erro ao redefinir senha');
        } finally {
            setIsResetting(false);
        }
    };

    const handleDeleteUser = async () => {
        if (!deletingUser) return;

        setIsDeleting(true);
        try {
            const result = await deleteUser(deletingUser.id);

            if (result.success) {
                toast.success('Usuário excluído com sucesso!');
                setShowDeleteDialog(false);
                loadData();
            } else {
                toast.error(result.error || 'Erro ao excluir usuário');
            }
        } catch {
            toast.error('Erro ao excluir usuário');
        } finally {
            setIsDeleting(false);
        }
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
                <div className="max-w-6xl mx-auto px-6 py-4">
                    <div className="flex justify-between items-center">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
                                    <ArrowLeft className="h-5 w-5" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-xl font-bold text-slate-900 dark:text-white">Gerenciar Usuários</h1>
                                <p className="text-xs text-slate-500 dark:text-slate-400">
                                    {users.length} usuário{users.length !== 1 ? 's' : ''} cadastrado{users.length !== 1 ? 's' : ''}
                                </p>
                            </div>
                        </div>
                        <div className="flex gap-3 items-center">
                            <ThemeToggle />
                            <Button onClick={() => setShowCreateDialog(true)} className="bg-gradient-to-r from-violet-500 to-indigo-600">
                                <Plus className="mr-2 h-4 w-4" />
                                Novo Usuário
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-8">
                {/* Stats */}
                <div className="grid gap-4 md:grid-cols-3 mb-8">
                    <Card className="border-0 shadow-lg bg-gradient-to-br from-violet-500 to-indigo-600 text-white">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-violet-100 text-sm">Total de Usuários</p>
                                    <p className="text-3xl font-bold">{users.length}</p>
                                </div>
                                <UsersIcon className="h-8 w-8 opacity-50" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-sm">Administradores</p>
                                    <p className="text-3xl font-bold text-amber-600">
                                        {users.filter(u => u.role === 'admin').length}
                                    </p>
                                </div>
                                <ShieldCheck className="h-8 w-8 text-amber-500" />
                            </div>
                        </CardContent>
                    </Card>
                    <Card className="border-0 shadow-lg">
                        <CardContent className="pt-6">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-slate-500 text-sm">Usuários Ativos</p>
                                    <p className="text-3xl font-bold text-emerald-600">
                                        {users.filter(u => u.isActive).length}
                                    </p>
                                </div>
                                <UserCheck className="h-8 w-8 text-emerald-500" />
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {/* Users List */}
                <Card className="border-0 shadow-lg">
                    <CardHeader>
                        <CardTitle>Lista de Usuários</CardTitle>
                        <CardDescription>Gerencie os usuários do sistema</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4">
                            {users.map((user) => (
                                <div
                                    key={user.id}
                                    className={`flex items-center justify-between p-4 rounded-xl border ${user.isActive
                                            ? 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700'
                                            : 'bg-slate-50 dark:bg-slate-900 border-slate-200 dark:border-slate-800 opacity-60'
                                        }`}
                                >
                                    <div className="flex items-center gap-4">
                                        <div
                                            className={`h-12 w-12 rounded-xl flex items-center justify-center ${user.role === 'admin'
                                                    ? 'bg-amber-100 dark:bg-amber-900/30'
                                                    : 'bg-violet-100 dark:bg-violet-900/30'
                                                }`}
                                        >
                                            {user.role === 'admin' ? (
                                                <Shield className="h-6 w-6 text-amber-600" />
                                            ) : (
                                                <User className="h-6 w-6 text-violet-600" />
                                            )}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2">
                                                <p className="font-medium text-slate-900 dark:text-white">{user.name}</p>
                                                {currentUser?.id === user.id && (
                                                    <span className="text-xs bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-400 px-2 py-0.5 rounded-full">
                                                        Você
                                                    </span>
                                                )}
                                                {!user.isActive && (
                                                    <span className="text-xs bg-red-100 dark:bg-red-900 text-red-600 dark:text-red-400 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                        <UserX className="h-3 w-3" />
                                                        Inativo
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm text-slate-500 dark:text-slate-400">{user.email}</p>
                                            <p className="text-xs text-slate-400 dark:text-slate-500">
                                                {user.lastLogin
                                                    ? `Último acesso: ${new Date(user.lastLogin).toLocaleDateString('pt-BR')} às ${new Date(user.lastLogin).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
                                                    : 'Nunca acessou'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleEditUser(user)}
                                        >
                                            <Pencil className="h-4 w-4" />
                                        </Button>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setResetPasswordUser(user);
                                                setShowResetPasswordDialog(true);
                                            }}
                                        >
                                            <KeyRound className="h-4 w-4" />
                                        </Button>
                                        {currentUser?.id !== user.id && (
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                className="text-red-600 hover:bg-red-50 dark:hover:bg-red-950"
                                                onClick={() => {
                                                    setDeletingUser(user);
                                                    setShowDeleteDialog(true);
                                                }}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        )}
                                    </div>
                                </div>
                            ))}

                            {users.length === 0 && (
                                <div className="text-center py-12 text-slate-500">
                                    <UsersIcon className="h-12 w-12 mx-auto mb-4 opacity-50" />
                                    <p>Nenhum usuário cadastrado</p>
                                </div>
                            )}
                        </div>
                    </CardContent>
                </Card>
            </main>

            {/* Create User Dialog */}
            <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Criar Novo Usuário</DialogTitle>
                        <DialogDescription>
                            Preencha os dados para criar um novo usuário no sistema
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleCreateUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="create-name">Nome</Label>
                            <Input
                                id="create-name"
                                value={newUserName}
                                onChange={(e) => setNewUserName(e.target.value)}
                                placeholder="Nome completo"
                                disabled={isCreating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-email">E-mail</Label>
                            <Input
                                id="create-email"
                                type="email"
                                value={newUserEmail}
                                onChange={(e) => setNewUserEmail(e.target.value)}
                                placeholder="email@exemplo.com"
                                disabled={isCreating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-password">Senha</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="create-password"
                                        type={showNewUserPassword ? 'text' : 'password'}
                                        value={newUserPassword}
                                        onChange={(e) => setNewUserPassword(e.target.value)}
                                        placeholder="••••••••"
                                        disabled={isCreating}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowNewUserPassword(!showNewUserPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showNewUserPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" onClick={handleGeneratePassword}>
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                                {newUserPassword && (
                                    <Button type="button" variant="outline" onClick={() => handleCopyPassword(newUserPassword)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="create-role">Tipo de Usuário</Label>
                            <Select value={newUserRole} onValueChange={setNewUserRole}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowCreateDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isCreating}>
                                {isCreating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Criando...
                                    </>
                                ) : (
                                    <>
                                        <Plus className="mr-2 h-4 w-4" />
                                        Criar Usuário
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Edit User Dialog */}
            <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Editar Usuário</DialogTitle>
                        <DialogDescription>
                            Altere as informações do usuário
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleUpdateUser} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="edit-name">Nome</Label>
                            <Input
                                id="edit-name"
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nome completo"
                                disabled={isUpdating}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="edit-role">Tipo de Usuário</Label>
                            <Select value={editRole} onValueChange={setEditRole} disabled={editingUser?.id === currentUser?.id}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="user">Usuário</SelectItem>
                                    <SelectItem value="admin">Administrador</SelectItem>
                                </SelectContent>
                            </Select>
                            {editingUser?.id === currentUser?.id && (
                                <p className="text-xs text-slate-500">
                                    Você não pode alterar seu próprio tipo de usuário
                                </p>
                            )}
                        </div>
                        <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-slate-900">
                            <div className="space-y-0.5">
                                <Label htmlFor="edit-active">Usuário Ativo</Label>
                                <p className="text-xs text-slate-500">
                                    Usuários inativos não podem fazer login
                                </p>
                            </div>
                            <Switch
                                id="edit-active"
                                checked={editIsActive}
                                onCheckedChange={setEditIsActive}
                                disabled={isUpdating || editingUser?.id === currentUser?.id}
                            />
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowEditDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isUpdating}>
                                {isUpdating ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Salvando...
                                    </>
                                ) : (
                                    <>
                                        <RefreshCw className="mr-2 h-4 w-4" />
                                        Salvar Alterações
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Reset Password Dialog */}
            <Dialog open={showResetPasswordDialog} onOpenChange={setShowResetPasswordDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Redefinir Senha</DialogTitle>
                        <DialogDescription>
                            Defina uma nova senha para {resetPasswordUser?.name}
                        </DialogDescription>
                    </DialogHeader>
                    <form onSubmit={handleResetPassword} className="space-y-4">
                        <div className="space-y-2">
                            <Label htmlFor="reset-password">Nova Senha</Label>
                            <div className="flex gap-2">
                                <div className="relative flex-1">
                                    <Input
                                        id="reset-password"
                                        type={showResetPassword ? 'text' : 'password'}
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        placeholder="••••••••"
                                        disabled={isResetting}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowResetPassword(!showResetPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                                    >
                                        {showResetPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                    </button>
                                </div>
                                <Button type="button" variant="outline" onClick={handleGenerateResetPassword}>
                                    <Wand2 className="h-4 w-4" />
                                </Button>
                                {newPassword && (
                                    <Button type="button" variant="outline" onClick={() => handleCopyPassword(newPassword)}>
                                        <Copy className="h-4 w-4" />
                                    </Button>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setShowResetPasswordDialog(false)}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isResetting} className="bg-amber-500 hover:bg-amber-600">
                                {isResetting ? (
                                    <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Redefinindo...
                                    </>
                                ) : (
                                    <>
                                        <KeyRound className="mr-2 h-4 w-4" />
                                        Redefinir Senha
                                    </>
                                )}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {/* Delete User Dialog */}
            <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-red-600">Excluir Usuário</DialogTitle>
                        <DialogDescription>
                            Tem certeza que deseja excluir o usuário <strong>{deletingUser?.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </DialogDescription>
                    </DialogHeader>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                            Cancelar
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={handleDeleteUser}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Excluindo...
                                </>
                            ) : (
                                <>
                                    <Trash2 className="mr-2 h-4 w-4" />
                                    Excluir Usuário
                                </>
                            )}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
