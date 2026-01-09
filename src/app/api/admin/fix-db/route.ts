import { NextResponse } from 'next/server';
import { prisma } from '@/lib/db';
import { getSession } from '@/lib/auth';

export async function GET() {
    const session = await getSession();
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const commands = [
            `CREATE TABLE IF NOT EXISTS "PortfolioItem" ( "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "type" TEXT NOT NULL, "title" TEXT, "url" TEXT NOT NULL, "thumbnailUrl" TEXT, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "PortfolioItem_pkey" PRIMARY KEY ("id") );`,
            `CREATE TABLE IF NOT EXISTS "ClientLogo" ( "id" TEXT NOT NULL, "companyId" TEXT NOT NULL, "name" TEXT, "url" TEXT NOT NULL, "isActive" BOOLEAN NOT NULL DEFAULT true, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, "updatedAt" TIMESTAMP(3) NOT NULL, CONSTRAINT "ClientLogo_pkey" PRIMARY KEY ("id") );`,
            `CREATE TABLE IF NOT EXISTS "_ProposalPortfolio" ( "A" TEXT NOT NULL, "B" TEXT NOT NULL );`,
            `CREATE UNIQUE INDEX IF NOT EXISTS "_ProposalPortfolio_AB_unique" ON "_ProposalPortfolio"("A", "B");`,
            `CREATE INDEX IF NOT EXISTS "_ProposalPortfolio_B_index" ON "_ProposalPortfolio"("B");`,
            `DO $$ BEGIN ALTER TABLE "PortfolioItem" ADD CONSTRAINT "PortfolioItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN ALTER TABLE "ClientLogo" ADD CONSTRAINT "ClientLogo_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN ALTER TABLE "_ProposalPortfolio" ADD CONSTRAINT "_ProposalPortfolio_A_fkey" FOREIGN KEY ("A") REFERENCES "PortfolioItem"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `DO $$ BEGIN ALTER TABLE "_ProposalPortfolio" ADD CONSTRAINT "_ProposalPortfolio_B_fkey" FOREIGN KEY ("B") REFERENCES "Proposal"("id") ON DELETE CASCADE ON UPDATE CASCADE; EXCEPTION WHEN duplicate_object THEN null; END $$;`,
            `ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "includePortfolio" BOOLEAN NOT NULL DEFAULT false;`,
            `ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "includeClientLogos" BOOLEAN NOT NULL DEFAULT false;`,
            `ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "clientLogosGrayscale" BOOLEAN NOT NULL DEFAULT false;`,
            `ALTER TABLE "Proposal" ADD COLUMN IF NOT EXISTS "customColors" JSONB;`
        ];

        const results = [];
        for (const cmd of commands) {
            try {
                await prisma.$executeRawUnsafe(cmd);
                results.push({ cmd: cmd.substring(0, 50) + '...', status: 'success' });
            } catch (e: any) {
                results.push({ cmd: cmd.substring(0, 50) + '...', status: 'error', error: e.message });
            }
        }

        return NextResponse.json({ message: 'Database fix executed', results });

    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
