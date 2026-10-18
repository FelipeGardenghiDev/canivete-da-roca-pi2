const API = "http://localhost:3000/api";

const resumo = document.querySelector("#resumo");
const formulario = document.querySelector("#form-checkout");
const mensagem = document.querySelector("#mensagem");
const botaoConfirmar = document.querySelector("#confirmar-pedido");

let enviandoPedido = false;

// ======================================================
// CARRINHO
// ======================================================

function lerCarrinho() {
    try {
        const dados = JSON.parse(localStorage.getItem("carrinho") || "[]");
        return Array.isArray(dados) ? dados : [];
    } catch {
        return [];
    }
}

function obterItens() {
    const carrinho = lerCarrinho();
    const agrupados = new Map();

    for (const item of carrinho) {
        const id = Number(item.id);
        const quantidade = Number(item.quantidade || 1);

        if (!Number.isInteger(id) || id <= 0) continue;
        if (!Number.isInteger(quantidade) || quantidade <= 0) continue;

        agrupados.set(
            id,
            (agrupados.get(id) || 0) + quantidade
        );
    }

    return Array.from(agrupados, ([id, quantidade]) => ({
        id,
        quantidade
    }));
}

// ======================================================
// FORMATAÇÃO
// ======================================================

function formatarPreco(valor) {
    return Number(valor || 0).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL"
    });
}

function escaparHTML(valor) {
    return String(valor ?? "").replace(/[&<>"']/g, caractere => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[caractere]);
}

function mostrarMensagem(texto, tipo = "erro") {
    if (!mensagem) return;

    mensagem.textContent = texto;
    mensagem.className = `mensagem ${tipo}`;
}

// ======================================================
// RESUMO DO PEDIDO
// ======================================================

async function mostrarResumo() {
    if (!resumo) return;

    const itens = obterItens();

    if (itens.length === 0) {
        resumo.innerHTML = `
            <p>Seu carrinho está vazio.</p>
            <a href="index.html">Voltar à loja</a>
        `;

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
        }

        return;
    }

    resumo.innerHTML = "<p>Carregando resumo do pedido...</p>";

    try {
        const resultados = await Promise.all(
            itens.map(async item => {
                const resposta = await fetch(
                    `${API}/produtos/${item.id}`
                );

                if (!resposta.ok) {
                    throw new Error("Não foi possível consultar um produto.");
                }

                const produto = await resposta.json();
                const preco = Number(produto.preco);

                if (
                    !produto.id ||
                    !Number.isFinite(preco) ||
                    preco < 0
                ) {
                    throw new Error("Os dados de um produto são inválidos.");
                }

                return {
                    id: Number(produto.id),
                    nome: produto.nome,
                    preco,
                    quantidade: item.quantidade,
                    subtotal: preco * item.quantidade
                };
            })
        );

        const total = resultados.reduce(
            (soma, item) => soma + item.subtotal,
            0
        );

        resumo.innerHTML = `
            <h3>Resumo do pedido</h3>

            <div class="checkout-itens">
                ${resultados.map(item => `
                    <div class="checkout-item">
                        <div>
                            <strong>${escaparHTML(item.nome)}</strong>
                            <p>Quantidade: ${item.quantidade}</p>
                            <small>${formatarPreco(item.preco)} cada</small>
                        </div>

                        <strong>${formatarPreco(item.subtotal)}</strong>
                    </div>
                `).join("")}
            </div>

            <div class="checkout-total">
                <span>Total dos produtos</span>
                <strong>${formatarPreco(total)}</strong>
            </div>
        `;

        if (botaoConfirmar) {
            botaoConfirmar.disabled = false;
        }

    } catch (erro) {
        console.error("Erro ao carregar resumo:", erro);

        resumo.innerHTML = `
            <p>Não foi possível carregar o resumo do pedido.</p>
            <button type="button" id="tentar-carregar-resumo">
                Tentar novamente
            </button>
        `;

        document
            .querySelector("#tentar-carregar-resumo")
            ?.addEventListener("click", mostrarResumo);

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
        }
    }
}

// ======================================================
// DADOS DO CLIENTE
// ======================================================

function obterDadosCliente() {
    const campoCPF = document.querySelector("#cpf");

    const cpf = campoCPF?.value.trim() || "";

    if (!validarCPF(cpf)) {
        throw new Error("Informe um CPF válido.");
    }

    const dados = {
        cpf: cpf.replace(/\D/g, ""),
        nome: formulario.elements.nome?.value.trim() || "",
        email: formulario.elements.email?.value.trim() || "",
        telefone: formulario.elements.telefone?.value.trim() || "",
        cep: formulario.elements.cep?.value.replace(/\D/g, "") || "",
        endereco: formulario.elements.endereco?.value.trim() || "",
        complemento: formulario.elements.complemento?.value.trim() || "",
        cidade: formulario.elements.cidade?.value.trim() || "",
        estado: formulario.elements.estado?.value.trim().toUpperCase() || ""
    };

    if (!dados.nome || !dados.email || !dados.telefone) {
        throw new Error("Preencha seu nome, e-mail e telefone.");
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(dados.email)) {
        throw new Error("Informe um e-mail válido.");
    }

    if (dados.telefone.replace(/\D/g, "").length < 10) {
        throw new Error("Informe um telefone válido com DDD.");
    }

    if (dados.cep.length !== 8) {
        throw new Error("Informe um CEP válido com 8 números.");
    }

    if (!dados.endereco || !dados.cidade) {
        throw new Error("Preencha o endereço e a cidade.");
    }

    if (!/^[A-Z]{2}$/.test(dados.estado)) {
        throw new Error("Informe a sigla do estado, por exemplo SP.");
    }

    return dados;
}

function aplicarMascaraCPF(valor) {
    return valor
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

function validarCPF(cpf) {
    cpf = String(cpf || "").replace(/\D/g, "");

    if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) {
        return false;
    }

    let soma = 0;

    for (let i = 0; i < 9; i++) {
        soma += Number(cpf[i]) * (10 - i);
    }

    let resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    if (resto !== Number(cpf[9])) {
        return false;
    }

    soma = 0;

    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10) resto = 0;

    return resto === Number(cpf[10]);
}

const campoCPF = document.querySelector("#cpf");

if (campoCPF) {
    campoCPF.addEventListener("input", () => {
        campoCPF.value = aplicarMascaraCPF(campoCPF.value);
    });
}

// ======================================================
// FINALIZAR PEDIDO
// ======================================================

async function enviarPedido(evento) {
    evento.preventDefault();

    if (enviandoPedido) return;

    if (!formulario.reportValidity()) return;

    const itens = obterItens();

    if (itens.length === 0) {
        mostrarMensagem("Seu carrinho está vazio.");
        return;
    }

    let cliente;

    try {
        cliente = obterDadosCliente();
    } catch (erro) {
        mostrarMensagem(erro.message);
        return;
    }

    enviandoPedido = true;

    if (botaoConfirmar) {
        botaoConfirmar.disabled = true;
        botaoConfirmar.textContent = "Processando pedido...";
    }

    mostrarMensagem("Estamos registrando seu pedido...", "info");

    try {
        const resposta = await fetch(`${API}/pedidos`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cliente,
                itens
            })
        });

        const resultado = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(
                resultado.erro ||
                resultado.mensagem ||
                "Não foi possível registrar o pedido."
            );
        }

        if (!resultado.pedido || !resultado.pedido.numero) {
            throw new Error(
                "O servidor não retornou a confirmação do pedido."
            );
        }

        localStorage.setItem(
            "pedido_pendente",
            JSON.stringify(resultado.pedido)
        );

        localStorage.removeItem("carrinho");

        window.location.href = "pedido-confirmado.html";

    } catch (erro) {
        console.error("Erro ao finalizar pedido:", erro);

        mostrarMensagem(
            `${erro.message} Se houver dúvida sobre o registro, confira a área de pedidos antes de tentar novamente.`
        );

        enviandoPedido = false;

        if (botaoConfirmar) {
            botaoConfirmar.disabled = false;
            botaoConfirmar.textContent = "Confirmar pedido";
        }
    }
}

// ======================================================
// CONSULTA DE CEP
// ======================================================

async function consultarCEP() {
    const campoCEP = formulario?.elements.cep;

    if (!campoCEP) return;

    const cep = campoCEP.value.replace(/\D/g, "");

    if (cep.length !== 8) return;

    try {
        const resposta = await fetch(
            `https://viacep.com.br/ws/${cep}/json/`
        );

        if (!resposta.ok) {
            throw new Error("Falha ao consultar o CEP.");
        }

        const dados = await resposta.json();

        if (dados.erro) {
            mostrarMensagem("CEP não encontrado. Confira os números.");
            return;
        }

        const endereco = formulario.elements.endereco;
        const cidade = formulario.elements.cidade;
        const estado = formulario.elements.estado;
        const complemento = formulario.elements.complemento;

        if (endereco && !endereco.value.trim()) {
            endereco.value = dados.logradouro || "";
        }

        if (cidade) {
            cidade.value = dados.localidade || "";
        }

        if (estado) {
            estado.value = dados.uf || "";
        }

        if (complemento && !complemento.value.trim()) {
            complemento.value = dados.complemento || "";
        }

        mostrarMensagem("Endereço consultado com sucesso.", "sucesso");

    } catch (erro) {
        console.error("Erro ao consultar CEP:", erro);
        mostrarMensagem(
            "Não foi possível consultar o CEP. Você pode preencher o endereço manualmente.",
            "info"
        );
    }
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

if (formulario) {
    formulario.addEventListener("submit", enviarPedido);

    formulario.elements.cep?.addEventListener("blur", consultarCEP);
}

mostrarResumo();