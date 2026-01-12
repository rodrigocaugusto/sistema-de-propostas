/**
 * Utilitários para validação e formatação de CPF/CNPJ
 * Seguindo legislação brasileira
 */

// Remove caracteres não numéricos
export function cleanCpfCnpj(value: string): string {
    return value.replace(/\D/g, '');
}

// Formata CPF: 000.000.000-00
export function formatCPF(value: string): string {
    const cleaned = cleanCpfCnpj(value);
    return cleaned
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2');
}

// Formata CNPJ: 00.000.000/0000-00
export function formatCNPJ(value: string): string {
    const cleaned = cleanCpfCnpj(value);
    return cleaned
        .slice(0, 14)
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2');
}

// Formata automaticamente baseado no tamanho
export function formatCpfCnpj(value: string): string {
    const cleaned = cleanCpfCnpj(value);
    if (cleaned.length <= 11) {
        return formatCPF(cleaned);
    }
    return formatCNPJ(cleaned);
}

// Valida CPF (algoritmo oficial)
export function validateCPF(cpf: string): boolean {
    const cleaned = cleanCpfCnpj(cpf);

    if (cleaned.length !== 11) return false;

    // Rejeita CPFs com todos os dígitos iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 9; i++) {
        sum += parseInt(cleaned.charAt(i)) * (10 - i);
    }
    let remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(9))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 10; i++) {
        sum += parseInt(cleaned.charAt(i)) * (11 - i);
    }
    remainder = (sum * 10) % 11;
    if (remainder === 10 || remainder === 11) remainder = 0;
    if (remainder !== parseInt(cleaned.charAt(10))) return false;

    return true;
}

// Valida CNPJ (algoritmo oficial)
export function validateCNPJ(cnpj: string): boolean {
    const cleaned = cleanCpfCnpj(cnpj);

    if (cleaned.length !== 14) return false;

    // Rejeita CNPJs com todos os dígitos iguais
    if (/^(\d)\1+$/.test(cleaned)) return false;

    // Multiplicadores para validação
    const multipliers1 = [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];
    const multipliers2 = [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2];

    // Validação do primeiro dígito verificador
    let sum = 0;
    for (let i = 0; i < 12; i++) {
        sum += parseInt(cleaned.charAt(i)) * multipliers1[i];
    }
    let remainder = sum % 11;
    const digit1 = remainder < 2 ? 0 : 11 - remainder;
    if (digit1 !== parseInt(cleaned.charAt(12))) return false;

    // Validação do segundo dígito verificador
    sum = 0;
    for (let i = 0; i < 13; i++) {
        sum += parseInt(cleaned.charAt(i)) * multipliers2[i];
    }
    remainder = sum % 11;
    const digit2 = remainder < 2 ? 0 : 11 - remainder;
    if (digit2 !== parseInt(cleaned.charAt(13))) return false;

    return true;
}

// Valida CPF ou CNPJ automaticamente
export function validateCpfCnpj(value: string): { valid: boolean; type: 'cpf' | 'cnpj' | null; message: string } {
    const cleaned = cleanCpfCnpj(value);

    if (!cleaned) {
        return { valid: true, type: null, message: '' }; // Campo vazio é válido (opcional)
    }

    if (cleaned.length <= 11) {
        if (cleaned.length < 11) {
            return { valid: false, type: 'cpf', message: 'CPF incompleto' };
        }
        if (validateCPF(cleaned)) {
            return { valid: true, type: 'cpf', message: '' };
        }
        return { valid: false, type: 'cpf', message: 'CPF inválido' };
    }

    if (cleaned.length < 14) {
        return { valid: false, type: 'cnpj', message: 'CNPJ incompleto' };
    }

    if (validateCNPJ(cleaned)) {
        return { valid: true, type: 'cnpj', message: '' };
    }
    return { valid: false, type: 'cnpj', message: 'CNPJ inválido' };
}
