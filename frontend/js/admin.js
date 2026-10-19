const API_URL = "/api/produtos";

const formulario = document.querySelector("#form-produto");
const mensagem = document.querySelector("#mensagem");
const botaoCadastrar = document.querySelector("#botao-cadastrar");
const listaAdmin = document.querySelector("#lista-admin");

function formatarPreco(valor) {
    return Number(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function criarImagemAdmin(produto) {
    const endereco =
        produto.imagem ||
        produto.imagem_url ||
        produto.foto ||
        "";

    if (!endereco) return null;

    try {
        const url = new URL(endereco);

        if (!["http:", "https:"].includes(url.protocol)) {
            return null;
        }

        const imagem = document.createElement("img");
        imagem.src = url.href;
        imagem.alt = `Foto de ${produto.nome || "produto"}`;
        imagem.loading = "lazy";

        imagem.onerror = () => imagem.remove();

        return imagem;
    } catch {
        return null;
    }
}

function criarTexto(tag, texto, classe) {
    const elemento = document.createElement(tag);
    elemento.textContent = texto;

    if (classe) {
        elemento.className = classe;
    }

    return elemento;
}

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

async function removerProduto(produto) {
    if (!confirm(`Deseja realmente remover "${produto.nome}" (ID #${produto.id}) do banco Supabase?`)) {
        return;
    }

    try {
        const resposta = await fetch(`${API_URL}/${produto.id}`, {
            method: "DELETE",
            credentials: "same-origin"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Não foi possível remover o produto.");
        }

        mensagem.className = "sucesso";
        mensagem.textContent = `Produto "${produto.nome}" (ID #${produto.id}) removido com sucesso!`;
        await carregarProdutos();
    } catch (erro) {
        console.error(erro);
        mensagem.className = "erro";
        mensagem.textContent = `Erro ao remover: ${erro.message}`;
    }
}

async function carregarProdutos() {
    listaAdmin.replaceChildren(
        criarTexto("p", "Carregando produtos do Supabase...")
    );

    try {
        const resposta = await fetch(API_URL, {
            credentials: "same-origin"
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(resultado.erro || "Erro ao consultar os produtos.");
        }

        const produtos = resultado;
        listaAdmin.replaceChildren();

        if (!Array.isArray(produtos) || produtos.length === 0) {
            listaAdmin.appendChild(
                criarTexto("p", "Nenhum produto cadastrado na tabela do Supabase.")
            );
            return;
        }

        produtos.forEach(produto => {
            const card = document.createElement("article");
            card.className = "item-admin";

            const imagem = criarImagemAdmin(produto);

            if (imagem) {
                card.appendChild(imagem);
            }

            card.appendChild(
                criarTexto(
                    "strong",
                    `#${produto.id} — ${produto.nome || "Produto sem nome"}`
                )
            );

            card.appendChild(
                criarTexto(
                    "p",
                    formatarPreco(produto.preco),
                    "preco-admin"
                )
            );

            card.appendChild(
                criarTexto(
                    "p",
                    produto.categoria || "Sem categoria",
                    "categoria-admin"
                )
            );

            card.appendChild(
                criarTexto(
                    "p",
                    `Estoque: ${produto.estoque ?? 0} un. | ${produto.peso_g ?? 250}g (${produto.comprimento_cm ?? 22}×${produto.largura_cm ?? 12}×${produto.altura_cm ?? 5} cm)`,
                    "descricao-admin"
                )
            );

            card.appendChild(
                criarTexto(
                    "p",
                    produto.descricao || "Sem descrição cadastrada.",
                    "descricao-admin"
                )
            );

            const botaoRemover = document.createElement("button");
            botaoRemover.type = "button";
            botaoRemover.textContent = "Remover produto";
            botaoRemover.style.cssText =
                "margin-top: auto; padding: 8px 12px; border: 1px solid #d9b8b4; border-radius: 6px; background: #fff5f4; color: #b42318; font-size: 13px; font-weight: 700; cursor: pointer;";
            botaoRemover.addEventListener("click", () => removerProduto(produto));

            card.appendChild(botaoRemover);
            listaAdmin.appendChild(card);
        });
    } catch (erro) {
        console.error(erro);

        listaAdmin.replaceChildren(
            criarTexto(
                "p",
                `Não foi possível carregar os produtos: ${erro.message}`
            )
        );
    }
}

formulario.addEventListener("submit", async evento => {
    evento.preventDefault();

    const dados = {
        nome: document.querySelector("#nome").value.trim(),
        preco: Number(document.querySelector("#preco").value),
        categoria: document.querySelector("#categoria").value,
        estoque: Number(document.querySelector("#estoque")?.value ?? 10),
        tipo: document.querySelector("#tipo")?.value || "simples",
        peso_g: Number(document.querySelector("#peso_g")?.value ?? 250),
        altura_cm: Number(document.querySelector("#altura_cm")?.value ?? 5),
        largura_cm: Number(document.querySelector("#largura_cm")?.value ?? 12),
        comprimento_cm: Number(document.querySelector("#comprimento_cm")?.value ?? 22),
        descricao: document.querySelector("#descricao").value.trim(),
        imagem: document.querySelector("#imagem").value.trim()
    };

    if (!dados.nome || !dados.categoria || dados.preco <= 0) {
        mensagem.className = "erro";
        mensagem.textContent =
            "Preencha o nome, a categoria e um preço válido.";
        return;
    }

    if (dados.imagem) {
        try {
            const url = new URL(dados.imagem);

            if (!["http:", "https:"].includes(url.protocol)) {
                throw new Error();
            }
        } catch {
            mensagem.className = "erro";
            mensagem.textContent =
                "Informe um endereço de imagem válido.";
            return;
        }
    }

    botaoCadastrar.disabled = true;
    botaoCadastrar.textContent = "Cadastrando...";
    mensagem.className = "";
    mensagem.textContent = "";

    try {
        const resposta = await fetch(API_URL, {
            method: "POST",
            credentials: "same-origin",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(dados)
        });

        const resultado = await resposta.json();

        if (!resposta.ok) {
            throw new Error(
                resultado.erro || "Não foi possível cadastrar."
            );
        }

        mensagem.className = "sucesso";
        mensagem.textContent =
            `Produto "${resultado.produto.nome}" (ID #${resultado.produto.id}) cadastrado com sucesso no Supabase!`;

        formulario.reset();

        const previsualizacao =
            document.querySelector("#previsualizacao");

        if (previsualizacao) {
            previsualizacao.classList.remove("visivel");
        }

        const imagemPreview =
            document.querySelector("#imagem-preview");

        if (imagemPreview) {
            imagemPreview.removeAttribute("src");
        }

        await carregarProdutos();
    } catch (erro) {
        console.error(erro);

        mensagem.className = "erro";
        mensagem.textContent = `Falha no cadastro: ${erro.message}`;
    } finally {
        botaoCadastrar.disabled = false;
        botaoCadastrar.textContent = "Cadastrar produto";
    }
});

verificarAcessoAdmin()
    .then(autorizado => {
        if (autorizado) carregarProdutos();
    })
    .catch(() => {
        window.location.replace("login-admin.html");
    });
