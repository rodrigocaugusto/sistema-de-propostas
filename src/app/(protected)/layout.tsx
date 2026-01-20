import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import React from "react";

export default async function ProtectedLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const session = await getSession();

    if (!session) {
        redirect('/login');
    }

    // Check company status specifically for suspended state
    if (session.companyId) {
        const company = await prisma.company.findUnique({
            where: { id: session.companyId },
            select: { status: true }
        });

        if (company?.status === 'suspended') {
            const errorParam = encodeURIComponent('Sua conta está suspensa. Renove sua assinatura para continuar.');
            redirect(`/billing?error=${errorParam}`);
        }
    }

    return <>{children}</>;
}
