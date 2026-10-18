const API = "http://localhost:3000/api";

const listaProdutos = document.querySelector("#lista-produtos");
const campoBusca = document.querySelector("#campo-busca");
const formBusca = document.querySelector("#form-busca");
const mensagemResultados = document.querySelector("#mensagem-resultados");
const tituloCatalogo = document.querySelector("#titulo-catalogo");

const botoesCategoria = document.querySelectorAll("[data-categoria]");

let produtos = [];
let categoriaAtual = "todos";

// ======================================================
// CATEGORIAS OFICIAIS DA LOJA
// ======================================================

const CATEGORIAS = {
    todos: "Todos",
    canivetes: "Canivetes",
    bainhas: "Bainhas",
    facas: "Facas",
    strops: "Strops",
    "kits-de-afiacao": "Kits de Afiação",
    "polimento-e-afiacao": "Polimento e Afiação"
};

// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarPreco(valor) {
    const preco = Number(valor);

    if (!Number.isFinite(preco)) {
        return "Preço sob consulta";
    }

    return preco.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function normalizarTexto(texto) {
    return String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();
}

// Converte as diferentes formas de escrever as categorias
// para uma única categoria usada pelos filtros.
function normalizarCategoria(categoria) {
    const valor = normalizarTexto(categoria)
        .replace(/[_]+/g, " ")
        .replace(/[-]+/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    if (!valor || valor === "todos" || valor === "todas") {
        return "todos";
    }

    if (
        valor === "canivete" ||
        valor === "canivetes"
    ) {
        return "canivetes";
    }

    if (
        valor === "bainha" ||
        valor === "bainhas"
    ) {
        return "bainhas";
    }

    if (
        valor === "faca" ||
        valor === "facas"
    ) {
        return "facas";
    }

    if (
        valor === "strop" ||
        valor === "strops" ||
        valor.includes("strop de afiar") ||
        valor.includes("strops de afiar")
    ) {
        return "strops";
    }

    if (
        valor === "kit" ||
        valor === "kits" ||
        valor === "kit de afiacao" ||
        valor === "kits de afiacao" ||
        valor === "kit afiacao" ||
        valor === "kits afiacao" ||
        valor === "afiacao kits"
    ) {
        return "kits-de-afiacao";
    }

    if (
        valor === "polimento" ||
        valor === "afiacao" ||
        valor === "polimento e afiacao" ||
        valor === "afiacao e polimento" ||
        valor === "polimento afiacao"
    ) {
        return "polimento-e-afiacao";
    }

    // Retorna o valor normalizado para categorias futuras.
    return valor.replace(/\s+/g, "-");
}

// ======================================================
// CARRINHO
// ======================================================

function lerCarrinho() {
    try {
        const dados = JSON.parse(
            localStorage.getItem("carrinho") || "[]"
        );

        return Array.isArray(dados) ? dados : [];
    } catch (erro) {
        console.error("Erro ao ler o carrinho:", erro);
        return [];
    }
}

function atualizarContadorCarrinho() {
    const carrinho = lerCarrinho();

    const quantidade = carrinho.reduce((total, item) => {
        return total + Math.max(
            1,
            Math.floor(Number(item.quantidade) || 1)
        );
    }, 0);

    const contador = document.querySelector("#quantidade-carrinho");

    if (contador) {
        contador.textContent = quantidade;
    }
}

function notificarAcessivel(texto) {
    let container = document.querySelector("#notificacao-acessivel");
    if (!container) {
        container = document.createElement("div");
        container.id = "notificacao-acessivel";
        container.setAttribute("role", "status");
        container.setAttribute("aria-live", "polite");
        document.body.appendChild(container);
    }
    container.textContent = texto;
    container.classList.add("ativo");
    clearTimeout(container._timer);
    container._timer = setTimeout(() => {
        container.classList.remove("ativo");
    }, 3500);
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

        atualizarContadorCarrinho();

        notificarAcessivel(`${produto.nome} foi adicionado ao carrinho!`);
    } catch (erro) {
        console.error("Erro ao salvar o carrinho:", erro);

        notificarAcessivel("Não foi possível adicionar o produto ao carrinho.");
    }
}

// ======================================================
// IMAGEM DO PRODUTO
// ======================================================

function criarImagemProduto(produto) {
    const areaImagem = document.createElement("div");
    areaImagem.className = "imagem-produto";

    if (produto.imagem) {
        const imagem = document.createElement("img");

        imagem.src = produto.imagem;
        imagem.alt = `Imagem de ${produto.nome || "produto"}`;
        imagem.loading = "lazy";

        imagem.addEventListener("error", () => {
            areaImagem.replaceChildren(
                document.createTextNode("Imagem indisponível")
            );
        }, { once: true });

        areaImagem.appendChild(imagem);
    } else {
        areaImagem.textContent = "Produto artesanal";
    }

    return areaImagem;
}

// ======================================================
// CARTÃO DO PRODUTO
// ======================================================

function criarCartaoProduto(produto) {
    const cartao = document.createElement("article");
    cartao.className = "produto";

    const link = document.createElement("a");

    link.className = "link-produto";
    link.href = `produto.html?id=${encodeURIComponent(produto.id)}`;

    link.setAttribute(
        "aria-label",
        `Ver detalhes de ${produto.nome || "produto"}`
    );

    const imagem = criarImagemProduto(produto);

    const nome = document.createElement("h3");
    nome.textContent = produto.nome || "Produto sem nome";

    const descricao = document.createElement("p");
    descricao.className = "descricao-produto";
    descricao.textContent =
        produto.descricao || "Produto da Canivete da Roça.";

    const preco = document.createElement("p");
    preco.className = "preco";
    preco.textContent = formatarPreco(produto.preco);

    link.append(imagem, nome, descricao, preco);

    const botao = document.createElement("button");

    botao.type = "button";
    botao.className = "botao-comprar";
    botao.textContent = "Adicionar ao carrinho";

    botao.addEventListener("click", () => {
        adicionarAoCarrinho(produto);
    });

    cartao.append(link, botao);

    return cartao;
}

// ======================================================
// ATUALIZAR OS BOTÕES DE CATEGORIA
// ======================================================

function atualizarBotoesCategoria() {
    const categoriaSelecionada =
        normalizarCategoria(categoriaAtual);

    document.querySelectorAll(".filtro-pill").forEach(botao => {
        const categoriaBotao =
            normalizarCategoria(botao.dataset.categoria);

        const ativo = categoriaBotao === categoriaSelecionada;

        botao.classList.toggle("ativa", ativo);
        botao.setAttribute("aria-pressed", String(ativo));
    });
}

// ======================================================
// FILTRAR E MOSTRAR PRODUTOS
// ======================================================

function mostrarProdutos() {
    if (!listaProdutos) {
        return;
    }

    const termo = normalizarTexto(campoBusca?.value || "");

    const categoriaSelecionada =
        normalizarCategoria(categoriaAtual);

    const filtrados = produtos.filter(produto => {
        const textoProduto = normalizarTexto([
            produto.nome,
            produto.descricao,
            produto.categoria
        ].join(" "));

        const correspondeBusca =
            textoProduto.includes(termo);

        const categoriaProduto =
            normalizarCategoria(produto.categoria);

        const correspondeCategoria =
            categoriaSelecionada === "todos" ||
            categoriaProduto === categoriaSelecionada;

        return correspondeBusca && correspondeCategoria;
    });

    listaProdutos.replaceChildren();

    if (filtrados.length === 0) {
        const aviso = document.createElement("p");

        aviso.textContent = produtos.length
            ? "Nenhum produto encontrado. Experimente outra busca ou categoria."
            : "Ainda não há produtos cadastrados.";

        listaProdutos.appendChild(aviso);
    } else {
        filtrados.forEach(produto => {
            listaProdutos.appendChild(
                criarCartaoProduto(produto)
            );
        });
    }

    if (mensagemResultados) {
        mensagemResultados.textContent =
            `${filtrados.length} produto(s) encontrado(s).`;
    }

    if (tituloCatalogo) {
        if (categoriaSelecionada === "todos") {
            tituloCatalogo.textContent = "Produtos em destaque";
        } else {
            const nomeCategoria =
                CATEGORIAS[categoriaSelecionada] ||
                categoriaAtual;

            tituloCatalogo.textContent =
                `Produtos: ${nomeCategoria}`;
        }
    }

    atualizarBotoesCategoria();
}

// ======================================================
// SELECIONAR CATEGORIA
// ======================================================

function selecionarCategoria(categoria, elementoClicado) {
    categoriaAtual =
        normalizarCategoria(categoria || "todos");

    mostrarProdutos();

    // Ao clicar num cartão de categoria, leva ao catálogo.
    if (
        elementoClicado &&
        elementoClicado.classList.contains("categoria-card")
    ) {
        document.querySelector("#catalogo")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }

    // O botão "Ver todos" também leva ao catálogo.
    if (
        elementoClicado &&
        elementoClicado.classList.contains("home-ver-todos")
    ) {
        document.querySelector("#catalogo")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    }
}

// ======================================================
// CARREGAR PRODUTOS PELA API
// ======================================================

async function carregarProdutos() {
    if (!listaProdutos) {
        return;
    }

    listaProdutos.textContent = "Carregando catálogo...";

    try {
        const resposta = await fetch(`${API}/produtos`);

        if (!resposta.ok) {
            throw new Error(`Erro HTTP ${resposta.status}`);
        }

        const dados = await resposta.json();

        if (!Array.isArray(dados)) {
            throw new Error(
                "A API não retornou uma lista de produtos."
            );
        }

        produtos = dados;

        mostrarProdutos();

    } catch (erro) {
        console.error("Erro ao carregar produtos:", erro);

        listaProdutos.replaceChildren();

        const aviso = document.createElement("p");

        aviso.textContent =
            "Não foi possível carregar o catálogo. Verifique se o servidor Node.js está funcionando.";

        listaProdutos.appendChild(aviso);

        if (mensagemResultados) {
            mensagemResultados.textContent =
                "Falha na conexão com a API.";
        }
    }
}

// ======================================================
// BUSCA
// ======================================================

if (formBusca) {
    formBusca.addEventListener("submit", evento => {
        evento.preventDefault();

        mostrarProdutos();

        document.querySelector("#catalogo")?.scrollIntoView({
            behavior: "smooth",
            block: "start"
        });
    });
}

if (campoBusca) {
    campoBusca.addEventListener("input", mostrarProdutos);
}

// ======================================================
// EVENTOS DOS FILTROS E CARTÕES DE CATEGORIA
// ======================================================

botoesCategoria.forEach(botao => {
    botao.addEventListener("click", evento => {
        evento.preventDefault();

        selecionarCategoria(
            botao.dataset.categoria || "todos",
            botao
        );
    });
});

// ======================================================
// ANO DO RODAPÉ
// ======================================================

const anoAtual = document.querySelector("#ano-atual");

if (anoAtual) {
    anoAtual.textContent = new Date().getFullYear();
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

atualizarContadorCarrinho();
atualizarBotoesCategoria();
carregarProdutos();
