import { prisma } from '@/lib/db';
import { redirect } from 'next/navigation';
import { Metadata } from 'next';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle, XCircle, Clock } from 'lucide-react';

export const metadata: Metadata = {
    title: 'Verificar Email | DL Pro',
    description: 'Confirme seu email para ativar sua conta no DL Pro',
};

interface PageProps {
    params: Promise<{ token: string }>;
}

export default async function VerifyEmailPage({ params }: PageProps) {
    const { token } = await params;

    // Find user by verification token
    const user = await prisma.user.findFirst({
        where: {
            emailVerificationToken: token
        },
        include: {
            company: true
        }
    });

    // Token not found
    if (!user) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-red-900/20 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                        <div className="h-20 w-20 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <XCircle className="h-10 w-10 text-red-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Link Inválido
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Este link de verificação não existe ou já foi utilizado.
                        </p>
                        <Link href="/login">
                            <Button className="w-full">
                                Ir para Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Token expired
    if (user.emailVerificationExpires && user.emailVerificationExpires < new Date()) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-amber-900/20 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                        <div className="h-20 w-20 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Clock className="h-10 w-10 text-amber-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Link Expirado
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Este link de verificação expirou. Por favor, cadastre-se novamente
                            para receber um novo link.
                        </p>
                        <Link href="/register">
                            <Button className="w-full">
                                Cadastrar Novamente
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Already verified
    if (user.emailVerified) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4">
                <div className="max-w-md w-full text-center">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                        <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                            Email Já Verificado
                        </h1>
                        <p className="text-slate-600 dark:text-slate-400 mb-6">
                            Seu email já foi verificado anteriormente. Você pode fazer login normalmente.
                        </p>
                        <Link href="/login">
                            <Button className="w-full bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700">
                                Fazer Login
                            </Button>
                        </Link>
                    </div>
                </div>
            </div>
        );
    }

    // Verify the email
    await prisma.user.update({
        where: { id: user.id },
        data: {
            emailVerified: true,
            emailVerificationToken: null,
            emailVerificationExpires: null
        }
    });

    // Set trial end date now that email is verified (7 days from now)
    if (user.company && user.company.plan === 'trial' && !user.company.trialEndsAt) {
        const trialEndsAt = new Date();
        trialEndsAt.setDate(trialEndsAt.getDate() + 7);

        await prisma.company.update({
            where: { id: user.company.id },
            data: { trialEndsAt }
        });
    }

    // Success!
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-green-900/20 to-slate-900 flex items-center justify-center p-4">
            <div className="max-w-md w-full text-center">
                <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800">
                    <div className="relative mb-6">
                        <div className="h-20 w-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto">
                            <CheckCircle className="h-10 w-10 text-green-600" />
                        </div>
                        <span className="absolute top-0 right-1/3 text-3xl animate-bounce">🎉</span>
                    </div>

                    <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                        Email Verificado!
                    </h1>
                    <p className="text-slate-600 dark:text-slate-400 mb-2">
                        Sua conta foi ativada com sucesso.
                    </p>
                    <p className="text-slate-500 dark:text-slate-500 text-sm mb-8">
                        Seu período de teste de <strong className="text-violet-600">7 dias</strong> começou agora!
                    </p>

                    <Link href="/login">
                        <Button
                            size="lg"
                            className="w-full h-12 bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg text-lg font-semibold"
                        >
                            Acessar Minha Conta
                        </Button>
                    </Link>
                </div>
            </div>
        </div>
    );
}
