'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Company } from '@/lib/db';
import { saveCompany } from '@/app/actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from "sonner";
import { Loader2, Upload, X, Image as ImageIcon } from 'lucide-react';
import InputMask from 'react-input-mask';

interface CompanyFormProps {
    initialData: Company | null;
}

export function CompanyForm({ initialData }: CompanyFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState<Company>({
        name: initialData?.name || '',
        responsible: initialData?.responsible || '',
        email: initialData?.email || '',
        phone: initialData?.phone || '',
        logoUrl: initialData?.logoUrl || '',
        webhookUrl: initialData?.webhookUrl || '',
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(true);
        try {
            const formDataUpload = new FormData();
            formDataUpload.append('file', file);

            const response = await fetch('/api/upload', {
                method: 'POST',
                body: formDataUpload,
            });

            const result = await response.json();

            if (!response.ok) {
                throw new Error(result.error || 'Erro ao fazer upload');
            }

            setFormData((prev) => ({ ...prev, logoUrl: result.url }));
            toast.success('Logo enviada com sucesso!');
        } catch (error) {
            console.error('Upload error:', error);
            toast.error(error instanceof Error ? error.message : 'Erro ao enviar logo');
        } finally {
            setUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const removeLogo = () => {
        setFormData((prev) => ({ ...prev, logoUrl: '' }));
        toast.info('Logo removida');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            await saveCompany(formData);
            toast.success("Dados da empresa salvos com sucesso!");
            router.refresh();
            router.push('/');
        } catch (error) {
            toast.error("Erro ao salvar dados.");
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Dados da Empresa</CardTitle>
                <CardDescription>
                    Essas informações aparecerão no cabeçalho de todas as propostas enviadas.
                </CardDescription>
            </CardHeader>
            <CardContent>
                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Logo Upload Section */}
                    <div className="space-y-4">
                        <Label>Logo da Empresa</Label>

                        {/* Logo Preview */}
                        {formData.logoUrl ? (
                            <div className="relative inline-block">
                                <div className="relative w-40 h-40 border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-xl overflow-hidden bg-slate-50 dark:bg-slate-800 flex items-center justify-center">
                                    {/* eslint-disable-next-line @next/next/no-img-element */}
                                    <img
                                        src={formData.logoUrl}
                                        alt="Logo da empresa"
                                        className="max-w-full max-h-full object-contain p-2"
                                    />
                                </div>
                                <button
                                    type="button"
                                    onClick={removeLogo}
                                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors shadow-lg"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            </div>
                        ) : (
                            <div
                                onClick={() => fileInputRef.current?.click()}
                                className="w-40 h-40 border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-violet-500 dark:hover:border-violet-400 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all group"
                            >
                                <ImageIcon className="w-10 h-10 text-slate-400 group-hover:text-violet-500 mb-2" />
                                <span className="text-sm text-slate-500 group-hover:text-violet-500">
                                    Clique para enviar
                                </span>
                            </div>
                        )}

                        {/* File Input (Hidden) */}
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/png,image/jpeg,image/jpg,image/gif,image/webp,image/svg+xml"
                            onChange={handleFileUpload}
                            className="hidden"
                        />

                        {/* Upload Button */}
                        <div className="flex items-center gap-3">
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => fileInputRef.current?.click()}
                                disabled={uploading}
                            >
                                {uploading ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                ) : (
                                    <Upload className="w-4 h-4 mr-2" />
                                )}
                                {uploading ? 'Enviando...' : 'Fazer Upload'}
                            </Button>
                            <span className="text-xs text-muted-foreground">
                                PNG, JPEG, GIF, WebP ou SVG. Máx 5MB.
                            </span>
                        </div>

                        {/* URL Input (Alternative) */}
                        <div className="pt-2">
                            <Label htmlFor="logoUrl" className="text-sm text-muted-foreground">
                                Ou insira uma URL externa
                            </Label>
                            <Input
                                id="logoUrl"
                                name="logoUrl"
                                placeholder="https://sua-empresa.com/logo.png"
                                value={formData.logoUrl || ''}
                                onChange={handleChange}
                                className="mt-1"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="name">Nome da Empresa</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="Ex: Acme Corp"
                            value={formData.name}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="responsible">Nome do Responsável</Label>
                        <Input
                            id="responsible"
                            name="responsible"
                            placeholder="Ex: João da Silva"
                            value={formData.responsible || ''}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="email">Email de Contato</Label>
                            <Input
                                id="email"
                                name="email"
                                type="email"
                                placeholder="contato@empresa.com"
                                value={formData.email || ''}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="space-y-2">
                            <Label htmlFor="phone">Celular / WhatsApp</Label>
                            <InputMask
                                mask="(99) 99999-9999"
                                value={formData.phone || ''}
                                onChange={handleChange}
                            >
                                {(inputProps: any) => (
                                    <Input
                                        {...inputProps}
                                        id="phone"
                                        name="phone"
                                        placeholder="(11) 99999-9999"
                                        required
                                    />
                                )}
                            </InputMask>
                        </div>
                    </div>

                    <div className="space-y-2 pt-4 border-t">
                        <Label htmlFor="webhookUrl">Webhook de Integração (n8n, Zapier, etc)</Label>
                        <Input
                            id="webhookUrl"
                            name="webhookUrl"
                            placeholder="https://seu-n8n.com/webhook/..."
                            value={formData.webhookUrl || ''}
                            onChange={handleChange}
                        />
                        <p className="text-xs text-muted-foreground">
                            Enviaremos um POST com os dados da proposta sempre que ela for Criada, Aceita, Recusada ou Negociada.
                        </p>
                    </div>

                    <div className="flex justify-end pt-4">
                        <Button type="submit" disabled={loading || uploading}>
                            {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                            Salvar Alterações
                        </Button>
                    </div>
                </form>
            </CardContent>
        </Card>
    );
}
