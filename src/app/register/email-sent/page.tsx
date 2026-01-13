'use client';

import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Mail, ArrowLeft, RefreshCw } from 'lucide-react';
import { useState, Suspense } from 'react';
import { toast } from 'sonner';
import { resendVerificationEmail } from '@/app/auth/actions';

function EmailSentContent() {
    const searchParams = useSearchParams();
    const email = searchParams.get('email') || '';
    const [isResending, setIsResending] = useState(false);

    const handleResend = async () => {
        if (!email) {
            toast.error('Email não encontrado');
            return;
        }

        setIsResending(true);
        try {
            const result = await resendVerificationEmail(email);
            if (result.success) {
                toast.success('Email reenviado com sucesso!');
            } else {
                toast.error(result.error || 'Erro ao reenviar email');
            }
        } catch {
            toast.error('Erro ao reenviar email');
        } finally {
            setIsResending(false);
        }
    };

    return (
        <div className="max-w-md w-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl p-8 border border-slate-200 dark:border-slate-800 text-center">
                {/* Icon */}
                <div className="h-20 w-20 bg-violet-100 dark:bg-violet-900/30 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Mail className="h-10 w-10 text-violet-600" />
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">
                    Verifique seu Email
                </h1>

                {/* Description */}
                <p className="text-slate-600 dark:text-slate-400 mb-2">
                    Enviamos um link de confirmação para:
                </p>
                <p className="text-violet-600 font-semibold mb-6">
                    {email || 'seu email'}
                </p>

                {/* Instructions */}
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4 mb-6 text-left">
                    <h3 className="font-semibold text-slate-900 dark:text-white mb-3 text-sm">
                        📋 Próximos passos:
                    </h3>
                    <ol className="text-sm text-slate-600 dark:text-slate-400 space-y-2 list-decimal list-inside">
                        <li>Abra sua caixa de entrada</li>
                        <li>Procure o email do <strong>DL Pro</strong></li>
                        <li>Clique no botão &quot;Confirmar Email&quot;</li>
                        <li>Pronto! Sua conta será ativada</li>
                    </ol>
                </div>

                {/* Spam Warning */}
                <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-6">
                    <p className="text-amber-700 dark:text-amber-400 text-sm">
                        💡 <strong>Não encontrou?</strong> Verifique a pasta de spam ou lixo eletrônico.
                    </p>
                </div>

                {/* Actions */}
                <div className="space-y-3">
                    <Button
                        onClick={handleResend}
                        disabled={isResending}
                        variant="outline"
                        className="w-full gap-2"
                    >
                        {isResending ? (
                            <>
                                <RefreshCw className="h-4 w-4 animate-spin" />
                                Reenviando...
                            </>
                        ) : (
                            <>
                                <RefreshCw className="h-4 w-4" />
                                Reenviar Email
                            </>
                        )}
                    </Button>

                    <Link href="/login" className="block">
                        <Button variant="ghost" className="w-full gap-2 text-slate-500">
                            <ArrowLeft className="h-4 w-4" />
                            Voltar para Login
                        </Button>
                    </Link>
                </div>
            </div>

            {/* Footer */}
            <p className="text-center text-slate-500 text-sm mt-6">
                O link expira em <strong>24 horas</strong>
            </p>
        </div>
    );
}

export default function EmailSentPage() {
    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-slate-900 flex items-center justify-center p-4">
            <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl" />
            </div>

            <Suspense fallback={
                <div className="text-white text-center">
                    <p>Carregando...</p>
                </div>
            }>
                <div className="relative z-10">
                    <EmailSentContent />
                </div>
            </Suspense>
        </div>
    );
}
