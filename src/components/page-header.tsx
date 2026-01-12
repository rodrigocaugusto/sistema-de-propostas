'use client';

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger, SheetClose } from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
    ChevronLeft, LogOut, Menu, Home, Settings, Package, Users, DollarSign, ClipboardList, Shield, BarChart3
} from "lucide-react";
import { useState } from "react";

// Icon mapping for dynamic rendering
const iconMap = {
    settings: Settings,
    package: Package,
    users: Users,
    home: Home,
    dollarSign: DollarSign,
    clipboardList: ClipboardList,
    shield: Shield,
    'bar-chart': BarChart3,
} as const;

type IconName = keyof typeof iconMap;

interface PageHeaderProps {
    title: string;
    subtitle?: string;
    iconName?: IconName;
    iconGradient?: string;
    session?: {
        name?: string;
        email?: string;
        avatarUrl?: string | null;
        role?: string;
        isSuperAdmin?: boolean;
    } | null;
    logoutAction?: () => Promise<void>;
    actions?: React.ReactNode;
}

// Helper function to get Gravatar URL
function getGravatarUrl(email: string, size: number = 80): string {
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

export function PageHeader({
    title,
    subtitle,
    iconName,
    iconGradient = "from-violet-500 to-indigo-600",
    session,
    logoutAction,
    actions
}: PageHeaderProps) {
    const [isOpen, setIsOpen] = useState(false);

    const avatarUrl = session?.avatarUrl || (session?.email ? getGravatarUrl(session.email) : undefined);
    const userInitials = session?.name ? getUserInitials(session.name) : 'U';

    // Get the icon component from the map
    const Icon = iconName ? iconMap[iconName] : null;

    const menuItems = [
        { href: "/dashboard", label: "Dashboard", icon: Home, show: true },
        { href: "/clients", label: "Clientes", icon: Users, show: true },
        { href: "/products", label: "Produtos", icon: Package, show: true },
        { href: "/reports", label: "Relatórios", icon: BarChart3, show: session?.role === 'admin' || session?.isSuperAdmin },
        { href: "/settings", label: "Configurações", icon: Settings, show: true },
        { href: "/billing", label: "Assinatura", icon: DollarSign, show: session?.role === 'admin' },
        { href: "/admin", label: "Super Admin", icon: Shield, show: session?.isSuperAdmin },
        { href: "/audit", label: "Auditoria", icon: ClipboardList, show: session?.role === 'admin' },
    ];

    return (
        <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
                <div className="flex justify-between items-center">
                    {/* Left side - Back button and title */}
                    <div className="flex items-center gap-2 sm:gap-4 min-w-0">
                        <Link href="/dashboard" className="shrink-0">
                            <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 px-2 sm:px-3">
                                <ChevronLeft className="h-4 w-4 sm:mr-2" />
                                <span className="hidden sm:inline">Dashboard</span>
                            </Button>
                        </Link>

                        <div className="hidden sm:block h-6 w-px bg-slate-200 dark:bg-slate-800" />

                        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
                            {Icon && (
                                <div className={`hidden sm:flex h-10 w-10 rounded-xl bg-gradient-to-br ${iconGradient} items-center justify-center shadow-lg`}>
                                    <Icon className="h-5 w-5 text-white" />
                                </div>
                            )}
                            <div className="min-w-0">
                                <h1 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate">{title}</h1>
                                {subtitle && (
                                    <p className="text-xs text-slate-500 dark:text-slate-400 hidden sm:block">{subtitle}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Right side - Desktop actions */}
                    <div className="hidden sm:flex items-center gap-2 sm:gap-4">
                        {actions}
                        <ThemeToggle />

                        {/* User Avatar */}
                        <Link href="/profile" className="flex items-center gap-2 px-2 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                            <Avatar className="h-8 w-8">
                                <AvatarImage src={avatarUrl} alt={session?.name || 'Usuário'} />
                                <AvatarFallback className="bg-gradient-to-br from-violet-500 to-indigo-600 text-white text-xs font-medium">
                                    {userInitials}
                                </AvatarFallback>
                            </Avatar>
                            <span className="text-sm font-medium text-slate-700 dark:text-slate-300 max-w-[80px] truncate hidden lg:block">
                                {session?.name?.split(' ')[0] || 'Usuário'}
                            </span>
                        </Link>

                        {logoutAction && (
                            <form action={logoutAction}>
                                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20" title="Sair">
                                    <LogOut className="h-4 w-4" />
                                </Button>
                            </form>
                        )}
                    </div>

                    {/* Mobile - Actions and Menu */}
                    <div className="flex sm:hidden items-center gap-2">
                        {actions}

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

                                        {logoutAction && (
                                            <form action={logoutAction}>
                                                <Button
                                                    variant="ghost"
                                                    className="w-full justify-start h-12 text-base font-medium text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20"
                                                >
                                                    <LogOut className="mr-3 h-5 w-5" />
                                                    Sair da Conta
                                                </Button>
                                            </form>
                                        )}
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
