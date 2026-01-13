import { getSession } from '@/lib/auth';
import { prisma } from '@/lib/db';
import { TrialBanner } from '@/components/trial-banner';

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

    return (
        <TrialBanner
            plan={company.plan}
            trialEndsAt={company.trialEndsAt?.toISOString() || null}
        />
    );
}
