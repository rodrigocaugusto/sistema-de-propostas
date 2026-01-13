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
import { sendAdminNotification, sendEmailVerification } from '@/lib/email';
import crypto from 'crypto';

export async function login(email: string, password: string, honeypot?: string): Promise<{ success: boolean; error?: string }> {
    try {
        console.log(`[LOGIN] Attempt for: ${email}`);

        // 1. Honeypot check: If the hidden field is filled, it's a bot
        if (honeypot) {
            console.log(`[LOGIN] Bot attempt blocked for email: ${email}`);
            return { success: false, error: 'Credenciais inválidas' };
        }

        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() },
        });

        if (!user) {
            console.log(`[LOGIN] User not found: ${email}`);
            return { success: false, error: 'Credenciais inválidas' };
        }

        console.log(`[LOGIN] User found: ${user.email}, isActive: ${user.isActive}, companyId: ${user.companyId}`);

        if (!user.isActive) {
            console.log(`[LOGIN] User inactive: ${email}`);
            return { success: false, error: 'Usuário desativado. Entre em contato com o administrador.' };
        }

        // 3. Check if email is verified (for trial accounts)
        if (!user.emailVerified && !user.isSuperAdmin) {
            console.log(`[LOGIN] Email not verified: ${email}`);
            return {
                success: false,
                error: 'Email não verificado. Verifique sua caixa de entrada e clique no link de confirmação.'
            };
        }

        // 2. Bruteforce protection check
        if (user.lockoutUntil && user.lockoutUntil > new Date()) {
            console.log(`[LOGIN] User locked until: ${user.lockoutUntil}`);
            return {
                success: false,
                error: 'Muitas tentativas falhas. Conta bloqueada temporariamente. Tente novamente em 15 minutos.'
            };
        }

        const isValid = await verifyPassword(password, user.password);
        console.log(`[LOGIN] Password verification: ${isValid ? 'VALID' : 'INVALID'}`);

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

            console.log(`[LOGIN] Failed attempts: ${attempts}`);
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
            phone: (user as any).phone,
            avatarUrl: (user as any).avatarUrl,
        });

        console.log(`[LOGIN] Token created, setting session...`);
        await setSession(token);

        console.log(`[LOGIN] SUCCESS for ${email}`);
        return { success: true };
    } catch (error) {
        console.error('[LOGIN] Error:', error);
        return { success: false, error: 'Erro ao fazer login. Tente novamente.' };
    }
}

export async function logout() {
    await clearSession();
    redirect('/login');
}

export async function getCurrentUser() {
    const session = await getSession();
    if (!session?.id) return null;

    try {
        const user = await prisma.user.findUnique({
            where: { id: session.id },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                companyId: true,
                isSuperAdmin: true,
                phone: true,
                avatarUrl: true,
            }
        });
        return user;
    } catch (error) {
        console.error('Error fetching current user:', error);
        return null;
    }
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

        // Check limits
        if (session.companyId) {
            // We need to fetch company to know the plan and extraUsers
            // and count existing users.
            const company = await prisma.company.findUnique({
                where: { id: session.companyId },
                include: { users: true }
            });

            if (company) {
                const { getPlanUserLimit } = await import('@/lib/plans');
                const planLimit = getPlanUserLimit(company.plan);
                const totalLimit = planLimit + (company.extraUsers || 0);

                if (company.users.length >= totalLimit) {
                    return {
                        success: false,
                        error: `Limite de usuários atingido (${totalLimit}). Faça upgrade ou compre licenças extras.`
                    };
                }
            }
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

        // Notify Admin System about new user (internal)
        try {
            await sendAdminNotification('new_user_company', {
                title: `Novo Usuário Adicionado na Equipe`,
                details: {
                    'Nome': data.name,
                    'Email': data.email,
                    'Empresa ID': session.companyId || 'N/A',
                    'Criado Por': session.email,
                    'Role': data.role || 'user'
                }
            });
        } catch (e) {
            console.error('Failed to send admin alert:', e);
        }

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
        phone?: string;
        avatarUrl?: string | null;
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

        // Non-admins can only update their own name/phone/avatar
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
                ...(data.phone !== undefined && { phone: data.phone }),
                ...(data.avatarUrl !== undefined && { avatarUrl: data.avatarUrl }),
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

export async function createTrialAccount(data: {
    companyName: string;
    userName: string;
    email: string;
    password: string;
    honeypot?: string;
}): Promise<{ success: boolean; error?: string }> {
    try {
        if (data.honeypot) {
            return { success: false, error: 'Erro no cadastro.' };
        }

        const existingUser = await prisma.user.findUnique({
            where: { email: data.email.toLowerCase() },
        });

        if (existingUser) {
            return { success: false, error: 'Este e-mail já está em uso.' };
        }

        const hashedPassword = await hashPassword(data.password);

        // Generate verification token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        // Transaction to create company and user together
        const result = await prisma.$transaction(async (tx) => {
            const company = await tx.company.create({
                data: {
                    name: data.companyName,
                    email: data.email.toLowerCase(),
                    responsible: data.userName,
                    plan: 'trial',
                    status: 'active',
                    // trialEndsAt will be set when email is verified
                }
            });

            const user = await tx.user.create({
                data: {
                    email: data.email.toLowerCase(),
                    name: data.userName,
                    password: hashedPassword,
                    role: 'admin',
                    companyId: company.id,
                    isSuperAdmin: false,
                    emailVerified: false,
                    emailVerificationToken: verificationToken,
                    emailVerificationExpires: verificationExpires,
                }
            });

            return { company, user };
        });

        // Send verification email
        try {
            await sendEmailVerification(data.email, {
                userName: data.userName,
                verificationToken: verificationToken
            });
            console.log(`[REGISTER] Verification email sent to ${data.email}`);
        } catch (emailError) {
            console.error('[REGISTER] Failed to send verification email:', emailError);
            // Don't fail registration if email fails, user can resend
        }

        // Notify admin about new trial
        try {
            await sendAdminNotification('new_trial_user', {
                title: `Novo Trial Cadastrado (Aguardando Verificação)`,
                details: {
                    'Empresa': data.companyName,
                    'Nome': data.userName,
                    'Email': data.email,
                    'Status': 'Aguardando verificação de email'
                }
            });
        } catch (e) {
            console.error('Failed to notify admin', e);
        }

        return { success: true };

    } catch (error) {
        console.error('Create trial error:', error);
        return { success: false, error: 'Erro ao criar conta. Tente novamente.' };
    }
}

// Resend verification email
export async function resendVerificationEmail(email: string): Promise<{ success: boolean; error?: string }> {
    try {
        const user = await prisma.user.findUnique({
            where: { email: email.toLowerCase() }
        });

        if (!user) {
            // Don't reveal if email exists for security
            return { success: true };
        }

        if (user.emailVerified) {
            return { success: false, error: 'Este email já foi verificado. Faça login normalmente.' };
        }

        // Generate new token
        const verificationToken = crypto.randomBytes(32).toString('hex');
        const verificationExpires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

        await prisma.user.update({
            where: { id: user.id },
            data: {
                emailVerificationToken: verificationToken,
                emailVerificationExpires: verificationExpires
            }
        });

        await sendEmailVerification(email, {
            userName: user.name,
            verificationToken: verificationToken
        });

        return { success: true };
    } catch (error) {
        console.error('Resend verification error:', error);
        return { success: false, error: 'Erro ao reenviar email.' };
    }
}
