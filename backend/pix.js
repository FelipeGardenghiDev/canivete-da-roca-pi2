const QRCode = require("qrcode");
const crypto = require("crypto");

/**
 * Cálculo do Checksum CRC16-CCITT (Polinômio 0x1021) conforme padrão Bacen / EMV Co.
 */
function calcularCRC16(str) {
    let crc = 0xFFFF;
    for (let c = 0; c < str.length; c++) {
        crc ^= str.charCodeAt(c) << 8;
        for (let i = 0; i < 8; i++) {
            if (crc & 0x8000) {
                crc = (crc << 1) ^ 0x1021;
            } else {
                crc = crc << 1;
            }
            crc &= 0xFFFF;
        }
    }
    return crc.toString(16).toUpperCase().padStart(4, "0");
}

function formatarCampoEMV(id, valor) {
    const texto = String(valor ?? "");
    const tamanho = String(texto.length).padStart(2, "0");
    return `${id}${tamanho}${texto}`;
}

/**
 * Gera a string do Pix Copia e Cola (BR Code) no padrão Bacen.
 */
function gerarPixCopiaECola({ chave, nome, cidade, valor, txid }) {
    const gui = formatarCampoEMV("00", "br.gov.bcb.pix");
    const key = formatarCampoEMV("01", chave);
    const merchantAccount = formatarCampoEMV("26", gui + key);

    const mcc = formatarCampoEMV("52", "0000"); // Merchant Category Code
    const moeda = formatarCampoEMV("53", "986"); // BRL (Real)
    const valorFormatado = Number(valor).toFixed(2);
    const montante = formatarCampoEMV("54", valorFormatado);
    const pais = formatarCampoEMV("58", "BR");
    const nomeRecebedor = formatarCampoEMV("59", (nome || "CANIVETE DA ROCA").slice(0, 25).toUpperCase());
    const cidadeRecebedor = formatarCampoEMV("60", (cidade || "SERTAOZINHO").slice(0, 15).toUpperCase());
    const idTransacao = formatarCampoEMV("05", (txid || "***").replace(/[^a-zA-Z0-9]/g, "").slice(0, 25));
    const campoAdicional = formatarCampoEMV("62", idTransacao);

    const payloadSemCrc =
        "000201" +
        merchantAccount +
        mcc +
        moeda +
        montante +
        pais +
        nomeRecebedor +
        cidadeRecebedor +
        campoAdicional +
        "6304";

    const checksum = calcularCRC16(payloadSemCrc);
    return payloadSemCrc + checksum;
}

/**
 * Cria uma cobrança Pix no padrão Pagar.me v5 com TTL estrito de 30 minutos (RN04).
 */
async function criarCobrancaPixPagarme({ pedidoNumero, valor, clienteNome }) {
    const chavePix = process.env.PIX_CHAVE || "canivetedarocaunivesp@gmail.com";
    const nomeRecebedor = "CANIVETE DA ROCA PI2";
    const cidadeRecebedor = "SERTAOZINHO";
    const txid = pedidoNumero.replace(/[^a-zA-Z0-9]/g, "").slice(-20);

    const copiaECola = gerarPixCopiaECola({
        chave: chavePix,
        nome: nomeRecebedor,
        cidade: cidadeRecebedor,
        valor,
        txid
    });

    const qrCodeDataUrl = await QRCode.toDataURL(copiaECola, {
        width: 320,
        margin: 2,
        color: {
            dark: "#171816",
            light: "#ffffff"
        }
    });

    const agora = new Date();
    const expiraEm = new Date(agora.getTime() + 30 * 60 * 1000); // 30 minutos de validade

    return {
        id: `ch_pix_${crypto.randomBytes(8).toString("hex")}`,
        gateway: "pagarme_v5_pix",
        metodo: "pix",
        status: "Pendente",
        valor: Number(valor),
        qr_code: copiaECola,
        qr_code_url: qrCodeDataUrl,
        criado_em: agora.toISOString(),
        expira_em: expiraEm.toISOString(),
        ttl_segundos: 1800
    };
}

module.exports = {
    gerarPixCopiaECola,
    criarCobrancaPixPagarme
};
