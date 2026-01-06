# Plano de Migração: Single-Tenant para Multi-Tenant (SaaS)

Este documento descreve as etapas necessárias para transformar o sistema atual de propostas em uma plataforma SaaS Multi-Tenant, onde múltiplas empresas podem usar o sistema de forma isolada, enquanto o Super Admin possui visão global.

## 1. Visão Geral da Arquitetura

A estratégia adotada será **Multi-Tenancy por Coluna (Isolamento Lógico)**. Todas as empresas compartilharão o mesmo banco de dados e tabelas, mas cada registro terá uma coluna `companyId` (Foreign Key) que identifica a qual empresa ele pertence. A aplicação será responsável por garantir que um usuário logado acesse apenas dados da sua `companyId`.

**Perfis de Usuário:**
1.  **Super Admin (Você)**: Possui acesso a todas as empresas, pode gerenciar planos, suspender contas e visualizar métricas globais.
2.  **Tenant Admin (Cliente)**: Dono da conta da empresa contratante. Pode gerenciar seus próprios dados (Propostas, Clientes, Produtos) e configurações da sua empresa.
3.  **Tenant Member (Futuro)**: Usuário convidado pelo Tenant Admin, com acesso restrito dentro da empresa.

---

## 2. Alterações no Banco de Dados (Prisma Schema)

### A. Tabela `Company`
Atualmente usada para configurações da *sua* empresa. Será promovida a entidade central do Tenant.
-   Adicionar:
    -   `slug` (String @unique): Identificador único para URLs (ex: app.sistema.com/minha-empresa).
    -   `status` (String): "active", "suspended", "canceled".
    -   `plan` (String): "free", "pro", "enterprise".
    -   `ownerId` (String): Link para o User que criou/donos.

### B. Tabela `User`
Precisa ser vinculada a uma Company.
-   Adicionar:
    -   `companyId` (String?): FK para Company.
    -   `isSuperAdmin` (Boolean @default(false)): Flag para identificar você.
    -   `role` (String @default("admin")): Role dentro da empresa (admin, member).

### C. Tabelas de Recursos (Data Isolation)
Todas as tabelas que representam dados do cliente precisam da coluna `companyId`:
-   `Client`
-   `Proposal`
-   `Product`
-   `ProductItem` (Indireto via Proposal, mas útil manter integridade) -> *Na verdade, `ProductItem` é filho de `Proposal`, então o isolamento já ocorre via Proposal. Não é estritamente necessário ter `companyId` aqui se o acesso for sempre via Proposal.*
-   `PaymentMethod` (Cada empresa tem seus métodos)
-   `ProposalNote` (Templates de notas)
-   `PaymentTermsTemplate` (Templates de termos)

**Nota:** Tabelas de configuração "Globais" do sistema (se houver no futuro) não levam `companyId`.

---

## 3. Fluxo de Autenticação e Sessão

1.  **Login**:
    -   Ao logar, o sistema busca o `User`.
    -   Se `isSuperAdmin` for `true`, carrega permissões globais.
    -   Se não, carrega o `companyId` do usuário.
2.  **Sessão (JWT/Cookie)**:
    -   Incluir `companyId`, `isSuperAdmin` e `role` no payload do token.
    -   Isso evita queries extras em cada request para descobrir a empresa.
3.  **Middleware / Data Access Layer**:
    -   Todas as chamadas ao banco (`db.ts`) devem receber o contexto do usuário.
    -   **Regra de Ouro**: `where: { companyId: session.companyId }` deve ser aplicado em TODAS as queries de Tenants.

---

## 4. Estratégia de Migração de Dados (Script)

Como já existem dados no banco, precisamos de um script de migração para não perdê-los.

1.  Criar uma `Company` "Padrão" / "Primeira Empresa" (para seus dados atuais).
2.  Atualizar o seu `User` para ser `isSuperAdmin = true` e associá-lo a essa Company.
3.  Atualizar todos os registros existentes (`Client`, `Proposal`, `Product`, etc.) definindo o `companyId` para o ID dessa nova Company Padrão.

---

## 5. Etapas de Implementação

### Passo 1: Atualização do Schema (Prisma)
-   Modificar `schema.prisma`.
-   Rodar `prisma db push` (ou migrate).
-   Se houver dados, o Prisma pode reclamar de campos obrigatórios novos (`companyId`). Precisaremos limpar o banco ou fazer um script SQL manual antes se for produção. *Assumindo ambiente local dev, podemos resetar ou migrar.*

### Passo 2: Script de Seed/Migração
-   Criar script para garantir que exista pelo menos uma empresa e um Super Admin.

### Passo 3: Refatoração da Camada de Autenticação (`auth.ts`)
-   Atualizar geração e validação de Token para incluir novos campos.

### Passo 4: Refatoração da Camada de Banco de Dados (`db.ts`)
-   Essa é a parte mais trabalhosa.
-   Reescrever funções como `getClients`, `createProposal`, etc. para aceitar `companyId` como argumento (vindo da sessão).
-   Exemplo:
    ```typescript
    export async function getClients(companyId: string) {
      return prisma.client.findMany({ where: { companyId } });
    }
    ```

### Passo 5: Novas Telas
-   **Registro (Sign Up)**: Nova tela pública onde uma pessoa coloca "Nome da Empresa", "Email", "Senha". Cria `User` + `Company`.
-   **Admin Dashboard**: Tela exclusiva para `isSuperAdmin` ver lista de Companies.

---

## 6. Próximos Passos Imediatos

Deseja que eu comece pela atualização do `schema.prisma`?
ISSO PODE QUEBRAR A APLICAÇÃO ATUAL TEMPORARIAMENTE ATÉ QUE O BACKEND SEJA REFATORADO.
