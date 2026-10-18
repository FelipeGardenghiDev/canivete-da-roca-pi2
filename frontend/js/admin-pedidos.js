
const API = "http://localhost:3000/api/admin/pedidos";

const lista = document.querySelector("#lista-pedidos");
const busca = document.querySelector("#busca");
const filtroStatus = document.querySelector("#filtro-status");
const mensagem = document.querySelector("#mensagem");
async function verificarAcessoAdmin() {
    const resposta = await fetch("/api/admin/sessao", {
        credentials: "same-origin"
    });

    if (!resposta.ok) {
        window.location.replace("login-admin.html");
        return false;
    }

    return true;
}

let pedidos = [];


const statusDisponiveis = [
    "Aguardando pagamento",
    "Em preparação",
    "Enviado",
    "Entregue",
    "Cancelado"
];


function preco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function texto(elemento, valor) {
    elemento.textContent = valor ?? "";
    return elemento;
}

function criarCelula(linha, conteudo) {
    const celula = document.createElement("td");

    if (conteudo instanceof Node) {
        celula.appendChild(conteudo);
    } else {
        celula.textContent = conteudo ?? "";
    }

    linha.appendChild(celula);
    return celula;
}

function atualizarIndicadores() {
    document.querySelector("#total-pedidos").textContent = pedidos.length;

    document.querySelector("#pendentes").textContent =
        pedidos.filter(p => p.status === "Aguardando pagamento").length;

    document.querySelector("#aprovados").textContent =
        pedidos.filter(p => p.pagamento?.status === "Aprovado").length;

    const total = pedidos.reduce((soma, pedido) => {
        if (pedido.status === "Cancelado") return soma;
        return soma + Math.round(Number(pedido.total || 0) * 100);
    }, 0);

    document.querySelector("#valor-total").textContent = preco(total / 100);
}

function criarSeletorStatus(pedido) {
    const seletor = document.createElement("select");
    seletor.setAttribute("aria-label", `Status do pedido ${pedido.numero}`);

    statusDisponiveis.forEach(status => {
        const opcao = document.createElement("option");
        opcao.value = status;
        opcao.textContent = status;
        opcao.selected = pedido.status === status;
        seletor.appendChild(opcao);
    });

    return seletor;
}

function renderizarPedidos() {
    const termo = busca.value.trim().toLowerCase();
    const status = filtroStatus.value;

    const filtrados = pedidos.filter(pedido => {
        const nome = pedido.cliente?.nome || "";
        const numero = pedido.numero || "";

        return (
            (numero.toLowerCase().includes(termo) ||
             nome.toLowerCase().includes(termo)) &&
            (!status || pedido.status === status)
        );
    });

    lista.replaceChildren();

    if (!filtrados.length) {
        const linha = document.createElement("tr");
        const celula = document.createElement("td");
        celula.colSpan = 7;
        celula.textContent = "Nenhum pedido encontrado.";
        linha.appendChild(celula);
        lista.appendChild(linha);
        return;
    }

    filtrados.forEach(pedido => {
        const linha = document.createElement("tr");

        const data = pedido.criadoEm
            ? new Date(pedido.criadoEm).toLocaleString("pt-BR")
            : "Data não informada";

        const pedidoInfo = document.createElement("div");
        const numero = document.createElement("strong");
        texto(numero, pedido.numero);
        const dataTexto = document.createElement("div");
        texto(dataTexto, data);
        pedidoInfo.append(numero, dataTexto);
        criarCelula(linha, pedidoInfo);

        const cliente = pedido.cliente || {};
        const clienteInfo = document.createElement("div");
        const nome = document.createElement("strong");
        texto(nome, cliente.nome || "Não informado");

        const contato = document.createElement("div");
        texto(contato, cliente.email || "");

        const endereco = document.createElement("div");
        texto(
            endereco,
            [cliente.endereco, cliente.cidade, cliente.estado, cliente.cep]
                .filter(Boolean)
                .join(", ")
        );

        clienteInfo.append(nome, contato, endereco);
        criarCelula(linha, clienteInfo);

        const itens = document.createElement("div");
        itens.className = "detalhes";

        (pedido.itens || []).forEach(item => {
            const detalhe = document.createElement("div");
            texto(
                detalhe,
                `${item.quantidade} × ${item.nome} — ${preco(item.subtotal ?? Number(item.preco || 0) * Number(item.quantidade || 1))}`
            );
            itens.appendChild(detalhe);
        });

        criarCelula(linha, itens);
        criarCelula(linha, preco(pedido.total));

        const pagamento = pedido.pagamento || {};
        criarCelula(
            linha,
            `${pagamento.metodo || "Não definido"} — ${pagamento.status || "Não iniciado"}`
        );

        const seletor = criarSeletorStatus(pedido);
        criarCelula(linha, seletor);

        const botao = document.createElement("button");
        botao.type = "button";
        botao.textContent = "Salvar status";

        botao.addEventListener("click", () => {
            atualizarStatus(pedido.numero, seletor, botao);
        });

        criarCelula(linha, botao);
        lista.appendChild(linha);
    });
}

async function carregarPedidos() {
    mensagem.className = "mensagem";
    mensagem.textContent = "Carregando pedidos...";

    try {
        const resposta = await fetch(API);

        if (!resposta.ok) {
            throw new Error("Não foi possível consultar os pedidos.");
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error("O servidor retornou uma lista inválida.");
        }

        pedidos = dados;
        atualizarIndicadores();
        renderizarPedidos();

        mensagem.textContent = `${pedidos.length} pedido(s) carregado(s).`;
    } catch (erro) {
        console.error(erro);
        mensagem.className = "mensagem erro";
        mensagem.textContent =
            "Erro ao carregar pedidos. Verifique se o servidor está funcionando.";
    }
}

async function atualizarStatus(numero, seletor, botao) {
    const statusAnterior = pedidos.find(p => p.numero === numero)?.status;

    if (!statusAnterior) return;

    botao.disabled = true;
    mensagem.className = "mensagem";
    mensagem.textContent = `Atualizando pedido ${numero}...`;

    try {
        const resposta = await fetch(
            `${API}/${encodeURIComponent(numero)}/status`,
            {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ status: seletor.value })
            }
        );

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Falha ao atualizar o pedido.");
        }

        const indice = pedidos.findIndex(p => p.numero === numero);
        if (indice !== -1) {
            pedidos[indice] = resultado.pedido;
        }

        atualizarIndicadores();
        renderizarPedidos();

        mensagem.className = "mensagem sucesso";
        mensagem.textContent = `Status do pedido ${numero} atualizado.`;
    } catch (erro) {
        console.error(erro);
        mensagem.className = "mensagem erro";
        mensagem.textContent = erro.message;
    } finally {
        botao.disabled = false;
    }
}

busca.addEventListener("input", renderizarPedidos);
filtroStatus.addEventListener("change", renderizarPedidos);

verificarAcessoAdmin()
    .then(autorizado => {
        if (autorizado) carregarPedidos();
    })
    .catch(() => {
        window.location.replace("login-admin.html");
    });
