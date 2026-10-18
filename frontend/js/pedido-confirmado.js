const numero = document.querySelector("#numero");
const aviso = document.querySelector("#aviso");
const listaItens = document.querySelector("#itens");
const totalElemento = document.querySelector("#total");
const valorPix = document.querySelector("#valor-pix");
const botaoPix = document.querySelector("#simular-pagamento");
const statusPagamento = document.querySelector("#status-pagamento");
const qrCode = document.querySelector("#qr-code");

const API = "http://localhost:3000/api";

let pedidoAtual = null;
let processandoPagamento = false;

// ======================================================
// QR CODE DE ACESSO À PÁGINA DO PEDIDO
// Este QR Code não é um código PIX para pagamento.
// ======================================================

if (qrCode) {
    const enderecoProjeto =
        `${window.location.origin}/pedido-confirmado.html`;

    qrCode.src =
        "https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=" +
        encodeURIComponent(enderecoProjeto);
}

// ======================================================
// FORMATAÇÃO DE PREÇOS
// ======================================================

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

// ======================================================
// LER PEDIDO SALVO NO NAVEGADOR
// ======================================================

function lerPedidoLocal() {
    try {
        return JSON.parse(
            localStorage.getItem("pedido_pendente") || "null"
        );
    } catch (erro) {
        console.error("Erro ao ler pedido local:", erro);
        return null;
    }
}

// ======================================================
// ATUALIZAR BOTÃO CONFORME O ESTADO DO PEDIDO
// ======================================================

function atualizarBotaoPagamento(pedido) {
    const pagamento = pedido.pagamento || {};

    if (pedido.status === "Cancelado") {
        botaoPix.textContent = "Pedido cancelado";
        botaoPix.disabled = true;
        return;
    }

    if (pagamento.status === "Aprovado") {
        botaoPix.textContent = "Pagamento confirmado";
        botaoPix.disabled = true;
        return;
    }

    botaoPix.textContent = "Pagamento pendente";
    botaoPix.disabled = false;
}

// ======================================================
// EXIBIR OS DADOS DO PEDIDO
// ======================================================

function renderizarPedido(pedido) {
    pedidoAtual = pedido;

    const statusPedido =
        pedido.status || "Aguardando pagamento";

    numero.textContent =
        `Pedido: ${pedido.numero} | Status: ${statusPedido}`;

    listaItens.replaceChildren();

    for (const item of pedido.itens || []) {
        const linha = document.createElement("li");

        const quantidade = Number(item.quantidade) || 1;
        const preco = Number(item.preco) || 0;
        const subtotal = preco * quantidade;

        linha.textContent =
            `${item.nome} — ${quantidade} × ${formatarPreco(preco)} = ${formatarPreco(subtotal)}`;

        listaItens.appendChild(linha);
    }

    const total = Number(pedido.total) || 0;

    totalElemento.textContent =
        `Total do pedido: ${formatarPreco(total)}`;

    valorPix.textContent =
        `Valor do pedido: ${formatarPreco(total)}`;

    const pagamento = pedido.pagamento || {};

    if (pedido.status === "Cancelado") {
        aviso.textContent =
            "Este pedido foi cancelado. Entre em contato com o atendimento se precisar de ajuda.";

        statusPagamento.textContent =
            "Pedido cancelado.";

    } else if (pagamento.status === "Aprovado") {
        aviso.textContent =
            "O sistema registra o pagamento como aprovado.";

        statusPagamento.textContent =
            "Pagamento registrado como aprovado no sistema.";

    } else {
        aviso.textContent =
            "Seu pedido foi registrado. O pagamento continua pendente.";

        statusPagamento.textContent =
            "Pagamento pendente. Aguardando confirmação válida do provedor de pagamento.";
    }

    atualizarBotaoPagamento(pedido);
}

// ======================================================
// CONSULTAR PEDIDO NO SERVIDOR
// ======================================================

async function consultarPedido() {
    const pedidoLocal = lerPedidoLocal();

    if (!pedidoLocal || !pedidoLocal.numero) {
        numero.textContent = "Nenhum pedido encontrado.";

        aviso.textContent =
            "Não encontramos um pedido nesta sessão. Volte ao catálogo para continuar.";

        statusPagamento.textContent = "";

        botaoPix.disabled = true;
        botaoPix.textContent = "Pedido não encontrado";

        return;
    }

    botaoPix.disabled = true;

    try {
        const resposta = await fetch(
            `${API}/pedidos/${encodeURIComponent(pedidoLocal.numero)}/pagamento`
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Não foi possível consultar o pedido."
            );
        }

        // Aceita tanto uma resposta direta do pedido
        // quanto uma resposta no formato { pedido: {...} }.
        const pedidoServidor = dados.pedido || dados;

        const pedidoCompleto = {
            ...pedidoLocal,
            ...pedidoServidor
        };

        localStorage.setItem(
            "pedido_pendente",
            JSON.stringify(pedidoCompleto)
        );

        renderizarPedido(pedidoCompleto);

    } catch (erro) {
        console.error("Erro ao consultar pedido:", erro);

        renderizarPedido(pedidoLocal);

        aviso.textContent =
            "Não foi possível atualizar os dados no servidor.";

        statusPagamento.textContent =
            "Exibindo os dados salvos neste navegador. Verifique se o servidor está funcionando.";

        // Permite tentar consultar novamente, desde que
        // o pedido local não esteja cancelado ou aprovado.
        atualizarBotaoPagamento(pedidoLocal);
    }
}

// ======================================================
// CONSULTAR O ESTADO DO PAGAMENTO
// Não aprova automaticamente o pagamento.
// ======================================================

async function confirmarPagamento() {
    if (!pedidoAtual || processandoPagamento) {
        return;
    }

    if (pedidoAtual.status === "Cancelado") {
        statusPagamento.textContent =
            "Este pedido foi cancelado.";

        atualizarBotaoPagamento(pedidoAtual);
        return;
    }

    if (
        pedidoAtual.pagamento &&
        pedidoAtual.pagamento.status === "Aprovado"
    ) {
        statusPagamento.textContent =
            "O sistema já registra este pagamento como aprovado.";

        atualizarBotaoPagamento(pedidoAtual);
        return;
    }

    processandoPagamento = true;

    botaoPix.disabled = true;
    botaoPix.textContent = "Consultando pagamento...";

    statusPagamento.textContent =
        "Consultando o estado atual do pagamento...";

    try {
        const resposta = await fetch(
            `${API}/pedidos/${encodeURIComponent(pedidoAtual.numero)}/pagamento/simular`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({})
            }
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Não foi possível consultar o pagamento."
            );
        }

        if (!dados.pedido) {
            throw new Error(
                "O servidor não retornou os dados atualizados do pedido."
            );
        }

        pedidoAtual = dados.pedido;

        localStorage.setItem(
            "pedido_pendente",
            JSON.stringify(pedidoAtual)
        );

        renderizarPedido(pedidoAtual);

        if (
            pedidoAtual.pagamento &&
            pedidoAtual.pagamento.status === "Aprovado"
        ) {
            statusPagamento.textContent =
                "O sistema registra o pagamento como aprovado.";
        } else {
            statusPagamento.textContent =
                "Pagamento pendente. Nenhuma confirmação de pagamento foi recebida.";
        }

    } catch (erro) {
        console.error("Erro ao consultar pagamento:", erro);

        statusPagamento.textContent =
            erro.message ||
            "Não foi possível consultar o pagamento. Tente novamente.";

        botaoPix.textContent = "Tentar novamente";

    } finally {
        processandoPagamento = false;

        if (
            pedidoAtual &&
            pedidoAtual.status !== "Cancelado" &&
            !(
                pedidoAtual.pagamento &&
                pedidoAtual.pagamento.status === "Aprovado"
            )
        ) {
            botaoPix.disabled = false;

            // Mantém o texto de nova tentativa se houve erro.
            if (botaoPix.textContent !== "Tentar novamente") {
                botaoPix.textContent = "Pagamento pendente";
            }
        } else if (pedidoAtual) {
            atualizarBotaoPagamento(pedidoAtual);
        }
    }
}

// ======================================================
// EVENTOS DA PÁGINA
// ======================================================

if (botaoPix) {
    botaoPix.addEventListener(
        "click",
        confirmarPagamento
    );

    botaoPix.disabled = true;
    botaoPix.textContent = "Carregando pedido...";
}

consultarPedido();