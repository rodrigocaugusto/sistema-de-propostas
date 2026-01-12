'use client';

import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { formatCpfCnpj, validateCpfCnpj, cleanCpfCnpj } from '@/lib/cpf-cnpj';
import { cn } from '@/lib/utils';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface CpfCnpjInputProps {
    value: string;
    onChange: (value: string) => void;
    className?: string;
    placeholder?: string;
    showValidation?: boolean;
    required?: boolean;
}

export function CpfCnpjInput({
    value,
    onChange,
    className,
    placeholder = "000.000.000-00 ou 00.000.000/0000-00",
    showValidation = true,
    required = false
}: CpfCnpjInputProps) {
    const [displayValue, setDisplayValue] = useState('');
    const [validation, setValidation] = useState<{ valid: boolean; type: 'cpf' | 'cnpj' | null; message: string }>({ valid: true, type: null, message: '' });
    const [touched, setTouched] = useState(false);

    // Sync display value with external value
    useEffect(() => {
        if (value) {
            setDisplayValue(formatCpfCnpj(value));
        } else {
            setDisplayValue('');
        }
    }, [value]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const inputValue = e.target.value;
        const cleaned = cleanCpfCnpj(inputValue);

        // Limita a 14 dígitos (CNPJ)
        if (cleaned.length > 14) return;

        const formatted = formatCpfCnpj(cleaned);
        setDisplayValue(formatted);
        onChange(cleaned); // Envia valor limpo para o pai

        // Valida quando tem dígitos suficientes
        if (cleaned.length >= 11 || cleaned.length === 0) {
            setValidation(validateCpfCnpj(cleaned));
        }
    };

    const handleBlur = () => {
        setTouched(true);
        const cleaned = cleanCpfCnpj(displayValue);
        setValidation(validateCpfCnpj(cleaned));
    };

    const showError = touched && !validation.valid && validation.message;
    const showSuccess = touched && validation.valid && validation.type;

    return (
        <div className="space-y-1">
            <div className="relative">
                <Input
                    type="text"
                    inputMode="numeric"
                    value={displayValue}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder={placeholder}
                    className={cn(
                        "h-11 bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 pr-10",
                        showError && "border-red-500 focus-visible:ring-red-500",
                        showSuccess && "border-green-500 focus-visible:ring-green-500",
                        className
                    )}
                />
                {showValidation && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {showSuccess && (
                            <CheckCircle2 className="h-4 w-4 text-green-500" />
                        )}
                        {showError && (
                            <AlertCircle className="h-4 w-4 text-red-500" />
                        )}
                    </div>
                )}
            </div>
            {showError && (
                <p className="text-xs text-red-500 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" />
                    {validation.message}
                </p>
            )}
            {showSuccess && (
                <p className="text-[10px] text-green-600 flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3" />
                    {validation.type === 'cpf' ? 'CPF válido' : 'CNPJ válido'}
                </p>
            )}
        </div>
    );
}
