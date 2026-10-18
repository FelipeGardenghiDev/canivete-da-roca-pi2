const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config();
const session = require("express-session");

const app = express();
const PORTA = process.env.PORT || 3000;

const ARQUIVO_DADOS = path.join(__dirname, "produtos.json");
const ARQUIVO_PEDIDOS = path.join(__dirname, "pedidos.json");
const PASTA_FRONTEND = path.join(__dirname, "../frontend");

const STATUS_PEDIDOS = [
    "Aguardando pagamento",
    "Pagamento aprovado",
    "Em preparação",
    "Enviado",
    "Entregue",
    "Cancelado"
];

app.use(cors({
    origin: "http://localhost:3000",
    credentials: true
}));

app.use(express.json({ limit: "1mb" }));
if (
    !process.env.ADMIN_USER ||
    !process.env.ADMIN_PASSWORD ||
    !process.env.SESSION_SECRET ||
    process.env.ADMIN_PASSWORD === "sua_senha_forte" ||
    process.env.SESSION_SECRET === "sua_chave_aleatoria_longa"
) {
    throw new Error(
        "Configure ADMIN_USER, ADMIN_PASSWORD e SESSION_SECRET no arquivo .env."
    );
}

app.use(session({
    name: "canivete.sid",
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        httpOnly: true,
        sameSite: "strict",
        secure: process.env.NODE_ENV === "production",
        maxAge: 30 * 60 * 1000
    }
}));

// ======================================================
// PROTEGER AS PÁGINAS ADMINISTRATIVAS
// ======================================================

app.use((req, res, next) => {
    const pagina = path.basename(req.path).toLowerCase();

    // Protege admin.html e demais páginas admin*.html.
    const paginaAdministrativa =
        pagina.startsWith("admin") &&
        pagina.endsWith(".html");

    if (
        paginaAdministrativa &&
        (!req.session || req.session.adminAutenticado !== true)
    ) {
        return res.redirect("/login-admin.html");
    }

    next();
});

// Disponibilizar os arquivos públicos do frontend.
app.use(express.static(PASTA_FRONTEND));

// ======================================================
// ARQUIVOS E DADOS
// ======================================================

function garantirArquivo(caminho) {
    if (!fs.existsSync(caminho)) {
        fs.writeFileSync(caminho, "[]", "utf8");
    }
}

function lerArquivo(caminho, descricao) {
    garantirArquivo(caminho);

    const conteudo = fs.readFileSync(caminho, "utf8");
    const dados = JSON.parse(conteudo);

    if (!Array.isArray(dados)) {
        throw new Error(
            `O arquivo de ${descricao} precisa conter uma lista.`
        );
    }

    return dados;
}

function salvarArquivo(caminho, dados) {
    fs.writeFileSync(
        caminho,
        JSON.stringify(dados, null, 2),
        "utf8"
    );
}

// ======================================================
// PRODUTOS
// ======================================================

function carregarProdutos() {
    return lerArquivo(ARQUIVO_DADOS, "produtos").map(produto => ({
        ...produto,
        imagem: produto.imagem || ""
    }));
}

function salvarProdutos(produtos) {
    salvarArquivo(ARQUIVO_DADOS, produtos);
}

function validarImagem(imagem) {
    if (imagem === undefined || imagem === null || imagem === "") {
        return "";
    }

    if (typeof imagem !== "string") {
        throw new Error("O endereço da imagem precisa ser um texto.");
    }

    const endereco = imagem.trim();

    if (!endereco) return "";

    let url;

    try {
        url = new URL(endereco);
    } catch {
        throw new Error("O endereço da imagem não é válido.");
    }

    if (!["http:", "https:"].includes(url.protocol)) {
        throw new Error("A imagem precisa usar HTTP ou HTTPS.");
    }

    return url.href;
}

// ======================================================
// PEDIDOS
// ======================================================

function carregarPedidos() {
    return lerArquivo(ARQUIVO_PEDIDOS, "pedidos");
}

function salvarPedidos(pedidos) {
    salvarArquivo(ARQUIVO_PEDIDOS, pedidos);
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

function gerarNumeroPedido() {
    return `PED-${Date.now()}-${crypto
        .randomBytes(3)
        .toString("hex")
        .toUpperCase()}`;
}

function encontrarPedido(pedidos, numero) {
    return pedidos.find(pedido => pedido.numero === numero);
}

// ======================================================
// ROTA INICIAL
// ======================================================

app.get("/api", (req, res) => {
    res.json({
        mensagem: "API Canivete da Roça funcionando!"
    });
});

// ======================================================
// AUTENTICAÇÃO ADMINISTRATIVA
// ======================================================

function exigirAdmin(req, res, next) {
    if (req.session && req.session.adminAutenticado === true) {
        return next();
    }

    return res.status(401).json({
        erro: "Acesso restrito. Faça login para continuar."
    });
}

app.post("/api/admin/login", (req, res, next) => {
    const usuario = req.body?.usuario;
    const senha = req.body?.senha;

    if (
        typeof usuario !== "string" ||
        typeof senha !== "string" ||
        usuario !== process.env.ADMIN_USER ||
        senha !== process.env.ADMIN_PASSWORD
    ) {
        return res.status(401).json({
            erro: "Usuário ou senha incorretos."
        });
    }

    req.session.regenerate(erro => {
        if (erro) {
            console.error("Erro ao criar sessão:", erro);

            return res.status(500).json({
                erro: "Não foi possível iniciar a sessão."
            });
        }

        req.session.adminAutenticado = true;

        req.session.save(erroAoSalvar => {
            if (erroAoSalvar) {
                console.error("Erro ao salvar sessão:", erroAoSalvar);

                return res.status(500).json({
                    erro: "Não foi possível salvar a sessão."
                });
            }

            return res.json({
                mensagem: "Login realizado com sucesso."
            });
        });
    });
});

app.get("/api/admin/sessao", exigirAdmin, (req, res) => {
    return res.json({ autenticado: true });
});

app.post("/api/admin/logout", exigirAdmin, (req, res) => {
    req.session.destroy(erro => {
        if (erro) {
            console.error("Erro ao encerrar sessão:", erro);

            return res.status(500).json({
                erro: "Não foi possível encerrar a sessão."
            });
        }

        res.clearCookie("canivete.sid", {
            httpOnly: true,
            sameSite: "strict",
            secure: process.env.NODE_ENV === "production"
        });

        return res.json({
            mensagem: "Sessão encerrada."
        });
    });
});

// ======================================================
// LISTAR, FILTRAR E BUSCAR PRODUTOS
// ======================================================

app.get("/api/produtos", (req, res) => {
    try {
        const { categoria, busca } = req.query;
        let produtos = carregarProdutos();

        if (categoria && categoria !== "todos") {
            produtos = produtos.filter(
                produto => produto.categoria === categoria
            );
        }

        if (busca) {
            const termo = String(busca).trim().toLowerCase();

            produtos = produtos.filter(produto =>
                String(produto.nome || "").toLowerCase().includes(termo) ||
                String(produto.descricao || "").toLowerCase().includes(termo)
            );
        }

        return res.json(produtos);
    } catch (erro) {
        console.error("Erro ao listar produtos:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar os produtos."
        });
    }
});

// ======================================================
// BUSCAR PRODUTO POR ID
// ======================================================

app.get("/api/produtos/:id", (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de produto inválido."
            });
        }

        const produto = carregarProdutos().find(
            item => Number(item.id) === id
        );

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        return res.json(produto);
    } catch (erro) {
        console.error("Erro ao buscar produto:", erro);

        return res.status(500).json({
            erro: "Não foi possível consultar o produto."
        });
    }
});

// ======================================================
// CADASTRAR PRODUTO
// ======================================================

app.post("/api/produtos", exigirAdmin, (req, res) => {
    try {
        const corpo = req.body || {};
        const { nome, preco, categoria, descricao, imagem } = corpo;

        if (
            typeof nome !== "string" ||
            !nome.trim() ||
            nome.trim().length > 150 ||
            preco === "" ||
            preco === null ||
            preco === undefined ||
            !Number.isFinite(Number(preco)) ||
            Number(preco) <= 0 ||
            typeof categoria !== "string" ||
            !categoria.trim()
        ) {
            return res.status(400).json({
                erro: "Informe nome, preço positivo e categoria válida."
            });
        }

        const enderecoImagem = validarImagem(imagem);
        const produtos = carregarProdutos();

        const maiorId = produtos.reduce(
            (maior, produto) => Math.max(
                maior,
                Number.isSafeInteger(Number(produto.id))
                    ? Number(produto.id)
                    : 0
            ),
            0
        );

        const novoProduto = {
            id: maiorId + 1,
            nome: nome.trim(),
            preco: Number(Number(preco).toFixed(2)),
            categoria: categoria.trim().toLowerCase(),
            descricao: typeof descricao === "string"
                ? descricao.trim()
                : "",
            imagem: enderecoImagem
        };

        produtos.push(novoProduto);
        salvarProdutos(produtos);

        return res.status(201).json({
            mensagem: "Produto cadastrado com sucesso!",
            produto: novoProduto
        });
    } catch (erro) {
        console.error("Erro ao cadastrar produto:", erro);

        return res.status(400).json({
            erro: erro.message || "Não foi possível cadastrar o produto."
        });
    }
});

// ======================================================
// REGISTRAR PEDIDO
// ======================================================

app.post("/api/pedidos", (req, res) => {
    try {
        const corpo = req.body || {};
        const { cliente, itens } = corpo;

        if (
            !cliente ||
            typeof cliente !== "object" ||
            Array.isArray(cliente)
        ) {
            return res.status(400).json({
                erro: "Os dados do cliente são obrigatórios."
            });
        }

        const camposObrigatorios = [
            "nome",
            "email",
            "telefone",
            "cep",
            "endereco",
            "cidade",
            "estado"
        ];

        for (const campo of camposObrigatorios) {
            if (
                typeof cliente[campo] !== "string" ||
                !cliente[campo].trim()
            ) {
                return res.status(400).json({
                    erro: `Preencha corretamente o campo: ${campo}.`
                });
            }
        }

        const nome = cliente.nome.trim();
        const email = cliente.email.trim().toLowerCase();
        const telefone = cliente.telefone.trim();
        const endereco = cliente.endereco.trim();
        const cidade = cliente.cidade.trim();
        const complemento = cliente.complemento === undefined
            ? ""
            : cliente.complemento;

        if (
            nome.length > 120 ||
            email.length > 160 ||
            !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
            telefone.length > 25 ||
            telefone.replace(/\D/g, "").length < 10 ||
            endereco.length > 200 ||
            cidade.length > 100 ||
            typeof complemento !== "string" ||
            complemento.trim().length > 100
        ) {
            return res.status(400).json({
                erro: "Confira os dados informados."
            });
        }

        const cep = cliente.cep.replace(/\D/g, "");
        const estado = cliente.estado.trim().toUpperCase();

        if (!/^\d{8}$/.test(cep)) {
            return res.status(400).json({
                erro: "O CEP deve conter 8 números."
            });
        }

        if (!/^[A-Z]{2}$/.test(estado)) {
            return res.status(400).json({
                erro: "Informe uma UF válida."
            });
        }

        if (
            !Array.isArray(itens) ||
            itens.length === 0 ||
            itens.length > 100
        ) {
            return res.status(400).json({
                erro: "O pedido precisa conter produtos válidos."
            });
        }

        // Os preços e nomes são obtidos do servidor.
        const produtosDisponiveis = carregarProdutos();
        const itensPedido = [];
        let totalCentavos = 0;

        for (const item of itens) {
            if (!item || typeof item !== "object" || Array.isArray(item)) {
                return res.status(400).json({
                    erro: "Existe um item inválido no pedido."
                });
            }

            const id = Number(item.id);
            const quantidade = Number(item.quantidade);

            if (
                !Number.isSafeInteger(id) ||
                id <= 0 ||
                !Number.isSafeInteger(quantidade) ||
                quantidade < 1 ||
                quantidade > 99
            ) {
                return res.status(400).json({
                    erro: "Produto ou quantidade inválida."
                });
            }

            const produto = produtosDisponiveis.find(
                p => Number(p.id) === id
            );

            if (!produto) {
                return res.status(400).json({
                    erro: `O produto de ID ${id} não está disponível.`
                });
            }

            const preco = Number(produto.preco);

            if (!Number.isFinite(preco) || preco <= 0) {
                return res.status(500).json({
                    erro: "Existe um preço inválido no cadastro de produtos."
                });
            }

            const precoCentavos = Math.round(preco * 100);
            const subtotalCentavos = precoCentavos * quantidade;

            if (
                !Number.isSafeInteger(subtotalCentavos) ||
                !Number.isSafeInteger(totalCentavos + subtotalCentavos)
            ) {
                return res.status(400).json({
                    erro: "O valor total do pedido é inválido."
                });
            }

            totalCentavos += subtotalCentavos;

            itensPedido.push({
                id: produto.id,
                nome: produto.nome,
                preco: precoCentavos / 100,
                quantidade,
                subtotal: subtotalCentavos / 100
            });
        }

        const pedidos = carregarPedidos();
        const numero = gerarNumeroPedido();

        const pedido = {
            numero,
            cliente: {
                nome,
                email,
                telefone,
                cep,
                endereco,
                complemento: complemento.trim(),
                cidade,
                estado
            },
            itens: itensPedido,
            total: totalCentavos / 100,
            criadoEm: new Date().toISOString(),
            status: "Aguardando pagamento",
            pagamento: {
                metodo: null,
                status: "Não iniciado"
            }
        };

        pedidos.push(pedido);
        salvarPedidos(pedidos);

        return res.status(201).json({
            mensagem: "Pedido registrado. O pagamento ainda não foi realizado.",
            pedido: {
                numero: pedido.numero,
                itens: pedido.itens,
                total: pedido.total,
                status: pedido.status,
                pagamento: pedido.pagamento
            }
        });
    } catch (erro) {
        console.error("Erro ao registrar pedido:", erro);

        return res.status(500).json({
            erro: "Não foi possível registrar o pedido."
        });
    }
});

// ======================================================
// ADMINISTRAÇÃO DE PEDIDOS
// ======================================================

// Listar pedidos
app.get("/api/admin/pedidos", exigirAdmin, (req, res) => {
    try {
        const pedidos = carregarPedidos();

        pedidos.sort((a, b) =>
            new Date(b.criadoEm || 0) - new Date(a.criadoEm || 0)
        );

        return res.json(pedidos);
    } catch (erro) {
        console.error("Erro ao listar pedidos:", erro);

        return res.status(500).json({
            erro: "Não foi possível carregar os pedidos."
        });
    }
});

// Atualizar status do pedido
app.patch("/api/admin/pedidos/:numero/status", exigirAdmin, (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const status = req.body?.status;

        if (!STATUS_PEDIDOS.includes(status)) {
            return res.status(400).json({
                erro: "Status informado inválido."
            });
        }

        const pedidos = carregarPedidos();
        const pedido = encontrarPedido(pedidos, numero);

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        if (pedido.status === "Cancelado" && status !== "Cancelado") {
            return res.status(400).json({
                erro: "Pedido cancelado não pode ter o status alterado."
            });
        }

        if (status === "Pagamento aprovado") {
            return res.status(400).json({
                erro: "A aprovação de pagamento exige confirmação válida do provedor."
            });
        }

        pedido.status = status;
        salvarPedidos(pedidos);

        return res.json({
            mensagem: "Status atualizado com sucesso.",
            pedido
        });
    } catch (erro) {
        console.error("Erro ao atualizar pedido:", erro);

        return res.status(500).json({
            erro: "Não foi possível atualizar o pedido."
        });
    }
});

// ======================================================
// CONSULTAR STATUS DO PAGAMENTO
// ======================================================

app.get("/api/pedidos/:numero/pagamento", (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const pedidos = carregarPedidos();
        const pedido = encontrarPedido(pedidos, numero);

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        return res.json({
            numero: pedido.numero,
            itens: pedido.itens || [],
            total: pedido.total,
            status: pedido.status,
            pagamento: pedido.pagamento || {
                metodo: null,
                status: "Não iniciado"
            }
        });
    } catch (erro) {
        console.error("Erro ao consultar pagamento:", erro);

        return res.status(500).json({
            erro: "Não foi possível consultar o pagamento."
        });
    }
});

// ======================================================
// SIMULAR INÍCIO DO PAGAMENTO
// Não cria cobrança nem confirma transação bancária.
// ======================================================

app.post("/api/pedidos/:numero/pagamento/simular", (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const pedidos = carregarPedidos();
        const pedido = encontrarPedido(pedidos, numero);

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        if (pedido.status === "Cancelado") {
            return res.status(400).json({
                erro: "Este pedido foi cancelado."
            });
        }

        if (
            pedido.pagamento?.status === "Aprovado" ||
            pedido.status === "Pagamento aprovado"
        ) {
            return res.json({
                mensagem: "O sistema já registra este pagamento como aprovado.",
                pedido: {
                    numero: pedido.numero,
                    itens: pedido.itens || [],
                    total: pedido.total,
                    status: pedido.status,
                    pagamento: pedido.pagamento
                }
            });
        }

        pedido.pagamento = {
            metodo: "PIX_DEMONSTRATIVO",
            status: "Pendente",
            demonstrativo: true
        };

        pedido.status = "Aguardando pagamento";

        salvarPedidos(pedidos);

        return res.json({
            mensagem: "Simulação iniciada. Nenhum pagamento real foi realizado.",
            pedido: {
                numero: pedido.numero,
                itens: pedido.itens || [],
                total: pedido.total,
                status: pedido.status,
                pagamento: pedido.pagamento
            }
        });
    } catch (erro) {
        console.error("Erro ao iniciar simulação:", erro);

        return res.status(500).json({
            erro: "Não foi possível iniciar a simulação do pagamento."
        });
    }
});

// ======================================================
// INICIAR FLUXO DE PAGAMENTO
// ======================================================

// Esta rota registra a intenção de pagar por PIX.
// Não cria uma cobrança real nem aprova pagamento.
app.post("/api/pedidos/:numero/pagamento/simular", (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const pedidos = carregarPedidos();
        const pedido = encontrarPedido(pedidos, numero);

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        if (pedido.status === "Cancelado") {
            return res.status(400).json({
                erro: "Este pedido foi cancelado."
            });
        }

        if (
            pedido.pagamento?.status === "Aprovado" ||
            pedido.status === "Pagamento aprovado"
        ) {
            return res.json({
                mensagem: "O pagamento já consta como aprovado.",
                pedido
            });
        }

        pedido.pagamento = {
            metodo: "PIX",
            status: "Pendente"
        };

        pedido.status = "Aguardando pagamento";

        salvarPedidos(pedidos);

        return res.json({
            mensagem: "Pedido aguardando confirmação do pagamento.",
            pedido
        });
    } catch (erro) {
        console.error("Erro ao iniciar pagamento:", erro);

        return res.status(500).json({
            erro: "Não foi possível iniciar o pagamento."
        });
    }
});

// ======================================================
// TRATAMENTO DE ERROS
// Deve ficar depois das rotas.
// ======================================================

app.use((erro, req, res, next) => {
    if (res.headersSent) {
        return next(erro);
    }

    if (
        erro instanceof SyntaxError &&
        erro.status === 400 &&
        "body" in erro
    ) {
        return res.status(400).json({
            erro: "O corpo da requisição contém JSON inválido."
        });
    }

    console.error("Erro inesperado:", erro);

    return res.status(500).json({
        erro: "Ocorreu um erro interno no servidor."
    });
});

// ======================================================
// INICIAR SERVIDOR
// ======================================================

app.listen(PORTA, () => {
    console.log(`API funcionando em http://localhost:${PORTA}`);
});