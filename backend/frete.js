const https = require("https");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, ".env") });

/**
 * Módulo de Integração com o Melhor Envio
 * Projeto Integrador 2 - Canivete da Roça
 * 
 * Calcula cotações de frete via API v2 do Melhor Envio (Sandbox ou Produção)
 * com fallback inteligente para garantir que a loja nunca fique inoperante.
 */

const CEP_ORIGEM_PADRAO = "14170460"; // Sertãozinho - SP
const URL_BASE_PADRAO = "https://sandbox.melhorenvio.com.br";

/**
 * Opções de frete de contingência (fallback) caso o Melhor Envio esteja fora
 * do ar ou o trecho consultado não tenha transportadoras habilitadas no Sandbox.
 */
function obterOpcoesContingencia(cepDestino) {
    return [
        {
            id: 1,
            nome: "Correios PAC (Estimado)",
            transportadora: "Correios",
            servico: "PAC",
            valor: 19.90,
            prazo: 5,
            foto: "https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png",
            aviso: "Cotação estimada da loja"
        },
        {
            id: 2,
            nome: "Correios SEDEX (Estimado)",
            transportadora: "Correios",
            servico: "SEDEX",
            valor: 29.90,
            prazo: 2,
            foto: "https://sandbox.melhorenvio.com.br/images/shipping-companies/correios.png",
            aviso: "Cotação estimada da loja"
        }
    ];
}

/**
 * Estima as dimensões e peso cúbico da embalagem para os produtos do pedido.
 * Um canivete artesanal típico tem ~200g a 350g com embalagem.
 */
function estimarDimensoesPacote(itens = []) {
    let quantidadeTotal = 0;

    if (Array.isArray(itens)) {
        for (const item of itens) {
            const qtd = Number(item.quantidade || 1);
            if (Number.isSafeInteger(qtd) && qtd > 0) {
                quantidadeTotal += qtd;
            }
        }
    }

    if (quantidadeTotal < 1) {
        quantidadeTotal = 1;
    }

    // Dimensões mínimas dos Correios/Melhor Envio: 8cm x 13cm x 16cm, peso mín 0.1kg
    const peso = Math.min(30.0, Math.max(0.3, quantidadeTotal * 0.25));
    const altura = Math.min(100, Math.max(11, 10 + Math.ceil(quantidadeTotal / 2) * 2));
    const largura = Math.min(100, 15);
    const comprimento = Math.min(100, 20);

    return {
        height: altura,
        width: largura,
        length: comprimento,
        weight: Number(peso.toFixed(2))
    };
}

/**
 * Calcula frete no Melhor Envio.
 * @param {string} cepDestino CEP de destino (8 dígitos numéricos)
 * @param {Array} itens Lista de itens do carrinho
 * @returns {Promise<Array>} Lista de opções de frete válidas
 */
async function calcularFrete(cepDestino, itens = []) {
    const cepLimpo = String(cepDestino || "").replace(/\D/g, "");

    if (!/^\d{8}$/.test(cepLimpo)) {
        throw new Error("CEP de destino inválido. Deve conter 8 números.");
    }

    const token = process.env.MELHOR_ENVIO_TOKEN;
    const cepOrigem = (process.env.CEP_ORIGEM || CEP_ORIGEM_PADRAO).replace(/\D/g, "");
    const urlBase = process.env.MELHOR_ENVIO_URL || URL_BASE_PADRAO;

    if (!token) {
        console.warn("[FRETE] MELHOR_ENVIO_TOKEN não configurado. Usando opções de contingência.");
        return obterOpcoesContingencia(cepLimpo);
    }

    const pacote = estimarDimensoesPacote(itens);

    const payload = JSON.stringify({
        from: {
            postal_code: cepOrigem
        },
        to: {
            postal_code: cepLimpo
        },
        package: pacote
    });

    try {
        const resultado = await new Promise((resolve, reject) => {
            const urlCompleta = new URL("/api/v2/me/shipment/calculate", urlBase);

            const opcoes = {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${token}`,
                    "User-Agent": "CaniveteDaRoca (contato@canivetedaroca.com.br)",
                    "Content-Length": Buffer.byteLength(payload)
                },
                timeout: 10000
            };

            const req = https.request(urlCompleta, opcoes, (res) => {
                let corpo = "";

                res.on("data", chunk => {
                    corpo += chunk;
                });

                res.on("end", () => {
                    if (res.statusCode < 200 || res.statusCode >= 300) {
                        return reject(new Error(`Melhor Envio HTTP ${res.statusCode}: ${corpo.slice(0, 200)}`));
                    }

                    try {
                        const dados = JSON.parse(corpo);
                        resolve(dados);
                    } catch (e) {
                        reject(new Error("Resposta do Melhor Envio não é um JSON válido."));
                    }
                });
            });

            req.on("error", reject);
            req.on("timeout", () => {
                req.destroy();
                reject(new Error("Tempo limite esgotado ao consultar o Melhor Envio."));
            });

            req.write(payload);
            req.end();
        });

        if (!Array.isArray(resultado)) {
            console.warn("[FRETE] Resposta inesperada do Melhor Envio:", resultado);
            return obterOpcoesContingencia(cepLimpo);
        }

        // Filtra opções válidas (sem erro e com valor numérico positivo)
        const opcoesValidas = resultado
            .filter(opcao => !opcao.error && Number(opcao.price || opcao.custom_price) > 0)
            .map(opcao => {
                const valor = Number(opcao.custom_price || opcao.price);
                const transportadora = opcao.company?.name || "Transportadora";
                const servico = opcao.name || "Padrão";

                return {
                    id: opcao.id,
                    nome: `${transportadora} ${servico}`.trim(),
                    transportadora,
                    servico,
                    valor: Number(valor.toFixed(2)),
                    prazo: Number(opcao.custom_delivery_time || opcao.delivery_time || 0),
                    foto: opcao.company?.picture || null
                };
            });

        if (opcoesValidas.length === 0) {
            console.warn("[FRETE] Nenhuma transportadora retornou cotação sem erro no Melhor Envio. Usando contingência.");
            return obterOpcoesContingencia(cepLimpo);
        }

        // Ordena por preço mais em conta
        opcoesValidas.sort((a, b) => a.valor - b.valor);

        return opcoesValidas;

    } catch (erro) {
        console.error("[FRETE] Falha ao consultar Melhor Envio:", erro.message);
        return obterOpcoesContingencia(cepLimpo);
    }
}

module.exports = {
    calcularFrete,
    estimarDimensoesPacote,
    obterOpcoesContingencia
};
