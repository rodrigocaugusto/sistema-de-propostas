import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrialBanner } from '@/components/trial-banner';
import { PLANS } from '@/lib/plans';

export async function TrialBannerWrapper() {
    const session = await getSession();

    if (!session?.companyId) {
        return null;
    }

    const company = await prisma.company.findUnique({
        where: { id: session.companyId },
        select: {
            plan: true,
            trialEndsAt: true
        }
    });

    if (!company || company.plan !== 'trial') {
        return null;
    }

    // Get proposal count for trial
    const proposalCount = await prisma.proposal.count({
        where: { companyId: session.companyId }
    });

    // Get trial plan limits
    const trialPlan = PLANS.trial;
    const proposalLimit = trialPlan.limits.proposals;

    return (
        <TrialBanner
            plan={company.plan}
            trialEndsAt={company.trialEndsAt?.toISOString() || null}
            proposalCount={proposalCount}
            proposalLimit={proposalLimit}
        />
    );
}
