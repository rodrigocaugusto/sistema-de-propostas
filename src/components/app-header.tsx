'use client';

import Link from "next/link";
import Image from "next/image";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { TemplateSelectorDialog } from "@/components/template-selector-dialog";
import {
    Plus, Settings, Package, DollarSign, Users, LogOut, Shield, ClipboardList, Menu, Home, Book
} from "lucide-react";
import { useState } from "react";

interface AppHeaderProps {
    session: {
        id?: string;
        name?: string;
        email?: string;
        avatarUrl?: string | null;
        role?: string;
        isSuperAdmin?: boolean;
    } | null;
    logoutAction: () => Promise<void>;
}

// Helper function to get Gravatar URL
function getGravatarUrl(email: string, size: number = 80): string {
    // Simple hash for client-side (for server-side use the full crypto version)
    const hash = email.toLowerCase().trim();
    // Using a placeholder approach since we can't use crypto on client
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

export function AppHeader({ session, logoutAction }: AppHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    const avatarUrl = session?.avatarUrl || (session?.email ? getGravatarUrl(session.email) : undefined);
    const userInitials = session?.name ? getUserInitials(session.name) : 'U';

    const menuItems = [
        { href: "/dashboard", label: "Dashboard", icon: Home, show: true },
        { href: "/clients", label: "Clientes", icon: Users, show: true },
        { href: "/products", label: "Produtos", icon: Package, show: true },
        { href: "/settings", label: "Configurações", icon: Settings, show: true },
        { href: "/billing", label: "Assinatura", icon: DollarSign, show: session?.role === 'admin' },
        { href: "/admin", label: "Super Admin", icon: Shield, show: session?.isSuperAdmin },
        { href: "/admin/knowledge", label: "Base de Conhecimento (Admin)", icon: Book, show: session?.isSuperAdmin },
        { href: "/audit", label: "Auditoria", icon: ClipboardList, show: session?.role === 'admin' },
    ];

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex justify-between items-center">
                    {/* Logo */}
                    <Link href="/dashboard" className="flex items-center gap-3">
                        <img
                            src="/system-logo.png"
                            alt="Sistema de Propostas"
                            className="h-8 sm:h-10 w-auto object-contain dark:invert"
                        />
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex gap-2 items-center">
                        {/* Main menu items */}
                        <Link href="/clients">
                            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                                <Users className="mr-2 h-4 w-4" />
                                Clientes
                            </Button>
                        </Link>
                        <Link href="/products">
                            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                                <Package className="mr-2 h-4 w-4" />
                                Produtos
                            </Button>
                        </Link>
                        <Link href="/settings">
                            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                                <Settings className="mr-2 h-4 w-4" />
                                Configurações
                            </Button>
                        </Link>

                        {/* Super Admin */}
                        {session?.isSuperAdmin && (
                            <Link href="/admin">
                                <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                                    <Shield className="mr-2 h-4 w-4" />
                                    Super Admin
                                </Button>
                            </Link>
                        )}

                        {/* Billing - Icon only */}
                        {session?.role === 'admin' && (
                            <Link href="/billing">
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400" title="Assinatura">
                                    <DollarSign className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}

                        {/* Audit - Icon only */}
                        {session?.role === 'admin' && (
                            <Link href="/audit">
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400" title="Auditoria">
                                    <ClipboardList className="h-4 w-4" />
                                </Button>
                            </Link>
                        )}

                        <ThemeToggle />

                        {/* User Avatar with link to profile */}
                        <Link href="/profile" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={avatarUrl} alt={session?.name || 'Usuário'} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-medium">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[100px] truncate">
                                {session?.name?.split(' ')[0] || 'Usuário'}
                            </span>
                        </Link>

                        {/* New Proposal Button */}
                        <TemplateSelectorDialog>
                            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                                <Plus className="mr-2 h-4 w-4" />
                                Nova Proposta
                            </Button>
                        </TemplateSelectorDialog>

                        {/* Logout - After New Proposal */}
                        <form action={logoutAction}>
                            <Button variant="ghost" size="icon" className="text-slate-500 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" title="Sair">
                                <LogOut className="h-4 w-4" />
                            </Button>
                        </form>
                    </div>

                    {/* Mobile Navigation */}
                    <div className="flex lg:hidden items-center gap-2">
                        <TemplateSelectorDialog>
                            <Button size="sm" className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                                <Plus className="h-4 w-4" />
                                <span className="hidden sm:inline ml-2">Nova Proposta</span>
                            </Button>
                        </TemplateSelectorDialog>

                        <Sheet open={isOpen} onOpenChange={setIsOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
                                    <Menu className="h-5 w-5" />
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[280px] sm:w-[320px] p-0">
                                <SheetHeader className="border-b border-slate-200 dark:border-slate-800 p-4">
                                    <SheetTitle className="flex items-center gap-3">
                                        <Avatar className="h-10 w-10">
                                            <AvatarImage src={avatarUrl} alt={session?.name || 'Usuário'} />
                                            <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-sm font-medium">
                                                {userInitials}
                                            </AvatarFallback>
                                        </Avatar>
                                        <div className="text-left min-w-0">
                                            <p className="font-semibold text-slate-900 dark:text-white truncate">{session?.name || 'Usuário'}</p>
                                            <p className="text-xs text-slate-500 truncate">{session?.email}</p>
                                        </div>
                                    </SheetTitle>
                                </SheetHeader>

                                <nav className="flex-1 overflow-y-auto py-4">
                                    {/* Profile Link */}
                                    <div className="px-3 mb-2">
                                        <SheetClose asChild>
                                            <Link href="/profile">
                                                <Button
                                                    variant="outline"
                                                    className="w-full justify-center h-10 text-sm font-medium border-violet-200 text-violet-600 hover:bg-violet-50 dark:border-violet-800 dark:text-violet-400"
                                                >
                                                    Editar Perfil
                                                </Button>
                                            </Link>
                                        </SheetClose>
                                    </div>

                                    <div className="space-y-1 px-3">
                                        {menuItems.filter(item => item.show).map((item) => (
                                            <SheetClose asChild key={item.href}>
                                                <Link href={item.href}>
                                                    <Button
                                                        variant="ghost"
                                                        className="w-full justify-start h-12 text-base font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                                                    >
                                                        <item.icon className="mr-3 h-5 w-5 text-slate-500" />
                                                        {item.label}
                                                    </Button>
                                                </Link>
                                            </SheetClose>
                                        ))}
                                    </div>

                                    <div className="border-t border-slate-200 dark:border-slate-800 mt-4 pt-4 px-3">
                                        <div className="flex items-center justify-between px-3 mb-4">
                                            <span className="text-sm font-medium text-slate-500">Tema</span>
                                            <ThemeToggle />
                                        </div>

                                        <form action={logoutAction}>
                                            <Button
                                                variant="ghost"
                                                className="w-full justify-start h-12 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                            >
                                                <LogOut className="mr-3 h-5 w-5" />
                                                Sair da Conta
                                            </Button>
                                        </form>
                                    </div>
                                </nav>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </header>
    );
}
