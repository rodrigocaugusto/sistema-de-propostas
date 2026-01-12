
const ASAAS_API_URL = "https://www.asaas.com/api/v3";
// Se quiser suportar sandbox via config, poderia ser dinâmico, mas vamos de produção default
// O usuário pode usar a URL de sandbox se tiver uma env específica, mas tenant-based é complexo.
// Vamos assumir Produção.

interface AsaasCustomerData {
    name: string;
    email: string;
    cpfCnpj?: string;
    phone?: string;
    mobilePhone?: string;
    externalReference?: string;
    notificationDisabled?: boolean;
}

interface AsaasPaymentData {
    customer: string;
    billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
    value: number;
    dueDate: string;
    description?: string;
    externalReference?: string;
    postalService?: boolean; // Correios
}

export async function createOrUpdateAsaasCustomer(apiKey: string, data: AsaasCustomerData) {
    // 1. Tentar buscar cliente existente pelo email ou CPF
    // Prioridade CPF/CNPJ, depois Email
    let existingId = null;

    const headers = {
        'Content-Type': 'application/json',
        'access_token': apiKey
    };

    if (data.cpfCnpj) {
        const searchRes = await fetch(`${ASAAS_API_URL}/customers?cpfCnpj=${data.cpfCnpj}`, { headers });
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
            existingId = searchData.data[0].id;
        }
    }

    if (!existingId && data.email) {
        const searchRes = await fetch(`${ASAAS_API_URL}/customers?email=${data.email}`, { headers });
        const searchData = await searchRes.json();
        if (searchData.data && searchData.data.length > 0) {
            existingId = searchData.data[0].id;
        }
    }

    if (existingId) {
        // Atualizar dados se necessário (opcional, mas bom manter sync)
        const updateRes = await fetch(`${ASAAS_API_URL}/customers/${existingId}`, {
            method: 'POST', // Asaas update é POST em /customers/{id} ou PUT? Confimar doc. Geralmente POST no Asaas V3 funciona pra update ou PUT. V3 Doc diz PUT /customers/{id} mas POST tbm aceita em alguns endpoints. Vou de POST que é safe no update.
            // Correção: Doc oficial diz POST /customers/{id} altera dados. 
            headers,
            body: JSON.stringify({
                name: data.name,
                phone: data.phone,
                mobilePhone: data.mobilePhone
            })
        });

        if (!updateRes.ok) {
            console.warn("Falha ao atualizar cliente Asaas", await updateRes.text());
        }

        return existingId;
    }

    // 2. Criar novo
    const createRes = await fetch(`${ASAAS_API_URL}/customers`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const createData = await createRes.json();
    if (!createRes.ok) {
        throw new Error(`Erro Asaas (Criar Cliente): ${createData.errors?.[0]?.description || JSON.stringify(createData)}`);
    }

    return createData.id;
}

export async function createAsaasPayment(apiKey: string, data: AsaasPaymentData) {
    const headers = {
        'Content-Type': 'application/json',
        'access_token': apiKey
    };

    const res = await fetch(`${ASAAS_API_URL}/payments`, {
        method: 'POST',
        headers,
        body: JSON.stringify(data)
    });

    const body = await res.json();
    if (!res.ok) {
        throw new Error(`Erro Asaas (Criar Cobrança): ${body.errors?.[0]?.description || JSON.stringify(body)}`);
    }

    return {
        id: body.id,
        invoiceUrl: body.invoiceUrl, // Link pagável
        bankSlipUrl: body.bankSlipUrl,
        status: body.status // "PENDING", etc
    };
}

interface AsaasSubscriptionData {
    customer: string;
    billingType: "BOLETO" | "CREDIT_CARD" | "PIX" | "UNDEFINED";
    value: number;
    nextDueDate: string; // YYYY-MM-DD
    cycle: "WEEKLY" | "BIWEEKLY" | "MONTHLY" | "BIMONTHLY" | "QUARTERLY" | "SEMIANNUALLY" | "YEARLY";
    description?: string;
    externalReference?: string;
    maxPayments?: number; // null = indefinido
}

export async function createAsaasSubscription(apiKey: string, data: AsaasSubscriptionData) {
    const headers = {
        'Content-Type': 'application/json',
        'access_token': apiKey
    };

    const res = await fetch(`${ASAAS_API_URL}/subscriptions`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
            customer: data.customer,
            billingType: data.billingType,
            value: data.value,
            nextDueDate: data.nextDueDate,
            cycle: data.cycle,
            description: data.description,
            externalReference: data.externalReference,
            ...(data.maxPayments ? { maxPayments: data.maxPayments } : {})
        })
    });

    const body = await res.json();
    if (!res.ok) {
        throw new Error(`Erro Asaas (Criar Assinatura): ${body.errors?.[0]?.description || JSON.stringify(body)}`);
    }

    return {
        id: body.id,
        status: body.status,
        nextDueDate: body.nextDueDate
    };
}
