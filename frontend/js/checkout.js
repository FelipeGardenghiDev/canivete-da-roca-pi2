const API = "http://localhost:3000/api";

const resumo = document.querySelector("#resumo");
const formulario = document.querySelector("#form-checkout");
const mensagem = document.querySelector("#mensagem");
const botaoConfirmar = document.querySelector("#confirmar-pedido");
const opcoesFreteLista = document.querySelector("#opcoes-frete-lista");

let enviandoPedido = false;
let produtosCarregados = [];
let opcaoFreteSelecionada = null;
let cotandoFrete = false;

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

function renderizarResumo() {
    if (!resumo) return;

    if (produtosCarregados.length === 0) {
        resumo.innerHTML = `
            <p>Seu carrinho está vazio.</p>
            <a href="index.html">Voltar à loja</a>
        `;
        if (botaoConfirmar) botaoConfirmar.disabled = true;
        return;
    }

    const subtotal = produtosCarregados.reduce(
        (soma, item) => soma + item.subtotal,
        0
    );

    const valorFrete = opcaoFreteSelecionada ? Number(opcaoFreteSelecionada.valor || 0) : 0;
    const total = subtotal + valorFrete;

    resumo.innerHTML = `
        <h3>Resumo do pedido</h3>

        <div class="checkout-itens">
            ${produtosCarregados.map(item => `
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

        <div class="checkout-subtotal" style="display: flex; justify-content: space-between; margin-top: 14px; padding-top: 10px; border-top: 1px solid var(--borda);">
            <span>Subtotal dos produtos</span>
            <span>${formatarPreco(subtotal)}</span>
        </div>

        <div class="checkout-frete-linha" style="display: flex; justify-content: space-between; margin-top: 6px; color: ${opcaoFreteSelecionada ? 'var(--texto)' : 'var(--secundario)'}; font-size: 13px;">
            <span>Frete (${opcaoFreteSelecionada ? escaparHTML(opcaoFreteSelecionada.nome) : 'Não calculado'})</span>
            <span>${opcaoFreteSelecionada ? formatarPreco(valorFrete) : '--'}</span>
        </div>

        <div class="checkout-total" style="display: flex; justify-content: space-between; margin-top: 12px; padding-top: 10px; border-top: 2px solid var(--borda); font-size: 16px;">
            <strong>Total a pagar</strong>
            <strong style="color: var(--oliva-escuro); font-size: 18px;">${formatarPreco(total)}</strong>
        </div>
    `;

    if (botaoConfirmar) {
        botaoConfirmar.disabled = false;
    }
}

async function carregarResumoProdutos() {
    if (!resumo) return;

    const itens = obterItens();

    if (itens.length === 0) {
        produtosCarregados = [];
        renderizarResumo();
        return;
    }

    resumo.innerHTML = "<p>Carregando resumo do pedido...</p>";

    try {
        const resultados = await Promise.all(
            itens.map(async item => {
                const resposta = await fetch(`${API}/produtos/${item.id}`);

                if (!resposta.ok) {
                    throw new Error("Não foi possível consultar um produto.");
                }

                const produto = await resposta.json();
                const preco = Number(produto.preco);

                if (!produto.id || !Number.isFinite(preco) || preco < 0) {
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

        produtosCarregados = resultados;
        renderizarResumo();

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
            ?.addEventListener("click", carregarResumoProdutos);

        if (botaoConfirmar) {
            botaoConfirmar.disabled = true;
        }
    }
}

// ======================================================
// COTAÇÃO DE FRETE (Melhor Envio Sandbox)
// ======================================================

async function cotarFrete(cep) {
    if (!opcoesFreteLista) return;

    const cepLimpo = String(cep || "").replace(/\D/g, "");

    if (cepLimpo.length !== 8) {
        opcoesFreteLista.innerHTML = `
            <div class="frete-placeholder">Digite seu CEP acima para carregar o frete e prazos.</div>
        `;
        opcaoFreteSelecionada = null;
        renderizarResumo();
        return;
    }

    if (cotandoFrete) return;
    cotandoFrete = true;

    opcoesFreteLista.innerHTML = `
        <div class="frete-placeholder">Calculando frete no Melhor Envio Sandbox...</div>
    `;

    try {
        const itens = obterItens();

        const resposta = await fetch(`${API}/frete/calcular`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                cep: cepLimpo,
                itens
            })
        });

        const dados = await resposta.json().catch(() => ({}));

        if (!resposta.ok) {
            throw new Error(dados.erro || "Falha ao calcular opções de frete.");
        }

        const opcoes = Array.isArray(dados.opcoes) ? dados.opcoes : [];

        if (opcoes.length === 0) {
            opcoesFreteLista.innerHTML = `
                <div class="frete-placeholder">Nenhuma opção de envio disponível para este trecho no Sandbox.</div>
            `;
            opcaoFreteSelecionada = null;
            renderizarResumo();
            return;
        }

        // Seleciona a primeira opção por padrão (mais econômica)
        opcaoFreteSelecionada = opcoes[0];

        opcoesFreteLista.innerHTML = opcoes.map((op, index) => {
            const selecionado = index === 0;
            return `
                <label class="frete-card ${selecionado ? 'selecionado' : ''}" data-index="${index}">
                    <div class="frete-card-info">
                        <input type="radio" name="opcao_frete" value="${op.id}" ${selecionado ? 'checked' : ''}>
                        ${op.foto ? `<img src="${escaparHTML(op.foto)}" alt="${escaparHTML(op.transportadora)}">` : ''}
                        <div class="frete-card-dados">
                            <span class="frete-card-nome">${escaparHTML(op.nome)}</span>
                            <span class="frete-card-prazo">${op.prazo > 0 ? `Entrega em até ${op.prazo} dias úteis` : 'Prazo estimado'}</span>
                        </div>
                    </div>
                    <span class="frete-card-valor">${formatarPreco(op.valor)}</span>
                </label>
            `;
        }).join("");

        // Vincula evento de troca de opção
        opcoesFreteLista.querySelectorAll(".frete-card").forEach(card => {
            card.addEventListener("click", () => {
                const idx = Number(card.dataset.index);
                opcaoFreteSelecionada = opcoes[idx];

                opcoesFreteLista.querySelectorAll(".frete-card").forEach(c => c.classList.remove("selecionado"));
                card.classList.add("selecionado");
                const radio = card.querySelector('input[type="radio"]');
                if (radio) radio.checked = true;

                renderizarResumo();
            });
        });

        renderizarResumo();

    } catch (erro) {
        console.error("Erro na cotação de frete:", erro);
        opcoesFreteLista.innerHTML = `
            <div class="frete-placeholder" style="color: #c53030;">Não foi possível cotar o frete no momento. (${escaparHTML(erro.message)})</div>
        `;
        opcaoFreteSelecionada = null;
        renderizarResumo();
    } finally {
        cotandoFrete = false;
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
    if (resto === 10 || resto === 11) resto = 0;
    if (resto !== Number(cpf[9])) return false;

    soma = 0;
    for (let i = 0; i < 10; i++) {
        soma += Number(cpf[i]) * (11 - i);
    }

    resto = (soma * 10) % 11;
    if (resto === 10 || resto === 11) resto = 0;

    return resto === Number(cpf[10]);
}

// ======================================================
// ENVIAR PEDIDO
// ======================================================

async function enviarPedido(evento) {
    evento.preventDefault();

    if (enviandoPedido) return;

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

    if (!opcaoFreteSelecionada) {
        mostrarMensagem("Por favor, selecione uma opção de frete para continuar.");
        return;
    }

    enviandoPedido = true;

    if (botaoConfirmar) {
        botaoConfirmar.disabled = true;
        botaoConfirmar.textContent = "Processando pedido com Pix e Frete...";
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
                itens,
                frete: opcaoFreteSelecionada
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
        localStorage.removeItem("cep_cotado");

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
// CONSULTA DE CEP E ENDEREÇO
// ======================================================

async function consultarCEP() {
    const campoCEP = formulario?.elements.cep;

    if (!campoCEP) return;

    const cep = campoCEP.value.replace(/\D/g, "");

    if (cep.length !== 8) return;

    // Dispara a cotação de frete no Melhor Envio
    cotarFrete(cep);

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
            "Não foi possível consultar o CEP automaticamente. Você pode preencher o endereço manualmente.",
            "info"
        );
    }
}

// ======================================================
// INICIALIZAÇÃO
// ======================================================

const campoCPF = document.querySelector("#cpf");
if (campoCPF) {
    campoCPF.addEventListener("input", function() {
        this.value = aplicarMascaraCPF(this.value);
    });
}

if (formulario) {
    formulario.addEventListener("submit", enviarPedido);
    formulario.elements.cep?.addEventListener("blur", consultarCEP);
    formulario.elements.cep?.addEventListener("change", consultarCEP);
}

// Pré-preenche CEP se foi cotado no carrinho
const cepSalvo = localStorage.getItem("cep_cotado");
if (cepSalvo && formulario?.elements.cep) {
    formulario.elements.cep.value = cepSalvo;
    consultarCEP();
}

carregarResumoProdutos();