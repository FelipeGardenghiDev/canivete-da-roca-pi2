
const API = "http://localhost:3000/api";

const areaProduto = document.querySelector("#detalhe-produto");


function lerCarrinho() {
    try {
        const dados = JSON.parse(
            localStorage.getItem("carrinho") || "[]"
        );

        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error("Erro ao ler carrinho:", erro);
        return [];
    }
}

function atualizarContador() {
    const carrinho = lerCarrinho();

    const quantidade = carrinho.reduce((total, item) => {
        return total + Math.max(
            1,
            Math.floor(Number(item.quantidade) || 1)
        );
    }, 0);

    document.querySelectorAll(
        "#quantidade-carrinho, [data-contador-carrinho]"
    ).forEach(elemento => {
        elemento.textContent = quantidade;
    });
}

function adicionarAoCarrinho(produto) {
    const carrinho = lerCarrinho();

    const existente = carrinho.find(item =>
        Number(item.id) === Number(produto.id)
    );

    if (existente) {
        existente.quantidade = Math.min(
            99,
            (Number(existente.quantidade) || 1) + 1
        );
    } else {
        carrinho.push({
            id: produto.id,
            nome: produto.nome,
            preco: Number(produto.preco),
            quantidade: 1
        });
    }

    try {
        localStorage.setItem(
            "carrinho",
            JSON.stringify(carrinho)
        );

        atualizarContador();
        alert("Produto adicionado ao carrinho!");
    } catch (erro) {
        console.error("Erro ao salvar carrinho:", erro);
        alert("Não foi possível salvar o produto no carrinho.");
    }
}


function criarElemento(tag, classe, texto) {
    const elemento = document.createElement(tag);

    if (classe) {
        elemento.className = classe;
    }

    if (texto !== undefined) {
        elemento.textContent = texto;
    }

    return elemento;
}


async function carregarProduto() {
    // Evita erro se o HTML não tiver esse elemento.
    if (!areaProduto) {
        console.error(
            "Elemento #detalhe-produto não encontrado. Confira o produto.html."
        );
        return;
    }

    const parametros = new URLSearchParams(
        window.location.search
    );

    const id = parametros.get("id");

    if (!id || !/^\d+$/.test(id)) {
        areaProduto.textContent =
            "Produto inválido. Volte ao catálogo e escolha um produto.";
        return;
    }

    areaProduto.textContent = "Carregando produto...";

    try {
        const resposta = await fetch(
            `${API}/produtos/${encodeURIComponent(id)}`
        );

        const dados = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                dados.erro || "Produto não encontrado."
            );
        }

        if (!dados || !dados.id) {
            throw new Error("Os dados do produto são inválidos.");
        }

        areaProduto.replaceChildren();

        // Imagem
        const imagemArea = criarElemento(
            "div",
            "imagem-detalhe"
        );

        if (dados.imagem) {
            const imagem = document.createElement("img");

            imagem.src = dados.imagem;
            imagem.alt = `Imagem de ${dados.nome || "produto"}`;
            imagem.loading = "lazy";

            imagem.addEventListener("error", () => {
                imagemArea.replaceChildren(
                    document.createTextNode("Imagem indisponível")
                );
            }, { once: true });

            imagemArea.appendChild(imagem);
        } else {
            imagemArea.textContent = "Produto artesanal";
        }

        // Informações
        const informacoes = criarElemento(
            "div",
            "informacoes-produto"
        );

        const categoria = criarElemento(
            "p",
            "sobretitulo",
            dados.categoria || "PRODUTO"
        );

        const nome = criarElemento(
            "h1",
            "",
            dados.nome || "Produto sem nome"
        );

        const valorPreco = Number(dados.preco);

const precoFormatado = Number.isFinite(valorPreco)
    ? valorPreco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    })
    : "Preço sob consulta";

const preco = criarElemento(
    "p",
    "preco-detalhe",
    precoFormatado
);

        const descricao = criarElemento(
            "p",
            "",
            dados.descricao || "Descrição não disponível."
        );

        const botao = criarElemento(
            "button",
            "botao botao-principal",
            "Adicionar ao carrinho"
        );

        botao.type = "button";

        botao.addEventListener("click", () => {
            adicionarAoCarrinho(dados);
        });

        informacoes.append(
            categoria,
            nome,
            preco,
            descricao,
            botao
        );

        areaProduto.append(
            imagemArea,
            informacoes
        );

    } catch (erro) {
        console.error("Erro ao carregar produto:", erro);

        areaProduto.textContent =
            "Não foi possível carregar o produto. Confira se o servidor Node.js está funcionando e tente novamente.";
    }
}

// ========================================
// INICIALIZAÇÃO
// ========================================

atualizarContador();
carregarProduto();