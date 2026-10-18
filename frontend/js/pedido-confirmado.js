const numero = document.querySelector("#numero");
const aviso = document.querySelector("#aviso");
const listaItens = document.querySelector("#itens");
const totalElemento = document.querySelector("#total");
const valorPix = document.querySelector("#valor-pix");
const botaoPix = document.querySelector("#simular-pagamento");
const statusPagamento = document.querySelector("#status-pagamento");
const qrCode = document.querySelector("#qr-code");
const pixCodigo = document.querySelector("#pix-codigo");
const btnCopiarPix = document.querySelector("#btn-copiar-pix");
const contadorTempo = document.querySelector("#contador-tempo");
const blocoCronometro = document.querySelector("#bloco-cronometro");
const subtotalPedido = document.querySelector("#subtotal-pedido");
const fretePedido = document.querySelector("#frete-pedido");
const avisoEmailCliente = document.querySelector("#aviso-email-cliente");
const emailConfirmado = document.querySelector("#email-confirmado");

const API = "http://localhost:3000/api";


let pedidoAtual = null;
let processandoPagamento = false;
let timerInterval = null;

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
// CRONÔMETRO REGRESSIVO PIX (30 MINUTOS)
// ======================================================

function iniciarCronometroPix(expiraEmISO) {
    if (!contadorTempo) return;
    if (timerInterval) clearInterval(timerInterval);

    const dataExpiracao = new Date(expiraEmISO).getTime();

    function atualizarTimer() {
        const agora = Date.now();
        const diferenca = dataExpiracao - agora;

        if (diferenca <= 0) {
            clearInterval(timerInterval);
            contadorTempo.textContent = "00:00 (Expirado)";
            if (blocoCronometro) {
                blocoCronometro.style.background = "#ffebe6";
                blocoCronometro.style.color = "#c53030";
                blocoCronometro.style.borderColor = "#feb2b2";
            }
            if (botaoPix && pedidoAtual?.status !== "Pagamento aprovado") {
                botaoPix.disabled = true;
                botaoPix.textContent = "Pix Expirado";
            }
            return;
        }

        const minutos = Math.floor(diferenca / (1000 * 60));
        const segundos = Math.floor((diferenca % (1000 * 60)) / 1000);
        contadorTempo.textContent = `${String(minutos).padStart(2, "0")}:${String(segundos).padStart(2, "0")}`;
    }

    atualizarTimer();
    timerInterval = setInterval(atualizarTimer, 1000);
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

    if (pagamento.status === "Aprovado" || pedido.status === "Pagamento aprovado") {
        botaoPix.textContent = "✅ Pagamento aprovado";
        botaoPix.disabled = true;
        return;
    }

    botaoPix.textContent = "Simular Pagamento Aprovado (PI2)";
    botaoPix.disabled = false;
}

// ======================================================
// EXIBIR OS DADOS DO PEDIDO
// ======================================================

function renderizarPedido(pedido) {
    pedidoAtual = pedido;

    const statusPedido = pedido.status || "Aguardando pagamento";
    numero.textContent = `Pedido: ${pedido.numero} | Status: ${statusPedido}`;

    listaItens.replaceChildren();

    for (const item of pedido.itens || []) {
        const linha = document.createElement("li");
        const quantidade = Number(item.quantidade) || 1;
        const preco = Number(item.preco) || 0;
        const subtotal = preco * quantidade;

        linha.textContent = `${item.nome} — ${quantidade} × ${formatarPreco(preco)} = ${formatarPreco(subtotal)}`;
        listaItens.appendChild(linha);
    }

    const subtotalCalc = Number(pedido.subtotal ?? (pedido.itens || []).reduce((acc, it) => acc + (it.preco * it.quantidade), 0));
    if (subtotalPedido) {
        subtotalPedido.innerHTML = `<span>Subtotal dos produtos:</span> <strong>${formatarPreco(subtotalCalc)}</strong>`;
    }

    if (fretePedido) {
        if (pedido.frete && Number(pedido.frete.valor) >= 0) {
            const prazoTexto = pedido.frete.prazo > 0 ? ` (Entrega em ${pedido.frete.prazo} dias)` : "";
            fretePedido.innerHTML = `<span>Frete (${pedido.frete.nome}${prazoTexto}):</span> <strong>${formatarPreco(pedido.frete.valor)}</strong>`;
        } else {
            fretePedido.innerHTML = `<span>Frete:</span> <strong>Não informado</strong>`;
        }
    }

    if (avisoEmailCliente && emailConfirmado) {
        const emailCli = pedido.cliente?.email;
        if (emailCli) {
            emailConfirmado.textContent = emailCli;
            avisoEmailCliente.style.display = "block";
        }
    }

    const total = Number(pedido.total) || 0;
    totalElemento.textContent = `Total a pagar: ${formatarPreco(total)}`;
    valorPix.textContent = `Valor a pagar via PIX: ${formatarPreco(total)}`;

    const pagamento = pedido.pagamento || {};


    // Atualiza QR Code dinâmico do Pix gerado pelo backend
    if (pagamento.qr_code_url && qrCode) {
        qrCode.src = pagamento.qr_code_url;
    }

    // Atualiza Código Copia e Cola
    if (pagamento.qr_code && pixCodigo) {
        pixCodigo.value = pagamento.qr_code;
    }

    if (pedido.status === "Cancelado") {
        aviso.textContent = "Este pedido foi cancelado.";
        statusPagamento.textContent = "Pedido cancelado.";
        if (timerInterval) clearInterval(timerInterval);
        if (blocoCronometro) blocoCronometro.style.display = "none";

    } else if (pagamento.status === "Aprovado" || pedido.status === "Pagamento aprovado") {
        aviso.textContent = "Parabéns! O pagamento via PIX foi confirmado com sucesso.";
        statusPagamento.textContent = "✅ Pagamento aprovado no sistema! O pedido entrará em separação.";
        statusPagamento.style.color = "var(--sucesso, #28633d)";
        if (timerInterval) clearInterval(timerInterval);
        if (blocoCronometro) blocoCronometro.style.display = "none";

    } else {
        aviso.textContent = "Seu pedido foi registrado. O QR Code dinâmico abaixo já está pronto para pagamento.";
        statusPagamento.textContent = "Aguardando confirmação do pagamento...";
        statusPagamento.style.color = "var(--secundario, #77776e)";

        if (pagamento.expira_em) {
            iniciarCronometroPix(pagamento.expira_em);
        }
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
        aviso.textContent = "Não encontramos um pedido nesta sessão. Volte ao catálogo para continuar.";
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
            throw new Error(dados.erro || "Não foi possível consultar o pedido.");
        }

        const pedidoServidor = dados.pedido || dados;
        const pedidoCompleto = {
            ...pedidoLocal,
            ...pedidoServidor
        };

        localStorage.setItem("pedido_pendente", JSON.stringify(pedidoCompleto));
        renderizarPedido(pedidoCompleto);

    } catch (erro) {
        console.error("Erro ao consultar pedido:", erro);
        renderizarPedido(pedidoLocal);
        aviso.textContent = "Exibindo os dados salvos neste navegador.";
        atualizarBotaoPagamento(pedidoLocal);
    }
}

// ======================================================
// SIMULAR PAGAMENTO APROVADO
// ======================================================

async function confirmarPagamento() {
    if (!pedidoAtual || processandoPagamento) {
        return;
    }

    if (pedidoAtual.status === "Cancelado") {
        statusPagamento.textContent = "Este pedido foi cancelado.";
        atualizarBotaoPagamento(pedidoAtual);
        return;
    }

    if (pedidoAtual.status === "Pagamento aprovado") {
        statusPagamento.textContent = "O pagamento já está aprovado.";
        atualizarBotaoPagamento(pedidoAtual);
        return;
    }

    processandoPagamento = true;
    botaoPix.disabled = true;
    botaoPix.textContent = "Confirmando pagamento...";
    statusPagamento.textContent = "Processando confirmação do pagamento...";

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
            throw new Error(dados.erro || "Não foi possível confirmar o pagamento.");
        }

        const pedidoAtualizado = dados.pedido || dados;
        pedidoAtual = {
            ...pedidoAtual,
            ...pedidoAtualizado
        };

        localStorage.setItem("pedido_pendente", JSON.stringify(pedidoAtual));
        renderizarPedido(pedidoAtual);

    } catch (erro) {
        console.error("Erro ao confirmar pagamento:", erro);
        statusPagamento.textContent = erro.message || "Erro ao confirmar pagamento.";
        botaoPix.textContent = "Tentar novamente";
        botaoPix.disabled = false;
    } finally {
        processandoPagamento = false;
    }
}

// ======================================================
// EVENTOS DA PÁGINA
// ======================================================

if (botaoPix) {
    botaoPix.addEventListener("click", confirmarPagamento);
    botaoPix.disabled = true;
    botaoPix.textContent = "Carregando pedido...";
}

if (btnCopiarPix && pixCodigo) {
    btnCopiarPix.addEventListener("click", async () => {
        try {
            await navigator.clipboard.writeText(pixCodigo.value);
            const textoOriginal = btnCopiarPix.textContent;
            btnCopiarPix.textContent = "✅ Código Copiado!";
            setTimeout(() => {
                btnCopiarPix.textContent = textoOriginal;
            }, 2500);
        } catch {
            pixCodigo.select();
            document.execCommand("copy");
            btnCopiarPix.textContent = "✅ Código Copiado!";
        }
    });
}

consultarPedido();