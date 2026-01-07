export const PLANS = {
    trial: {
        id: 'trial',
        name: 'Trial (7 dias)',
        description: 'Teste grátis com funcionalidades limitadas',
        limits: {
            proposals: 3, // Total lifetime limit for trial
            users: 1 // Only 1 user allowed
        },
        durationDays: 7,
        prices: {
            monthly: 0,
            annual: 0
        }
    },
    basic: {
        id: 'basic',
        name: 'Básico',
        description: 'Ideal para quem está começando',
        limits: {
            proposals: 15, // Per month
            users: 1 // 1 user included
        },
        prices: {
            monthly: 39.90,
            annual: 29.90, // Per month value if billed annually
            extraUser: 15.00
        }
    },
    pro: {
        id: 'pro',
        name: 'Profissional',
        description: 'Para agências e autônomos estabelecidos',
        limits: {
            proposals: 100, // Per month
            users: 3 // 3 users included
        },
        prices: {
            monthly: 89.90,
            annual: 69.90,
            extraUser: 15.00
        }
    },
    enterprise: {
        id: 'enterprise',
        name: 'Enterprise',
        description: 'Alto volume e máxima performance',
        limits: {
            proposals: 500, // Per month
            users: 10 // 10 users included
        },
        prices: {
            monthly: 169.00,
            annual: 149.90,
            extraUser: 15.00
        }
    }
} as const;

export type PlanId = keyof typeof PLANS;

export function getPlanLimit(planId: string) {
    const plan = PLANS[planId as PlanId];
    return plan?.limits.proposals || 0;
}

export function getPlanUserLimit(planId: string) {
    const plan = PLANS[planId as PlanId];
    return plan?.limits.users || 1;
}

export function getPlanName(planId: string) {
    const plan = PLANS[planId as PlanId];
    return plan?.name || planId;
}
