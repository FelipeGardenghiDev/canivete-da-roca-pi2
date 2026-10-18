
const listaCarrinho = document.querySelector("#lista-carrinho");
const totalCarrinho = document.querySelector("#total-carrinho");
const botaoFinalizar = document.querySelector("#botao-finalizar");

function lerCarrinho() {
    try {
        const dados = JSON.parse(localStorage.getItem("carrinho") || "[]");
        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error("Erro ao ler o carrinho:", erro);
        return [];
    }
}

function salvarCarrinho(carrinho) {
    localStorage.setItem("carrinho", JSON.stringify(carrinho));
}

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function agruparProdutos(carrinho) {
    const agrupados = {};

    carrinho.forEach(function(item) {
        const id = Number(item.id);
        const preco = Number(item.preco);
        const quantidade = Math.max(
            1,
            Math.floor(Number(item.quantidade) || 1)
        );

        if (!Number.isFinite(id) || !Number.isFinite(preco)) {
            return;
        }

        if (agrupados[id]) {
            agrupados[id].quantidade = Math.min(
                99,
                agrupados[id].quantidade + quantidade
            );
        } else {
            agrupados[id] = {
                id: id,
                nome: item.nome || "Produto sem nome",
                preco: preco,
                quantidade: Math.min(99, quantidade)
            };
        }
    });

    return Object.values(agrupados);
}

function mostrarCarrinho() {
    if (!listaCarrinho || !totalCarrinho) {
        console.error("Elementos do carrinho não encontrados.");
        return;
    }

    const produtos = agruparProdutos(lerCarrinho());

    // Salva os dados em um formato consistente.
    salvarCarrinho(produtos);

    listaCarrinho.replaceChildren();

    let total = 0;
    let quantidadeTotal = 0;

    produtos.forEach(function(produto) {
        const item = document.createElement("div");
        item.className = "item-carrinho";

        const nome = document.createElement("h3");
        nome.textContent = produto.nome;

        const preco = document.createElement("p");
        preco.textContent = "Preço unitário: " + formatarPreco(produto.preco);

        const controles = document.createElement("div");
        controles.className = "controle-quantidade";

        const menos = document.createElement("button");
        menos.type = "button";
        menos.className = "menos";
        menos.dataset.id = produto.id;
        menos.textContent = "−";
        menos.setAttribute("aria-label", "Diminuir quantidade");

        const quantidade = document.createElement("span");
        quantidade.textContent = produto.quantidade;

        const mais = document.createElement("button");
        mais.type = "button";
        mais.className = "mais";
        mais.dataset.id = produto.id;
        mais.textContent = "+";
        mais.setAttribute("aria-label", "Aumentar quantidade");

        menos.disabled = produto.quantidade <= 1;
        mais.disabled = produto.quantidade >= 99;

        controles.append(menos, quantidade, mais);

        const subtotal = document.createElement("p");
        subtotal.textContent =
            "Subtotal: " + formatarPreco(produto.preco * produto.quantidade);

        const remover = document.createElement("button");
        remover.type = "button";
        remover.className = "remover";
        remover.dataset.id = produto.id;
        remover.textContent = "Remover";

        item.append(nome, preco, controles, subtotal, remover);
        listaCarrinho.appendChild(item);

        total += produto.preco * produto.quantidade;
        quantidadeTotal += produto.quantidade;
    });

    totalCarrinho.textContent = formatarPreco(total);

    // Atualiza o contador caso exista na página.
    document.querySelectorAll(
        "#quantidade-carrinho, [data-contador-carrinho]"
    ).forEach(function(elemento) {
        elemento.textContent = quantidadeTotal;
    });

    configurarBotoes();
}

function configurarBotoes() {
    document.querySelectorAll(".mais").forEach(function(botao) {
        botao.addEventListener("click", function() {
            alterarQuantidade(Number(botao.dataset.id), 1);
        });
    });

    document.querySelectorAll(".menos").forEach(function(botao) {
        botao.addEventListener("click", function() {
            alterarQuantidade(Number(botao.dataset.id), -1);
        });
    });

    document.querySelectorAll(".remover").forEach(function(botao) {
        botao.addEventListener("click", function() {
            const id = Number(botao.dataset.id);

            const carrinho = agruparProdutos(lerCarrinho())
                .filter(function(produto) {
                    return produto.id !== id;
                });

            salvarCarrinho(carrinho);
            mostrarCarrinho();
        });
    });
}

function alterarQuantidade(id, variacao) {
    const carrinho = agruparProdutos(lerCarrinho());

    const produto = carrinho.find(function(item) {
        return item.id === id;
    });

    if (!produto) return;

    produto.quantidade = Math.max(
        1,
        Math.min(99, produto.quantidade + variacao)
    );

    salvarCarrinho(carrinho);
    mostrarCarrinho();
}

if (botaoFinalizar) {
    botaoFinalizar.addEventListener("click", function() {
        const carrinho = agruparProdutos(lerCarrinho());

        if (carrinho.length === 0) {
            alert("Adicione produtos ao carrinho antes de finalizar.");
            return;
        }

        window.location.href = "checkout.html";
    });
}

mostrarCarrinho();