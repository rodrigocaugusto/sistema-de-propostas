'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogFooter,
    DialogDescription
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { saveClient } from '@/app/actions';
import { toast } from 'sonner';
import { Loader2, Plus } from 'lucide-react';
import { useMask } from '@react-input/mask';

export function NewClientDialog() {
    const [open, setOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        company: '',
        phone: ''
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name || !formData.email) {
            toast.error('Nome e Email são obrigatórios');
            return;
        }

        setLoading(true);
        try {
            await saveClient({
                name: formData.name,
                email: formData.email,
                company: formData.company || null,
                phone: formData.phone || null
            });
            toast.success('Cliente criado com sucesso!');
            setOpen(false);
            setFormData({ name: '', email: '', company: '', phone: '' });
        } catch (error) {
            console.error(error);
            toast.error('Erro ao criar cliente. Verifique se o email já existe.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 shadow-lg shadow-cyan-500/25">
                    <Plus className="mr-2 h-4 w-4" />
                    Novo Cliente
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>Novo Cliente</DialogTitle>
                    <DialogDescription>
                        Preencha os dados abaixo para cadastrar um novo cliente.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label htmlFor="name">Nome completo *</Label>
                        <Input
                            id="name"
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            placeholder="Ex: João Silva"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company">Empresa</Label>
                        <Input
                            id="company"
                            value={formData.company}
                            onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                            placeholder="Ex: Acme Inc."
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="email">Email *</Label>
                        <Input
                            id="email"
                            type="email"
                            value={formData.email}
                            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            placeholder="joao@exemplo.com"
                            required
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="phone">Telefone / WhatsApp</Label>
                        <Input
                            ref={useMask({ mask: '(__) _____-____', replacement: { _: /\d/ } })}
                            id="phone"
                            value={formData.phone}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, phone: e.target.value })}
                            placeholder="(11) 99999-9999"
                        />
                    </div>
                    <DialogFooter className="pt-4">
                        <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={loading} className="bg-gradient-to-r from-cyan-500 to-blue-600">
                            {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                            Salvar Cliente
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
