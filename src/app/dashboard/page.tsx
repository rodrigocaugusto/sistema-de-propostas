
import Link from "next/link";
import { redirect } from "next/navigation";
import { fetchCompany, fetchProposals, logoutAction } from "@/app/actions";
import { getSession } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Settings, FileText, CheckCircle, XCircle, Clock, Package, TrendingUp, TrendingDown, DollarSign, BarChart3, ArrowUpRight, Sparkles, Users, Pencil, User, LogOut, Shield, ClipboardList } from "lucide-react";
import { ThemeToggle } from "@/components/theme-toggle";
import { ProposalListView } from "@/components/proposal-list-view";

export default async function Dashboard() {
  const session = await getSession();

  if (!session) {
    redirect('/login');
  }

  const company = await fetchCompany();
  const proposals = await fetchProposals();

  // Calculate stats
  const acceptedProposals = proposals.filter(p => p.status === 'accepted');
  const rejectedProposals = proposals.filter(p => p.status === 'rejected');
  const pendingProposals = proposals.filter(p => ['draft', 'sent', 'viewed', 'negotiating'].includes(p.status));

  // Helper to sum values
  const sumValues = (list: typeof proposals) => ({
    oneTime: list.reduce((sum, p) => sum + p.totalOneTime, 0),
    recurring: list.reduce((sum, p) => sum + p.totalRecurring, 0)
  });

  const total = sumValues(proposals);
  const accepted = sumValues(acceptedProposals);
  const pending = sumValues(pendingProposals);

  const conversionRate = proposals.length > 0
    ? Math.round((acceptedProposals.length / proposals.length) * 100)
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/80 dark:bg-slate-900/80 border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <img
                src="/system-logo.png"
                alt="Sistema de Propostas"
                className="h-10 w-auto object-contain dark:invert"
              />
            </div>
            <div className="flex gap-3 items-center">
              <Link href="/profile">
                <Button variant="ghost" size="icon" className="text-slate-600 dark:text-slate-400">
                  <User className="h-4 w-4" />
                </Button>
              </Link>
              <ThemeToggle />
              {session?.role === 'admin' && (
                <Link href="/audit">
                  <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                    <ClipboardList className="mr-2 h-4 w-4" />
                    Auditoria
                  </Button>
                </Link>
              )}
              {session?.isSuperAdmin && (
                <Link href="/admin">
                  <Button variant="ghost" size="sm" className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-700 hover:bg-indigo-50 dark:hover:bg-indigo-950/20">
                    <Shield className="mr-2 h-4 w-4" />
                    Super Admin
                  </Button>
                </Link>
              )}
              <Link href="/clients">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                  <Users className="mr-2 h-4 w-4" />
                  Clientes
                </Button>
              </Link>
              <Link href="/products">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                  <Package className="mr-2 h-4 w-4" />
                  Produtos
                </Button>
              </Link>
              <Link href="/settings">
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400">
                  <Settings className="mr-2 h-4 w-4" />
                  Configurações
                </Button>
              </Link>
              <form action={logoutAction}>
                <Button variant="ghost" size="sm" className="text-slate-600 dark:text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20">
                  <LogOut className="mr-2 h-4 w-4" />
                  Sair
                </Button>
              </form>
              <Link href="/proposals/new">
                <Button size="sm" className="bg-gradient-to-r from-violet-500 to-indigo-600 hover:from-violet-600 hover:to-indigo-700 shadow-lg shadow-violet-500/25">
                  <Plus className="mr-2 h-4 w-4" />
                  Nova Proposta
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8 space-y-8">
        {/* Company Setup Warning */}
        {!company && (
          <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 p-6 text-white shadow-xl shadow-orange-500/25">
            <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32 blur-3xl" />
            <div className="relative z-10">
              <h3 className="text-lg font-bold mb-1">⚙️ Configuração Pendente</h3>
              <p className="text-amber-100 mb-4">Configure os dados da sua empresa para começar a enviar propostas profissionais.</p>
              <Link href="/settings">
                <Button size="sm" variant="secondary" className="bg-white text-orange-600 hover:bg-amber-50">
                  Configurar Agora
                </Button>
              </Link>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {/* Total Value Card - #029DAF Teal */}
          <Card className="border-l-4 border-l-[#029DAF] bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Valor Total</CardTitle>
                <div className="p-2 rounded-lg bg-[#029DAF]/10 dark:bg-[#029DAF]/20">
                  <DollarSign className="h-4 w-4 text-[#029DAF]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col gap-1">
                {total.oneTime > 0 && (
                  <div className="text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
                    R$ {total.oneTime.toLocaleString('pt-BR')}
                    <span className="text-xs font-normal text-slate-500 ml-1">único</span>
                  </div>
                )}
                {total.recurring > 0 && (
                  <div className="text-xl font-bold tracking-tight text-[#029DAF]">
                    + R$ {total.recurring.toLocaleString('pt-BR')}
                    <span className="text-xs font-normal text-slate-500 ml-1">/mês</span>
                  </div>
                )}
                {total.oneTime === 0 && total.recurring === 0 && (
                  <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
                    R$ 0,00
                  </div>
                )}
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-2 flex items-center gap-1">
                <FileText className="h-3 w-3" />
                {proposals.length} propostas no total
              </p>
            </CardContent>
          </Card>

          {/* Accepted Card - #FFC219 Golden */}
          <Card className="border-l-4 border-l-[#FFC219] bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Propostas Aceitas</CardTitle>
                <div className="p-2 rounded-lg bg-[#FFC219]/10 dark:bg-[#FFC219]/20">
                  <CheckCircle className="h-4 w-4 text-[#FFC219]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{acceptedProposals.length}</div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-1 text-xs text-[#F07C19] font-medium">
                  <TrendingUp className="h-3 w-3" />
                  Fechados:
                </div>
                {accepted.oneTime > 0 && (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    R$ {accepted.oneTime.toLocaleString('pt-BR')} (Único)
                  </div>
                )}
                {accepted.recurring > 0 && (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    + R$ {accepted.recurring.toLocaleString('pt-BR')} /mês
                  </div>
                )}
                {accepted.oneTime === 0 && accepted.recurring === 0 && (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">R$ 0,00</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Pending Card - #F07C19 Orange */}
          <Card className="border-l-4 border-l-[#F07C19] bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Em Negociação</CardTitle>
                <div className="p-2 rounded-lg bg-[#F07C19]/10 dark:bg-[#F07C19]/20">
                  <Clock className="h-4 w-4 text-[#F07C19]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{pendingProposals.length}</div>
              <div className="flex flex-col gap-1 mt-2">
                <div className="flex items-center gap-1 text-xs text-[#F07C19] font-medium">
                  <DollarSign className="h-3 w-3" />
                  Pipeline:
                </div>
                {pending.oneTime > 0 && (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    R$ {pending.oneTime.toLocaleString('pt-BR')} (Único)
                  </div>
                )}
                {pending.recurring > 0 && (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">
                    + R$ {pending.recurring.toLocaleString('pt-BR')} /mês
                  </div>
                )}
                {pending.oneTime === 0 && pending.recurring === 0 && (
                  <div className="text-sm font-semibold text-slate-700 dark:text-slate-300">R$ 0,00</div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Rejected / Conversion Card - #E32551 Red */}
          <Card className="border-l-4 border-l-[#E32551] bg-white dark:bg-slate-900 shadow-lg">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-medium text-slate-600 dark:text-slate-400">Taxa de Conversão</CardTitle>
                <div className="p-2 rounded-lg bg-[#E32551]/10 dark:bg-[#E32551]/20">
                  <BarChart3 className="h-4 w-4 text-[#E32551]" />
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold tracking-tight text-slate-900 dark:text-white">{conversionRate}%</div>
              <div className="flex items-center gap-2 mt-2 text-xs text-[#E32551]">
                <span className="flex items-center gap-1">
                  <XCircle className="h-3 w-3" />
                  {rejectedProposals.length} recusadas
                </span>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Proposals List Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-slate-900 dark:text-white">Propostas Recentes</h2>
              <p className="text-sm text-slate-500 dark:text-slate-400">Acompanhe o status das suas negociações</p>
            </div>
            <Link href="/proposals/new">
              <Button variant="outline" size="sm">
                <Plus className="mr-2 h-4 w-4" />
                Nova Proposta
              </Button>
            </Link>
          </div>

          <ProposalListView initialProposals={proposals} />
        </div>
      </main>
    </div>
  );
}
