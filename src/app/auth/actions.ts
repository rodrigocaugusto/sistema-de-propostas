'use server';

import { prisma } from '@/lib/db';
import {
    hashPassword,
    verifyPassword,
    createToken,
    setSession,
    clearSession,
    getSession,
    generatePassword,
} from '@/lib/auth';
import { redirect } from 'next/navigation';

export async function login(email: string, password: string, honeypot?: string): Promise<{ success: boolean; error?: string }> {
    try {
        // 1. Honeypot check: If the hidden field is filled, it's a bot
        if (honeypot) {
            console.log(`Bot attempt blocked for email: ${email}`);
            return { success: false, error: 'Credenciais inválidas' };
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            return { success: false, error: 'Credenciais inválidas' };
        }

        if (!user.isActive) {
            return { success: false, error: 'Usuário desativado. Entre em contato com o administrador.' };
        }

        // 2. Bruteforce protection check
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            return {
                success: false,
                error: 'Muitas tentativas falhas. Conta bloqueada temporariamente. Tente novamente em 15 minutos.'
            };
        }

        const isValid = await verifyPassword(password, user.password);

        if (!isValid) {
            // Increment failed attempts
            const attempts = user.failedLoginAttempts + 1;
            let lockoutUntil = null;

            // Block after 5 failed attempts
            if (attempts >= 5) {
                lockoutUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes lockout
            }

            await prisma.user.update({
                where: { id: user.id },
                data: {
                    failedLoginAttempts: attempts,
                    lockoutUntil: lockoutUntil
                }
            });

            return { success: false, error: 'Credenciais inválidas' };
        }

        // Successful Login: Reset counters
        await prisma.user.update({
            where: { id: user.id },
            data: {
                lastLogin: new Date(),
                failedLoginAttempts: 0,
                lockoutUntil: null
            },
        });

        const token = await createToken({
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            companyId: user.companyId || undefined,
            isSuperAdmin: user.isSuperAdmin,
        });

        await setSession(token);

        return { success: true };
    } catch (error) {
        console.error('Login error:', error);
        return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
}

export async function logout() {
    await clearSession();
    redirect('/login');
}

export async function getCurrentUser() {
    return getSession();
}

export async function createUser(data: {
    email: string;
    name: string;
    password: string;
    role?: string;
}): Promise<{ success: boolean; error?: string; user?: { id: string; email: string; name: string } }> {
    try {
        const session = await getSession();

        // Only admins can create users
        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Acesso negado. Apenas administradores podem criar usuários.' };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
            return { success: false, error: 'Este e-mail já está em uso.' };
        }

        const hashedPassword = await hashPassword(data.password);

        // Ensure we link the user to the creator's company (unless super admin creating for a specific company, but let's keep it simple: admin creates for their own company)
        if (!session.companyId && !session.isSuperAdmin) {
            return { success: false, error: 'Erro de sessão. ID da empresa não encontrado.' };
        }

        const user = await prisma.user.create({
            data: {
                email: data.email.toLowerCase(),
                name: data.name,
                password: hashedPassword,
                role: data.role || 'user',
                companyId: session.companyId!, // ! operator because we checked (or it's super admin who might have it undefined, but normally admin has it)
                // If super admin is creating a user, we might need to specify companyId in args, but let's assume Super Admin creates admins via another flow or this form is for tenant admins.
                // For now, assume session.companyId exists.
            },
            select: {
                id: true,
                email: true,
                name: true,
            },
        });

        return { success: true, user };
    } catch (error) {
        console.error('Create user error:', error);
        return { success: false, error: 'Erro ao criar usuário. Tente novamente.' };
    }
}

export async function updateUser(
    userId: string,
    data: {
        name?: string;
        email?: string;
        role?: string;
        isActive?: boolean;
    }
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getSession();

        if (!session) {
            return { success: false, error: 'Não autenticado' };
        }

        // Check if target user belongs to same company
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser) return { success: false, error: 'Usuário não encontrado' };

        if (targetUser.companyId !== session.companyId && !session.isSuperAdmin) {
            return { success: false, error: 'Acesso negado.' };
        }

        // Only admins can update other users
        if (session.id !== userId && session.role !== 'admin') {
            return { success: false, error: 'Acesso negado' };
        }

        // Non-admins can only update their own name
        if (session.role !== 'admin' && (data.role || data.isActive !== undefined)) {
            return { success: false, error: 'Acesso negado para alterar permissões' };
        }

        if (data.email) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    email: data.email.toLowerCase(),
                    NOT: { id: userId },
                },
            });

            if (existingUser) {
                return { success: false, error: 'Este e-mail já está em uso.' };
            }
        }

        await prisma.user.update({
            where: { id: userId },
            data: {
                ...(data.name && { name: data.name }),
                ...(data.email && { email: data.email.toLowerCase() }),
                ...(data.role && { role: data.role }),
                ...(data.isActive !== undefined && { isActive: data.isActive }),
            },
        });

        return { success: true };
    } catch (error) {
        console.error('Update user error:', error);
        return { success: false, error: 'Erro ao atualizar usuário.' };
    }
}

export async function changePassword(
    currentPassword: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getSession();

        if (!session) {
            return { success: false, error: 'Não autenticado' };
        }

        const user = await prisma.user.findUnique({
            where: { id: session.id },
        });

        if (!user) {
            return { success: false, error: 'Usuário não encontrado' };
        }

        const isValid = await verifyPassword(currentPassword, user.password);

        if (!isValid) {
            return { success: false, error: 'Senha atual incorreta' };
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: session.id },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error('Change password error:', error);
        return { success: false, error: 'Erro ao alterar senha.' };
    }
}

export async function resetUserPassword(
    userId: string,
    newPassword: string
): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Acesso negado. Apenas administradores podem redefinir senhas.' };
        }

        // Check company scope
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser || (targetUser.companyId !== session.companyId && !session.isSuperAdmin)) {
            return { success: false, error: 'Usuário não encontrado ou acesso negado' };
        }

        const hashedPassword = await hashPassword(newPassword);

        await prisma.user.update({
            where: { id: userId },
            data: { password: hashedPassword },
        });

        return { success: true };
    } catch (error) {
        console.error('Reset password error:', error);
        return { success: false, error: 'Erro ao redefinir senha.' };
    }
}

export async function deleteUser(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return { success: false, error: 'Acesso negado' };
        }

        // Scope check
        const targetUser = await prisma.user.findUnique({ where: { id: userId } });
        if (!targetUser || (targetUser.companyId !== session.companyId && !session.isSuperAdmin)) {
            return { success: false, error: 'Acesso negado ou usuário não existe' };
        }

        if (session.id === userId) {
            return { success: false, error: 'Você não pode excluir sua própria conta.' };
        }

        await prisma.user.delete({
            where: { id: userId },
        });

        return { success: true };
    } catch (error) {
        console.error('Delete user error:', error);
        return { success: false, error: 'Erro ao excluir usuário.' };
    }
}

export async function listUsers() {
    try {
        const session = await getSession();

        if (!session || session.role !== 'admin') {
            return [];
        }

        return prisma.user.findMany({
            where: {
                companyId: session.companyId // Filter by company! (Super admin might want to see all, but for now listUsers is for the team page)
            },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                isActive: true,
                lastLogin: true,
                createdAt: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    } catch (error) {
        console.error('List users error:', error);
        return [];
    }
}

export async function generateNewPassword(): Promise<string> {
    return generatePassword(16);
}
