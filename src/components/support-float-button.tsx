'use client';

import { usePathname } from 'next/navigation';
import { MessageCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export function SupportFloatButton() {
    const pathname = usePathname();

    // Do not show on public proposal pages, login, or checkout public pages
    if (
        pathname.startsWith('/p/') ||
        pathname === '/login' ||
        pathname === '/register' ||
        pathname.startsWith('/checkout') && !pathname.includes('success') // Maybe show on success?
    ) {
        return null;
    }

    const whatsappLink = `https://wa.me/558120113526?text=${encodeURIComponent('Suporte sistema de propostas')}`;

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <a
                        href={whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className={cn(
                            "fixed bottom-6 right-6 z-50",
                            "transition-all duration-300 hover:scale-110",
                            "shadow-lg hover:shadow-xl"
                        )}
                    >
                        <div className="bg-[#25D366] hover:bg-[#128C7E] text-white p-3 rounded-full flex items-center justify-center transition-colors">
                            <MessageCircle className="h-6 w-6 fill-current" />
                            <span className="sr-only">Suporte via WhatsApp</span>
                        </div>
                    </a>
                </TooltipTrigger>
                <TooltipContent side="left">
                    <p>Precisa de ajuda? Fale conosco!</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
