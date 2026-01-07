'use client';

import { useRouter, useSearchParams } from "next/navigation";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CalendarIcon } from "lucide-react";

export function DateRangeFilter() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const currentPeriod = searchParams.get('period') || 'all';

    const handleValueChange = (value: string) => {
        const params = new URLSearchParams(searchParams);
        if (value === 'all') {
            params.delete('period');
        } else {
            params.set('period', value);
        }
        router.push(`/?${params.toString()}`);
    };

    return (
        <div className="flex items-center gap-2">
            <Select value={currentPeriod} onValueChange={handleValueChange}>
                <SelectTrigger className="w-[180px] bg-white dark:bg-slate-900">
                    <CalendarIcon className="mr-2 h-4 w-4 text-slate-500" />
                    <SelectValue placeholder="Período" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="all">Todo o período</SelectItem>
                    <SelectItem value="today">Hoje</SelectItem>
                    <SelectItem value="week">Esta semana</SelectItem>
                    <SelectItem value="7days">Últimos 7 dias</SelectItem>
                    <SelectItem value="month">Este mês</SelectItem>
                </SelectContent>
            </Select>
        </div>
    );
}
