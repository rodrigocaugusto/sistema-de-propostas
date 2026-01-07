import nodemailer from 'nodemailer';

// Amazon SES SMTP Configuration
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'email-smtp.us-east-1.amazonaws.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
    },
});

interface SendEmailOptions {
    to: string;
    subject: string;
    html: string;
    text?: string;
}

export async function sendEmail({ to, subject, html, text }: SendEmailOptions) {
    const fromEmail = process.env.SMTP_FROM_EMAIL || 'info@digitalleads.com.br';
    const fromName = process.env.SMTP_FROM_NAME || 'Digital Leads';

    try {
        const info = await transporter.sendMail({
            from: `"${fromName}" <${fromEmail}>`,
            to,
            subject,
            text: text || '',
            html,
        });

        console.log('Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('Error sending email:', error);
        return { success: false, error };
    }
}

// ========================
// EMAIL TEMPLATES
// ========================

// Template: Envio de Nova Proposta para o Cliente
export function getProposalNotificationTemplate(data: {
    clientName: string;
    companyName: string;
    companyLogo?: string | null;
    proposalUrl: string;
}) {
    return {
        subject: `${data.companyName} enviou uma proposta comercial para você`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Nova Proposta Comercial</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f4f4f5;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);">
                    
                    <!-- Header com Gradiente -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #1e1e1e 0%, #374151 100%); padding: 50px 40px; text-align: center;">
                            ${data.companyLogo
                ? `<img src="${data.companyLogo}" alt="${data.companyName}" style="max-height: 60px; max-width: 200px; margin-bottom: 20px;">`
                : `<h1 style="margin: 0 0 10px; color: #ffffff; font-size: 32px; font-weight: 700; letter-spacing: -0.5px;">${data.companyName}</h1>`
            }
                            <div style="width: 60px; height: 4px; background: linear-gradient(90deg, #22c55e, #16a34a); margin: 0 auto; border-radius: 2px;"></div>
                        </td>
                    </tr>
                    
                    <!-- Ícone de Documento -->
                    <tr>
                        <td style="padding: 40px 40px 20px; text-align: center;">
                            <div style="display: inline-block; width: 80px; height: 80px; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); border-radius: 20px; line-height: 80px;">
                                <span style="font-size: 36px;">📄</span>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Conteúdo Principal -->
                    <tr>
                        <td style="padding: 0 40px 30px; text-align: center;">
                            <h2 style="margin: 0 0 15px; color: #18181b; font-size: 26px; font-weight: 700;">
                                Nova Proposta Comercial
                            </h2>
                            <p style="margin: 0 0 10px; color: #52525b; font-size: 18px; line-height: 1.6;">
                                Olá <strong>${data.clientName}</strong>!
                            </p>
                            <p style="margin: 0; color: #71717a; font-size: 16px; line-height: 1.7;">
                                <strong>${data.companyName}</strong> preparou uma proposta comercial exclusiva para você. 
                                Clique no botão abaixo para visualizar todos os detalhes.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Botão CTA -->
                    <tr>
                        <td style="padding: 10px 40px 40px; text-align: center;">
                            <a href="${data.proposalUrl}" 
                               style="display: inline-block; background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); color: #ffffff; text-decoration: none; padding: 18px 50px; border-radius: 12px; font-size: 18px; font-weight: 700; letter-spacing: 0.3px; box-shadow: 0 4px 15px rgba(34, 197, 94, 0.4);">
                                ✨ Ver Minha Proposta
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Divisor -->
                    <tr>
                        <td style="padding: 0 40px;">
                            <div style="height: 1px; background: linear-gradient(90deg, transparent, #e4e4e7, transparent);"></div>
                        </td>
                    </tr>
                    
                    <!-- Link alternativo -->
                    <tr>
                        <td style="padding: 30px 40px; text-align: center;">
                            <p style="margin: 0 0 10px; color: #a1a1aa; font-size: 13px;">
                                Se o botão não funcionar, copie e cole este link no seu navegador:
                            </p>
                            <a href="${data.proposalUrl}" style="color: #22c55e; font-size: 13px; word-break: break-all; text-decoration: none;">
                                ${data.proposalUrl}
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #fafafa; padding: 30px 40px; text-align: center; border-top: 1px solid #f4f4f5;">
                            <p style="margin: 0 0 5px; color: #71717a; font-size: 14px;">
                                Enviado por <strong>${data.companyName}</strong>
                            </p>
                            <p style="margin: 0; color: #a1a1aa; font-size: 12px;">
                                Este email foi enviado porque você recebeu uma proposta comercial.
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Email Footer -->
                <p style="margin: 30px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                    © ${new Date().getFullYear()} ${data.companyName}. Todos os direitos reservados.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
Olá ${data.clientName}!

${data.companyName} preparou uma proposta comercial exclusiva para você.

Para visualizar a proposta, acesse o link:
${data.proposalUrl}

Atenciosamente,
${data.companyName}
        `
    };
}

// Template: Confirmação de Aceite para a Empresa
export function getAcceptanceConfirmationTemplate(data: {
    companyEmail: string;
    companyName: string;
    clientName: string;
    clientEmail: string;
    clientPhone?: string | null;
    clientCompany?: string | null;
    proposalNumber?: string | null;
    proposalUrl: string;
    totalOneTime?: number;
    totalRecurring?: number;
}) {
    const formatCurrency = (value: number) =>
        value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

    return {
        subject: `🎉 Proposta Aceita! ${data.clientName} aceitou sua proposta`,
        html: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Proposta Aceita!</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f0fdf4;">
    <table role="presentation" style="width: 100%; border-collapse: collapse;">
        <tr>
            <td align="center" style="padding: 40px 20px;">
                <table role="presentation" style="width: 600px; max-width: 100%; border-collapse: collapse; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 40px rgba(34, 197, 94, 0.15);">
                    
                    <!-- Header com celebração -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%); padding: 50px 40px; text-align: center;">
                            <div style="font-size: 60px; margin-bottom: 15px;">🎉</div>
                            <h1 style="margin: 0; color: #ffffff; font-size: 32px; font-weight: 700;">
                                Proposta Aceita!
                            </h1>
                            <p style="margin: 15px 0 0; color: rgba(255,255,255,0.9); font-size: 18px;">
                                Parabéns! Você fechou um novo negócio.
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Informações do Cliente -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); border-radius: 16px; padding: 25px; border: 1px solid #bbf7d0;">
                                <h3 style="margin: 0 0 20px; color: #166534; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                                    👤 Dados do Cliente
                                </h3>
                                
                                <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                    <tr>
                                        <td style="padding: 8px 0; color: #52525b; font-size: 14px; width: 120px;">Nome:</td>
                                        <td style="padding: 8px 0; color: #18181b; font-size: 16px; font-weight: 600;">${data.clientName}</td>
                                    </tr>
                                    ${data.clientCompany ? `
                                    <tr>
                                        <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Empresa:</td>
                                        <td style="padding: 8px 0; color: #18181b; font-size: 16px; font-weight: 600;">${data.clientCompany}</td>
                                    </tr>
                                    ` : ''}
                                    <tr>
                                        <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Email:</td>
                                        <td style="padding: 8px 0;">
                                            <a href="mailto:${data.clientEmail}" style="color: #22c55e; font-size: 16px; text-decoration: none;">${data.clientEmail}</a>
                                        </td>
                                    </tr>
                                    ${data.clientPhone ? `
                                    <tr>
                                        <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Telefone:</td>
                                        <td style="padding: 8px 0;">
                                            <a href="tel:${data.clientPhone}" style="color: #22c55e; font-size: 16px; text-decoration: none;">${data.clientPhone}</a>
                                        </td>
                                    </tr>
                                    ` : ''}
                                    ${data.proposalNumber ? `
                                    <tr>
                                        <td style="padding: 8px 0; color: #52525b; font-size: 14px;">Proposta:</td>
                                        <td style="padding: 8px 0; color: #18181b; font-size: 16px; font-weight: 600;">#${data.proposalNumber}</td>
                                    </tr>
                                    ` : ''}
                                </table>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Valores -->
                    ${(data.totalOneTime || data.totalRecurring) ? `
                    <tr>
                        <td style="padding: 0 40px 30px;">
                            <h3 style="margin: 0 0 15px; color: #18181b; font-size: 16px; text-transform: uppercase; letter-spacing: 1px;">
                                💰 Valores do Contrato
                            </h3>
                            <table role="presentation" style="width: 100%; border-collapse: collapse;">
                                <tr>
                                    ${data.totalOneTime ? `
                                    <td style="background-color: #18181b; padding: 25px; border-radius: 12px; text-align: center; ${data.totalRecurring ? 'width: 48%;' : 'width: 100%;'}">
                                        <p style="margin: 0 0 5px; color: #a1a1aa; font-size: 13px; text-transform: uppercase;">Valor Único</p>
                                        <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${formatCurrency(data.totalOneTime)}</p>
                                    </td>
                                    ` : ''}
                                    ${(data.totalOneTime && data.totalRecurring) ? '<td style="width: 4%;"></td>' : ''}
                                    ${data.totalRecurring ? `
                                    <td style="background-color: #18181b; padding: 25px; border-radius: 12px; text-align: center; ${data.totalOneTime ? 'width: 48%;' : 'width: 100%;'}">
                                        <p style="margin: 0 0 5px; color: #a1a1aa; font-size: 13px; text-transform: uppercase;">Mensalidade</p>
                                        <p style="margin: 0; color: #ffffff; font-size: 28px; font-weight: 700;">${formatCurrency(data.totalRecurring)}</p>
                                    </td>
                                    ` : ''}
                                </tr>
                            </table>
                        </td>
                    </tr>
                    ` : ''}
                    
                    <!-- Botão Ver Proposta -->
                    <tr>
                        <td style="padding: 10px 40px 40px; text-align: center;">
                            <a href="${data.proposalUrl}" 
                               style="display: inline-block; background-color: #18181b; color: #ffffff; text-decoration: none; padding: 16px 40px; border-radius: 10px; font-size: 16px; font-weight: 600;">
                                📋 Ver Proposta Completa
                            </a>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #f0fdf4 0%, #dcfce7 100%); padding: 25px 40px; text-align: center; border-top: 1px solid #bbf7d0;">
                            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600;">
                                ✅ Entre em contato com o cliente para dar continuidade ao fechamento!
                            </p>
                        </td>
                    </tr>
                    
                </table>
                
                <!-- Footer -->
                <p style="margin: 30px 0 0; color: #a1a1aa; font-size: 12px; text-align: center;">
                    Este email foi enviado automaticamente pelo Sistema de Propostas.
                </p>
            </td>
        </tr>
    </table>
</body>
</html>
        `,
        text: `
🎉 PROPOSTA ACEITA!

Parabéns! ${data.clientName} aceitou sua proposta.

DADOS DO CLIENTE:
- Nome: ${data.clientName}
${data.clientCompany ? `- Empresa: ${data.clientCompany}` : ''}
- Email: ${data.clientEmail}
${data.clientPhone ? `- Telefone: ${data.clientPhone}` : ''}
${data.proposalNumber ? `- Proposta: #${data.proposalNumber}` : ''}

${data.totalOneTime ? `Valor Único: ${formatCurrency(data.totalOneTime)}` : ''}
${data.totalRecurring ? `Mensalidade: ${formatCurrency(data.totalRecurring)}` : ''}

Ver proposta: ${data.proposalUrl}

Entre em contato com o cliente para dar continuidade ao fechamento!
        `
    };
}

// ========================
// SEND EMAIL FUNCTIONS
// ========================

// Enviar email de nova proposta para o cliente
export async function sendProposalNotification(
    to: string,
    data: {
        clientName: string;
        companyName: string;
        companyLogo?: string | null;
        proposalUrl: string;
    }
) {
    const template = getProposalNotificationTemplate(data);
    return sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
    });
}

// Enviar confirmação de aceite para a empresa
export async function sendAcceptanceConfirmation(
    to: string,
    data: {
        companyEmail: string;
        companyName: string;
        clientName: string;
        clientEmail: string;
        clientPhone?: string | null;
        clientCompany?: string | null;
        proposalNumber?: string | null;
        proposalUrl: string;
        totalOneTime?: number;
        totalRecurring?: number;
    }
) {
    const template = getAcceptanceConfirmationTemplate(data);

    // First email to the company/admin (to)
    const emailToCompany = sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text,
    });

    // We can also send a carbon copy to the proposal creator if different, for now to is the company email
    return emailToCompany;
}

// Template: Recuperação de Senha
export function getPasswordResetTemplate(data: {
    userName: string;
    newPassword: string;
    companyName: string;
    loginUrl: string;
}) {
    return {
        subject: `Sua nova senha de acesso - ${data.companyName}`,
        html: `
<!DOCTYPE html>
<html>
<body style="font-family: sans-serif; background-color: #f4f4f5; padding: 40px 20px;">
    <div style="max-width: 600px; margin: 0 auto; background: white; padding: 40px; border-radius: 16px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
        <h1 style="color: #18181b; margin-top: 0;">Nova Senha Gerada</h1>
        <p style="color: #52525b; font-size: 16px;">Olá <strong>${data.userName}</strong>,</p>
        <p style="color: #52525b; font-size: 16px;">Uma nova senha forte foi gerada para o seu acesso ao sistema <strong>${data.companyName}</strong>.</p>
        
        <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 20px; margin: 30px 0; text-align: center;">
            <p style="margin: 0; color: #166534; font-size: 14px; font-weight: 600; text-transform: uppercase; letter-spacing: 1px;">Sua Nova Senha</p>
            <p style="margin: 10px 0 0; color: #15803d; font-size: 32px; font-family: monospace; font-weight: bold; letter-spacing: 2px;">${data.newPassword}</p>
        </div>

        <div style="text-align: center; margin-bottom: 30px;">
            <a href="${data.loginUrl}" style="background-color: #2563eb; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600; display: inline-block;">Acessar o Sistema</a>
        </div>

        <p style="color: #71717a; font-size: 14px; border-top: 1px solid #e4e4e7; padding-top: 20px; margin-top: 20px;">
            Recomendamos que você altere esta senha após o primeiro login por questões de segurança.
        </p>
    </div>
</body>
</html>
        `,
        text: `Olá ${data.userName},\n\nSua nova senha de acesso é: ${data.newPassword}\n\nAcesse em: ${data.loginUrl}`
    };
}

export async function sendPasswordResetEmail(to: string, data: {
    userName: string;
    newPassword: string;
    companyName: string;
}) {
    const loginUrl = `${process.env.NEXT_PUBLIC_APP_URL || 'https://app.digitalleads.com.br'}/login`;
    const template = getPasswordResetTemplate({ ...data, loginUrl });

    return await sendEmail({
        to,
        subject: template.subject,
        html: template.html,
        text: template.text
    });
}
