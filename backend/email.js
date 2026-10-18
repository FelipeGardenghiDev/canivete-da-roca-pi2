const nodemailer = require("nodemailer");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

/**
 * Módulo de E-mails com Nodemailer
 * Projeto Integrador 2 - Canivete da Roça
 * 
 * Gerencia o envio de e-mails transacionais (criação do pedido e aprovação do pagamento)
 * com fallback inteligente para modo demonstrativo / Ethereal caso credenciais SMTP não estejam definidas.
 */

let transporterCache = null;

async function obterTransporter() {
    if (transporterCache) {
        return transporterCache;
    }

    const host = process.env.EMAIL_HOST;
    const user = process.env.EMAIL_USER;
    const pass = process.env.EMAIL_PASS;
    const port = Number(process.env.EMAIL_PORT || 465);
    const secure = process.env.EMAIL_SECURE !== "false";

    if (user && pass && pass.trim()) {
        if (user.includes("@gmail.com") || host === "smtp.gmail.com") {
            transporterCache = nodemailer.createTransport({
                service: "gmail",
                auth: {
                    user: user.trim(),
                    pass: pass.trim().replace(/\s+/g, "") // Remove espaços se o usuário colou a chave com espaços
                }
            });
            console.log(`[EMAIL] Conectado ao serviço oficial Gmail (${user})`);
            return transporterCache;
        }

        transporterCache = nodemailer.createTransport({
            host: host || "smtp.gmail.com",
            port,
            secure,
            auth: {
                user: user.trim(),
                pass: pass.trim()
            }
        });
        return transporterCache;
    }


    // Modo Demonstrativo / Sandbox: cria conta de teste gratuita Ethereal
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log("[EMAIL] Credenciais SMTP reais não configuradas. Usando conta de teste Ethereal:", testAccount.user);

        transporterCache = nodemailer.createTransport({
            host: "smtp.ethereal.email",
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass
            }
        });

        return transporterCache;
    } catch (erro) {
        console.warn("[EMAIL] Não foi possível criar conta Ethereal. Operando em modo log local:", erro.message);
        transporterCache = {
            sendMail: async (opcoes) => {
                console.log("--------------------------------------------------");
                console.log(`[EMAIL SIMULADO LOCAL]`);
                console.log(`Para: ${opcoes.to}`);
                console.log(`Assunto: ${opcoes.subject}`);
                console.log("--------------------------------------------------");
                return { messageId: `sim_${Date.now()}` };
            }
        };
        return transporterCache;
    }
}

function formatarMoeda(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

/**
 * Envia e-mail de confirmação de pedido com QR Code e Pix Copia e Cola.
 */
async function enviarEmailPedidoCriado(pedido) {
    if (!pedido || !pedido.cliente || !pedido.cliente.email) {
        return;
    }

    const destinatario = pedido.cliente.email;
    const nomeCliente = pedido.cliente.nome || "Cliente";
    const remetente = process.env.EMAIL_FROM || '"Canivete da Roça" <canivetedarocaunivesp@gmail.com>';


    const itensHtml = (pedido.itens || []).map(item => `
        <tr style="border-bottom: 1px solid #e2d9cb;">
            <td style="padding: 10px 8px; font-size: 14px; color: #171816;">
                <strong>${item.nome}</strong><br>
                <span style="font-size: 12px; color: #77776e;">Qtd: ${item.quantidade} × ${formatarMoeda(item.preco)}</span>
            </td>
            <td style="padding: 10px 8px; font-size: 14px; text-align: right; font-weight: bold; color: #171816;">
                ${formatarMoeda(item.subtotal || item.preco * item.quantidade)}
            </td>
        </tr>
    `).join("");

    const freteHtml = pedido.frete ? `
        <tr style="border-bottom: 1px solid #e2d9cb;">
            <td style="padding: 10px 8px; font-size: 14px; color: #555;">
                Frete (${pedido.frete.nome || "Entrega"} - Prazo: ${pedido.frete.prazo || 0} dias)
            </td>
            <td style="padding: 10px 8px; font-size: 14px; text-align: right; color: #171816;">
                ${formatarMoeda(pedido.frete.valor)}
            </td>
        </tr>
    ` : "";

    const subtotalHtml = pedido.subtotal !== undefined ? `
        <tr style="border-bottom: 1px solid #e2d9cb;">
            <td style="padding: 10px 8px; font-size: 14px; color: #555;">Subtotal dos produtos</td>
            <td style="padding: 10px 8px; font-size: 14px; text-align: right; color: #171816;">
                ${formatarMoeda(pedido.subtotal)}
            </td>
        </tr>
    ` : "";

    const copiaCola = pedido.pagamento?.qr_code || "";
    const qrCodeUrl = pedido.pagamento?.qr_code_url || "";

    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <title>Pedido Registrado - Canivete da Roça</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ee; margin: 0; padding: 24px; color: #171816;">
        <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #d8cfbe; margin: 0 auto; border-spacing: 0;">
            <!-- Cabeçalho -->
            <tr>
                <td style="background-color: #3b4231; padding: 24px 28px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; font-family: Georgia, serif;">CANIVETE DA ROÇA</h1>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #c4ccb6; letter-spacing: 0.5px;">Cutelaria Artesanal & Tradição</p>
                </td>
            </tr>

            <!-- Corpo -->
            <tr>
                <td style="padding: 28px;">
                    <h2 style="margin: 0 0 12px; font-size: 20px; color: #3b4231;">Olá, ${nomeCliente}!</h2>
                    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #333333;">
                        Seu pedido <strong>#${pedido.numero}</strong> foi gerado com sucesso. Para concluirmos a separação e o envio, realize o pagamento via <strong>PIX</strong> no valor de <strong>${formatarMoeda(pedido.total)}</strong>.
                    </p>

                    <!-- Bloco PIX -->
                    <div style="background-color: #fdfbf7; border: 1px solid #e2d9cb; border-radius: 8px; padding: 20px; text-align: center; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 8px; font-size: 16px; color: #3b4231;">Pagamento via PIX (Pagar.me v5)</h3>
                        <p style="margin: 0 0 14px; font-size: 13px; color: #666;">Validade do QR Code: 30 minutos</p>

                        ${qrCodeUrl ? `
                            <div style="display: inline-block; background: #ffffff; padding: 10px; border-radius: 6px; border: 1px solid #ddd; margin-bottom: 14px;">
                                <img src="${qrCodeUrl}" alt="QR Code Pix" width="200" height="200" style="display: block; margin: 0 auto;">
                            </div>
                        ` : ""}

                        <div style="margin-top: 10px; text-align: left;">
                            <label style="display: block; font-size: 12px; font-weight: bold; margin-bottom: 4px; color: #444;">Código Copia e Cola:</label>
                            <div style="background: #f0ede6; padding: 10px; border-radius: 4px; font-family: monospace; font-size: 11px; word-break: break-all; color: #222; border: 1px solid #d4cbb8;">
                                ${copiaCola}
                            </div>
                        </div>
                    </div>

                    <!-- Resumo dos Itens -->
                    <h3 style="margin: 0 0 10px; font-size: 16px; color: #3b4231; border-bottom: 2px solid #f0ede6; padding-bottom: 6px;">Resumo dos Itens</h3>
                    <table width="100%" style="border-collapse: collapse; margin-bottom: 20px;">
                        ${itensHtml}
                        ${subtotalHtml}
                        ${freteHtml}
                        <tr>
                            <td style="padding: 12px 8px; font-size: 16px; font-weight: bold; color: #171816;">Total a Pagar</td>
                            <td style="padding: 12px 8px; font-size: 18px; text-align: right; font-weight: bold; color: #3b4231;">
                                ${formatarMoeda(pedido.total)}
                            </td>
                        </tr>
                    </table>

                    <!-- Dados de Entrega -->
                    <div style="background-color: #f8f7f4; padding: 14px; border-radius: 6px; font-size: 13px; color: #555; line-height: 1.5;">
                        <strong style="color: #222;">Endereço de Entrega:</strong><br>
                        ${pedido.cliente.endereco || ""}${pedido.cliente.complemento ? " (" + pedido.cliente.complemento + ")" : ""}<br>
                        ${pedido.cliente.cidade || ""} - ${pedido.cliente.estado || ""} · CEP: ${pedido.cliente.cep || ""}
                    </div>
                </td>
            </tr>

            <!-- Rodapé -->
            <tr>
                <td style="background-color: #f0ede6; padding: 18px 28px; text-align: center; font-size: 12px; color: #6e6b65; border-top: 1px solid #ded6c5;">
                    Canivete da Roça · Sertãozinho, SP<br>
                    Projeto Integrador 2 — Univesp 2026
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        const transporter = await obterTransporter();
        const info = await transporter.sendMail({
            from: remetente,
            to: destinatario,
            subject: `Canivete da Roça - Pedido #${pedido.numero} Realizado!`,
            html
        });

        console.log(`[EMAIL] Confirmação do pedido #${pedido.numero} enviada para ${destinatario} (ID: ${info.messageId})`);
        if (nodemailer.getTestMessageUrl && info) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`[EMAIL PREVIEW] Visualize o e-mail em: ${previewUrl}`);
            }
        }
    } catch (erro) {
        console.error(`[EMAIL] Falha ao enviar e-mail do pedido #${pedido.numero}:`, erro.message);
    }
}

/**
 * Envia e-mail de aprovação de pagamento.
 */
async function enviarEmailPagamentoAprovado(pedido) {
    if (!pedido || !pedido.cliente || !pedido.cliente.email) {
        return;
    }

    const destinatario = pedido.cliente.email;
    const nomeCliente = pedido.cliente.nome || "Cliente";
    const remetente = process.env.EMAIL_FROM || '"Canivete da Roça" <canivetedarocaunivesp@gmail.com>';


    const html = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
        <meta charset="utf-8">
        <title>Pagamento Aprovado - Canivete da Roça</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f7f4ee; margin: 0; padding: 24px; color: #171816;">
        <table align="center" width="100%" max-width="600" style="max-width: 600px; background-color: #ffffff; border-radius: 8px; overflow: hidden; border: 1px solid #d8cfbe; margin: 0 auto; border-spacing: 0;">
            <!-- Cabeçalho -->
            <tr>
                <td style="background-color: #2b5736; padding: 24px 28px; text-align: center; color: #ffffff;">
                    <h1 style="margin: 0; font-size: 24px; letter-spacing: 1px; font-family: Georgia, serif;">CANIVETE DA ROÇA</h1>
                    <p style="margin: 6px 0 0; font-size: 13px; color: #c4d9ca; letter-spacing: 0.5px;">Pagamento Confirmado</p>
                </td>
            </tr>

            <!-- Corpo -->
            <tr>
                <td style="padding: 28px;">
                    <div style="text-align: center; margin-bottom: 20px;">
                        <span style="display: inline-block; background-color: #e6f4ea; color: #1e7e34; padding: 8px 16px; border-radius: 20px; font-weight: bold; font-size: 14px;">
                            ✓ Pagamento PIX Aprovado
                        </span>
                    </div>

                    <h2 style="margin: 0 0 12px; font-size: 20px; color: #2b5736;">Boas notícias, ${nomeCliente}!</h2>
                    <p style="margin: 0 0 18px; font-size: 15px; line-height: 1.6; color: #333333;">
                        Confirmamos o recebimento do pagamento no valor de <strong>${formatarMoeda(pedido.total)}</strong> para o pedido <strong>#${pedido.numero}</strong>.
                    </p>

                    <div style="background-color: #f4f8f4; border: 1px solid #c8e6c9; border-radius: 8px; padding: 18px; margin-bottom: 24px;">
                        <h3 style="margin: 0 0 8px; font-size: 15px; color: #2b5736;">Próximos Passos:</h3>
                        <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #38523c; line-height: 1.6;">
                            <li>Nossa equipe artesanal já foi notificada para separação e polimento das peças.</li>
                            <li>Assim que o pacote for despachado via ${pedido.frete?.transportadora || "transportadora"}, você receberá as informações de rastreio.</li>
                        </ul>
                    </div>

                    <!-- Dados de Entrega -->
                    <div style="background-color: #f8f7f4; padding: 14px; border-radius: 6px; font-size: 13px; color: #555; line-height: 1.5;">
                        <strong style="color: #222;">Endereço de Entrega:</strong><br>
                        ${pedido.cliente.endereco || ""}${pedido.cliente.complemento ? " (" + pedido.cliente.complemento + ")" : ""}<br>
                        ${pedido.cliente.cidade || ""} - ${pedido.cliente.estado || ""} · CEP: ${pedido.cliente.cep || ""}<br>
                        <small style="color: #777;">Envio por: ${pedido.frete?.nome || "Transportadora parceira"} (${pedido.frete?.prazo ? pedido.frete.prazo + " dias úteis" : "Prazo padrão"})</small>
                    </div>
                </td>
            </tr>

            <!-- Rodapé -->
            <tr>
                <td style="background-color: #f0ede6; padding: 18px 28px; text-align: center; font-size: 12px; color: #6e6b65; border-top: 1px solid #ded6c5;">
                    Obrigado por apoiar a cutelaria artesanal brasileira!<br>
                    Canivete da Roça · Sertãozinho, SP
                </td>
            </tr>
        </table>
    </body>
    </html>
    `;

    try {
        const transporter = await obterTransporter();
        const info = await transporter.sendMail({
            from: remetente,
            to: destinatario,
            subject: `Canivete da Roça - Pagamento Confirmado (Pedido #${pedido.numero})!`,
            html
        });

        console.log(`[EMAIL] Confirmação de pagamento do pedido #${pedido.numero} enviada para ${destinatario} (ID: ${info.messageId})`);
        if (nodemailer.getTestMessageUrl && info) {
            const previewUrl = nodemailer.getTestMessageUrl(info);
            if (previewUrl) {
                console.log(`[EMAIL PREVIEW] Visualize o e-mail em: ${previewUrl}`);
            }
        }
    } catch (erro) {
        console.error(`[EMAIL] Falha ao enviar e-mail de pagamento do pedido #${pedido.numero}:`, erro.message);
    }
}

module.exports = {
    enviarEmailPedidoCriado,
    enviarEmailPagamentoAprovado
};
