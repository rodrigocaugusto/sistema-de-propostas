import { headers } from 'next/headers';
import { NextResponse } from 'next/server';
import { getStripe } from '@/lib/stripe';
import { prisma } from '@/lib/db';
import { sendEmail, sendAdminNotification } from '@/lib/email';
import Stripe from 'stripe';
import bcrypt from 'bcryptjs';

// Generate a random password
function generatePassword(length = 12): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%';
    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return password;
}

// Send welcome email with credentials
async function sendWelcomeEmail(to: string, data: {
    name: string;
    email: string;
    password: string;
    planName: string;
    loginUrl: string;
}) {
    const html = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bem-vindo ao DL Pro!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); padding: 50px 40px; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 15px;">🚀</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                                Bem-vindo ao DL Pro!
                            </h1>
                            <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                                Sua conta foi criada com sucesso
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Welcome Message -->
                    <tr>
                        <td style="padding: 40px;">
                            <p style="margin: 0 0 20px; color: #18181b; font-size: 18px; line-height: 1.6;">
                                Olá <strong>${data.name}</strong>!
                            </p>
                            <p style="margin: 0 0 30px; color: #52525b; font-size: 16px; line-height: 1.7;">
                                Obrigado por assinar o plano <strong>${data.planName}</strong>. 
                                Estamos muito felizes em ter você conosco! Abaixo estão suas credenciais de acesso:
                            </p>
                            
                            <!-- Credentials Box -->
                            <div style="background: linear-gradient(135deg, #f5f3ff 0%, #ede9fe 100%); border-radius: 16px; padding: 25px; border: 1px solid #ddd6fe;">
                                <h3 style="margin: 0 0 20px; color: #5b21b6; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                                    🔐 Suas Credenciais
                                </h3>
                                
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 10px 0; color: #52525b; font-size: 14px; width: 80px;">Email:</td>
                                        <td style="padding: 10px 0; color: #18181b; font-size: 16px; font-weight: 600;">${data.email}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 10px 0; color: #52525b; font-size: 14px;">Senha:</td>
                                        <td style="padding: 10px 0;">
                                            <code style="background-color: #18181b; color: #22c55e; padding: 8px 16px; border-radius: 8px; font-size: 18px; font-weight: 700; letter-spacing: 1px;">${data.password}</code>
                                        </td>
                                    </tr>
                                </table>
                            </div>
                            
                            <p style="margin: 25px 0 0; padding: 15px; background-color: #fef3c7; border-radius: 12px; color: #92400e; font-size: 14px; text-align: center;">
                                ⚠️ <strong>Importante:</strong> Recomendamos que você altere sua senha após o primeiro acesso.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- CTA Button -->
                    <tr>
                        <td style="padding: 10px 40px 40px; text-align: center;">
                            <a href="${data.loginUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #7c3aed 0%, #4f46e5 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-size: 18px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 15px rgba(124, 58, 237, 0.4);">
                                ✨ Acessar Minha Conta
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Next Steps -->
                    <tr>
                        <td style="padding: 0 40px 40px;">
                            <h3 style="margin: 0 0 15px; color: #18181b; font-size: 18px; font-weight: 700;">
                                Próximos Passos:
                            </h3>
                            <ol style="margin: 0; padding-left: 20px; color: #52525b; font-size: 15px; line-height: 2;">
                                <li>Acesse sua conta com as credenciais acima</li>
                                <li>Configure os dados da sua empresa em <strong>Configurações</strong></li>
                                <li>Cadastre seus produtos/serviços</li>
                                <li>Crie sua primeira proposta em menos de 60 segundos!</li>
                            </ol>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px 40px; text-align: center; border-top: 1px solid #f4f4f5;">
                            <p style="margin: 0 0 10px; color: #52525b; font-size: 14px;">
                                Precisa de ajuda? Entre em contato:
                            </p>
                            <a href="mailto:contato@digitalleads.com.br" style="color: #7c3aed; text-decoration: none; font-weight: 600;">
                                contato@digitalleads.com.br
                            </a>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Email Footer -->
                <p style="margin: 30px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} Digital Leads. Todos os direitos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
    `;

    const text = `
Bem-vindo ao DL Pro!

Olá ${data.name}!

Obrigado por assinar o plano ${data.planName}. Suas credenciais de acesso:

Email: ${data.email}
Senha: ${data.password}

Acesse: ${data.loginUrl}

IMPORTANTE: Recomendamos que você altere sua senha após o primeiro acesso.

Próximos Passos:
1. Acesse sua conta
2. Configure os dados da sua empresa
3. Cadastre seus produtos/serviços
4. Crie sua primeira proposta!

Precisa de ajuda? contato@digitalleads.com.br
    `;

    return sendEmail({
        to,
        subject: '🚀 Bem-vindo ao DL Pro - Suas credenciais de acesso',
        html,
        text,
    });
}

export async function POST(req: Request) {
    const body = await req.text();
    const signature = (await headers()).get('Stripe-Signature') as string;

    let event: Stripe.Event;
    const stripe = getStripe();

    try {
        event = stripe.webhooks.constructEvent(
            body,
            signature,
            process.env.STRIPE_WEBHOOK_SECRET || ''
        );
    } catch (error: any) {
        console.error('Webhook signature verification failed:', error.message);
        return new NextResponse(`Webhook Error: ${error.message}`, { status: 400 });
    }

    // Handle checkout.session.completed - NEW SIGNUP
    if (event.type === 'checkout.session.completed') {
        const session = event.data.object as Stripe.Checkout.Session;

        const isNewSignup = session.metadata?.isNewSignup === 'true';
        const planId = session.metadata?.planId;
        const customerEmail = session.customer_details?.email || session.customer_email;
        const customerName = session.customer_details?.name || customerEmail?.split('@')[0] || 'Usuário';

        if (isNewSignup && planId && customerEmail) {
            // Check if user already exists
            const existingUser = await prisma.user.findUnique({
                where: { email: customerEmail }
            });

            if (existingUser) {
                // User already exists - just update their company's plan
                if (existingUser.companyId) {
                    await prisma.company.update({
                        where: { id: existingUser.companyId },
                        data: {
                            stripeSubscriptionId: session.subscription as string,
                            stripeCustomerId: session.customer as string,
                            plan: planId,
                            status: 'active'
                        }
                    });
                }
                console.log('Existing user upgraded:', customerEmail);

                // Alert Admin
                await sendAdminNotification('new_subscription', {
                    title: `Renovação/Upgrade de Assinatura Detectada`,
                    details: {
                        'Cliente': customerName,
                        'Email': customerEmail,
                        'Novo Plano': planId,
                        'Tipo': 'Usuário Existente',
                        'Data': new Date().toLocaleString('pt-BR')
                    }
                });
            } else {
                // NEW USER - Create company, user, and send credentials
                const password = generatePassword();
                const hashedPassword = await bcrypt.hash(password, 10);

                // Create company
                const company = await prisma.company.create({
                    data: {
                        name: customerName,
                        email: customerEmail,
                        plan: planId,
                        status: 'active',
                        stripeCustomerId: session.customer as string,
                        stripeSubscriptionId: session.subscription as string,
                    }
                });

                // Create user (admin)
                await prisma.user.create({
                    data: {
                        email: customerEmail,
                        name: customerName,
                        password: hashedPassword,
                        role: 'admin',
                        companyId: company.id,
                        isActive: true,
                    }
                });

                // Get plan name for email
                const planNames: Record<string, string> = {
                    basic: 'Básico',
                    pro: 'Profissional',
                    enterprise: 'Enterprise',
                };

                // Send welcome email with credentials
                await sendWelcomeEmail(customerEmail, {
                    name: customerName,
                    email: customerEmail,
                    password: password, // Plain password for email
                    planName: planNames[planId] || planId,
                    loginUrl: `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br'}/login`,
                });

                console.log('New user created and email sent:', customerEmail);

                // Alert Admin
                await sendAdminNotification('new_user_company', {
                    title: `Nova Conta e Assinatura Criada (${planNames[planId]})`,
                    details: {
                        'Cliente': customerName,
                        'Email': customerEmail,
                        'Plano': planNames[planId] || planId,
                        'Empresa': customerName,
                        'Data': new Date().toLocaleString('pt-BR')
                    }
                });
            }
        } else if (!isNewSignup && session.metadata?.companyId) {
            // Existing company upgrading - legacy behavior
            const companyId = session.metadata.companyId;
            await prisma.company.update({
                where: { id: companyId },
                data: {
                    stripeSubscriptionId: session.subscription as string,
                    stripeCustomerId: session.customer as string,
                    plan: planId || 'basic',
                    status: 'active'
                }
            });
        }
    }

    // Handle invoice.payment_succeeded - Recurring payments
    if (event.type === 'invoice.payment_succeeded') {
        const invoice = event.data.object as Stripe.Invoice;
        const subscriptionId = (invoice as any).subscription as string;

        if (subscriptionId) {
            const company = await prisma.company.findFirst({
                where: { stripeSubscriptionId: subscriptionId }
            });

            if (company) {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { status: 'active' }
                });
            }
        }
    }

    // Handle subscription changes
    if (event.type === 'customer.subscription.deleted' || event.type === 'customer.subscription.updated') {
        const subscription = event.data.object as Stripe.Subscription;

        const company = await prisma.company.findFirst({
            where: { stripeSubscriptionId: subscription.id }
        });

        if (company) {
            if (subscription.status !== 'active' && subscription.status !== 'trialing') {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { status: 'suspended' }
                });
            } else {
                await prisma.company.update({
                    where: { id: company.id },
                    data: { status: 'active' }
                });
            }
        }
    }

    return new NextResponse(null, { status: 200 });
}
