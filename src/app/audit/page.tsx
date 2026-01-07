
import { getAuditProposals, getCompanyUsers } from "./actions";
import { AuditView } from "@/components/audit-view";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";

export const metadata = {
    title: 'Auditoria de Propostas',
}

export default async function AuditPage() {
    const session = await getSession();
    // Proteção de rota
    if (session?.role !== 'admin') {
        redirect('/dashboard');
    }

    try {
        const proposals = await getAuditProposals();
        const users = await getCompanyUsers();

        return (
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950 p-6">
                <div className="max-w-7xl mx-auto space-y-8">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">Auditoria de Propostas</h1>
                        <p className="text-muted-foreground">Rastreie emissões, descontos e performance por vendedor.</p>
                    </div>

                    <AuditView data={proposals} users={users} />
                </div>
            </div>
        );
    } catch (error) {
        return (
            <div className="p-8 text-center text-red-500">
                Erro ao carregar auditoria. Você tem permissão para acessar esta página?
            </div>
        );
    }
}
