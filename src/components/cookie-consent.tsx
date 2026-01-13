'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { Cookie, X, Settings2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';

const COOKIE_CONSENT_KEY = 'dl_pro_cookie_consent';

interface CookiePreferences {
    essential: boolean;  // Always true, can't be disabled
    analytics: boolean;
    marketing: boolean;
    accepted: boolean;
    timestamp: number;
}

export function CookieConsent() {
    const pathname = usePathname();
    const [showBanner, setShowBanner] = useState(false);
    const [showSettings, setShowSettings] = useState(false);
    const [preferences, setPreferences] = useState<CookiePreferences>({
        essential: true,
        analytics: false,
        marketing: false,
        accepted: false,
        timestamp: 0
    });

    useEffect(() => {
        // Only show on landing page (and related landing pages)
        if (pathname !== '/' && pathname !== '/privacidade' && pathname !== '/termos') {
            return;
        }

        // Check if consent was already given
        const stored = localStorage.getItem(COOKIE_CONSENT_KEY);
        if (stored) {
            try {
                const parsed = JSON.parse(stored) as CookiePreferences;
                // Check if consent is still valid (1 year)
                const oneYear = 365 * 24 * 60 * 60 * 1000;
                if (Date.now() - parsed.timestamp < oneYear && parsed.accepted) {
                    setPreferences(parsed);
                    return; // Don't show banner
                }
            } catch (e) {
                // Invalid stored value, show banner
            }
        }

        // Show banner after a short delay for better UX
        const timer = setTimeout(() => setShowBanner(true), 1500);
        return () => clearTimeout(timer);
    }, [pathname]);

    // Only render on landing page
    if (pathname !== '/' && pathname !== '/privacidade' && pathname !== '/termos') {
        return null;
    }

    const acceptAll = () => {
        const newPrefs: CookiePreferences = {
            essential: true,
            analytics: true,
            marketing: true,
            accepted: true,
            timestamp: Date.now()
        };
        setPreferences(newPrefs);
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newPrefs));
        setShowBanner(false);
        setShowSettings(false);
    };

    const acceptSelected = () => {
        const newPrefs: CookiePreferences = {
            ...preferences,
            essential: true, // Always required
            accepted: true,
            timestamp: Date.now()
        };
        setPreferences(newPrefs);
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newPrefs));
        setShowBanner(false);
        setShowSettings(false);
    };

    const rejectNonEssential = () => {
        const newPrefs: CookiePreferences = {
            essential: true,
            analytics: false,
            marketing: false,
            accepted: true,
            timestamp: Date.now()
        };
        setPreferences(newPrefs);
        localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(newPrefs));
        setShowBanner(false);
        setShowSettings(false);
    };

    if (!showBanner) return null;

    return (
        <AnimatePresence>
            <motion.div
                initial={{ y: 100, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                exit={{ y: 100, opacity: 0 }}
                transition={{ type: 'spring', damping: 25, stiffness: 300 }}
                className="fixed bottom-0 left-0 right-0 z-[9998] p-4 md:p-6"
            >
                <div className="max-w-4xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
                        {/* Main Banner */}
                        {!showSettings ? (
                            <div className="p-6">
                                <div className="flex items-start gap-4">
                                    <div className="shrink-0 h-12 w-12 bg-violet-100 dark:bg-violet-900/30 rounded-xl flex items-center justify-center">
                                        <Cookie className="h-6 w-6 text-violet-600" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <h3 className="font-bold text-slate-900 dark:text-white text-lg mb-2">
                                            🍪 Este site usa cookies
                                        </h3>
                                        <p className="text-slate-600 dark:text-slate-400 text-sm mb-4">
                                            Utilizamos cookies para melhorar sua experiência, analisar o tráfego do site
                                            e personalizar conteúdo. Você pode aceitar todos os cookies, configurar suas
                                            preferências ou rejeitar cookies não essenciais.
                                        </p>
                                        <p className="text-slate-500 dark:text-slate-500 text-xs mb-4">
                                            Leia nossa{' '}
                                            <Link href="/privacidade" className="text-violet-600 hover:underline">
                                                Política de Privacidade
                                            </Link>{' '}
                                            para mais informações.
                                        </p>

                                        <div className="flex flex-wrap gap-3">
                                            <Button
                                                onClick={acceptAll}
                                                className="bg-violet-600 hover:bg-violet-700 text-white"
                                            >
                                                Aceitar Todos
                                            </Button>
                                            <Button
                                                onClick={rejectNonEssential}
                                                variant="outline"
                                                className="border-slate-300"
                                            >
                                                Apenas Essenciais
                                            </Button>
                                            <Button
                                                onClick={() => setShowSettings(true)}
                                                variant="ghost"
                                                className="text-slate-600 gap-2"
                                            >
                                                <Settings2 className="h-4 w-4" />
                                                Configurar
                                            </Button>
                                        </div>
                                    </div>
                                    <button
                                        onClick={rejectNonEssential}
                                        className="shrink-0 text-slate-400 hover:text-slate-600 transition-colors"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>
                            </div>
                        ) : (
                            /* Settings Panel */
                            <div className="p-6">
                                <div className="flex items-center justify-between mb-6">
                                    <h3 className="font-bold text-slate-900 dark:text-white text-lg">
                                        Configurar Cookies
                                    </h3>
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="text-slate-400 hover:text-slate-600"
                                    >
                                        <X className="h-5 w-5" />
                                    </button>
                                </div>

                                <div className="space-y-5">
                                    {/* Essential Cookies */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                                Cookies Essenciais
                                            </h4>
                                            <p className="text-slate-500 text-xs mt-1">
                                                Necessários para o funcionamento básico do site. Não podem ser desabilitados.
                                            </p>
                                        </div>
                                        <Switch checked={true} disabled className="opacity-50" />
                                    </div>

                                    {/* Analytics Cookies */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                                Cookies de Análise
                                            </h4>
                                            <p className="text-slate-500 text-xs mt-1">
                                                Nos ajudam a entender como você usa o site para melhorá-lo.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.analytics}
                                            onCheckedChange={(checked) =>
                                                setPreferences({ ...preferences, analytics: checked })
                                            }
                                        />
                                    </div>

                                    {/* Marketing Cookies */}
                                    <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800 rounded-xl">
                                        <div>
                                            <h4 className="font-semibold text-slate-900 dark:text-white text-sm">
                                                Cookies de Marketing
                                            </h4>
                                            <p className="text-slate-500 text-xs mt-1">
                                                Usados para exibir anúncios relevantes e medir campanhas.
                                            </p>
                                        </div>
                                        <Switch
                                            checked={preferences.marketing}
                                            onCheckedChange={(checked) =>
                                                setPreferences({ ...preferences, marketing: checked })
                                            }
                                        />
                                    </div>
                                </div>

                                <div className="flex gap-3 mt-6">
                                    <Button
                                        onClick={acceptSelected}
                                        className="flex-1 bg-violet-600 hover:bg-violet-700"
                                    >
                                        Salvar Preferências
                                    </Button>
                                    <Button
                                        onClick={acceptAll}
                                        variant="outline"
                                        className="flex-1"
                                    >
                                        Aceitar Todos
                                    </Button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </motion.div>
        </AnimatePresence>
    );
}
