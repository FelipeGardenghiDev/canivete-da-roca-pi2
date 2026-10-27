const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");
require("dotenv").config({ path: path.join(__dirname, ".env") });
const session = require("express-session");
const { criarCobrancaPixPagarme } = require("./pix");
const { calcularFrete } = require("./frete");
const { enviarEmailPedidoCriado, enviarEmailPagamentoAprovado } = require("./email");
const { supabase, supabaseConfigurado } = require("./supabase");

const app = express();
const PORTA = process.env.PORT || 3000;

const ARQUIVO_PEDIDOS = path.join(__dirname, "pedidos.json");
const ARQUIVO_PRODUTOS = path.join(__dirname, "produtos.json");
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

function lerProdutosArquivo() {
    try {
        return lerArquivo(ARQUIVO_PRODUTOS, "produtos");
    } catch {
        return [];
    }
}

function salvarProdutosArquivo(produtos) {
    salvarArquivo(ARQUIVO_PRODUTOS, produtos);
}

// ======================================================
// PRODUTOS (SUPABASE SQL)
// ======================================================

function garantirSupabase() {
    if (!supabaseConfigurado || !supabase) {
        throw new Error(
            "O Supabase não está configurado. Defina SUPABASE_URL e SUPABASE_KEY no arquivo backend/.env."
        );
    }

    return supabase;
}

function gerarSlug(texto, comSufixo = false) {
    const base = String(texto || "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "") || "item";

    if (!comSufixo) {
        return base;
    }

    const sufixo = crypto.randomBytes(2).toString("hex");
    return `${base}-${sufixo}`;
}

async function obterOuCriarCategoriaId(db, categoriaSlugOuNome) {
    const slug = gerarSlug(categoriaSlugOuNome, false);
    const nomeFormatado =
        slug.charAt(0).toUpperCase() + slug.slice(1);

    try {
        const { data: existente } = await db
            .from("categorias")
            .select("id")
            .eq("slug", slug)
            .maybeSingle();

        if (existente && existente.id) {
            return existente.id;
        }

        const { data: criada } = await db
            .from("categorias")
            .insert([{ nome: nomeFormatado, slug }])
            .select("id")
            .single();

        return criada ? criada.id : null;
    } catch {
        return null;
    }
}

function normalizarProduto(produto) {
    const imagemFinal = produto.imagem || produto.imagem_url || "";

    return {
        id: Number(produto.id),
        categoria_id: produto.categoria_id ?? null,
        nome: String(produto.nome || ""),
        slug: String(produto.slug || ""),
        preco: Number(produto.preco),
        categoria: String(produto.categoria || "outros"),
        descricao: String(produto.descricao || ""),
        tipo: String(produto.tipo || "simples"),
        estoque: Number(produto.estoque ?? 0),
        peso_g: Number(produto.peso_g ?? 250),
        altura_cm: Number(produto.altura_cm ?? 5),
        largura_cm: Number(produto.largura_cm ?? 12),
        comprimento_cm: Number(produto.comprimento_cm ?? 22),
        ativo: produto.ativo !== false,
        imagem: imagemFinal,
        imagem_url: imagemFinal
    };
}

async function carregarProdutos() {
    if (supabaseConfigurado && supabase) {
        try {
            const { data, error } = await supabase
                .from("produtos")
                .select("*")
                .order("id", { ascending: true });

            if (!error && Array.isArray(data)) {
                return data.map(normalizarProduto);
            }

            console.warn("[SUPABASE] Falha ao consultar produtos no Supabase, usando produtos.json:", error?.message);
        } catch (err) {
            console.warn("[SUPABASE] Erro ao consultar produtos no Supabase, usando produtos.json:", err.message);
        }
    }

    return lerProdutosArquivo().map(normalizarProduto);
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
// LISTAR, FILTRAR E BUSCAR PRODUTOS (SUPABASE SQL)
// ======================================================

app.get("/api/produtos", async (req, res) => {
    try {
        const { categoria, busca } = req.query;

        let produtos = await carregarProdutos();

        if (categoria && categoria !== "todos") {
            const termoCat = String(categoria).trim().toLowerCase();
            produtos = produtos.filter(produto =>
                String(produto.categoria || "").trim().toLowerCase() === termoCat
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
            erro: erro.message || "Não foi possível carregar os produtos."
        });
    }
});

// ======================================================
// BUSCAR PRODUTO POR ID (SUPABASE SQL)
// ======================================================

app.get("/api/produtos/:id", async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de produto inválido."
            });
        }

        if (supabaseConfigurado && supabase) {
            try {
                const { data, error } = await supabase
                    .from("produtos")
                    .select("*")
                    .eq("id", id)
                    .maybeSingle();

                if (!error && data) {
                    return res.json(normalizarProduto(data));
                }
            } catch (errSupabase) {
                console.warn("[SUPABASE] Falha ao buscar produto por ID no Supabase:", errSupabase.message);
            }
        }

        const produtos = await carregarProdutos();
        const produto = produtos.find(p => Number(p.id) === id);

        if (!produto) {
            return res.status(404).json({
                erro: "Produto não encontrado."
            });
        }

        return res.json(normalizarProduto(produto));
    } catch (erro) {
        console.error("Erro ao buscar produto:", erro);

        return res.status(500).json({
            erro: erro.message || "Não foi possível consultar o produto."
        });
    }
});

// ======================================================
// CADASTRAR PRODUTO NO SUPABASE SQL (PAINEL ADMIN)
// ======================================================

app.post("/api/produtos", exigirAdmin, async (req, res) => {
    try {
        const corpo = req.body || {};
        const {
            nome,
            preco,
            categoria,
            descricao,
            imagem,
            imagem_url,
            tipo,
            estoque,
            peso_g,
            altura_cm,
            largura_cm,
            comprimento_cm,
            ativo
        } = corpo;

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

        const enderecoImagem = validarImagem(imagem || imagem_url);
        const categoriaLimpa = categoria.trim().toLowerCase();

        const estoqueNum =
            estoque !== undefined && estoque !== "" && Number.isFinite(Number(estoque))
                ? Math.max(0, Math.round(Number(estoque)))
                : 10;

        const pesoNum =
            peso_g !== undefined && peso_g !== "" && Number.isFinite(Number(peso_g)) && Number(peso_g) > 0
                ? Math.round(Number(peso_g))
                : 250;

        const alturaNum =
            altura_cm !== undefined && altura_cm !== "" && Number.isFinite(Number(altura_cm)) && Number(altura_cm) > 0
                ? Number(Number(altura_cm).toFixed(2))
                : 5;

        const larguraNum =
            largura_cm !== undefined && largura_cm !== "" && Number.isFinite(Number(largura_cm)) && Number(largura_cm) > 0
                ? Number(Number(largura_cm).toFixed(2))
                : 12;

        const comprimentoNum =
            comprimento_cm !== undefined && comprimento_cm !== "" && Number.isFinite(Number(comprimento_cm)) && Number(comprimento_cm) > 0
                ? Number(Number(comprimento_cm).toFixed(2))
                : 22;

        const dadosNovoProduto = {
            nome: nome.trim(),
            slug: gerarSlug(nome.trim(), true),
            preco: Number(Number(preco).toFixed(2)),
            categoria: categoriaLimpa,
            descricao: typeof descricao === "string"
                ? descricao.trim()
                : "",
            tipo: typeof tipo === "string" && tipo.trim()
                ? tipo.trim().toLowerCase()
                : "simples",
            estoque: estoqueNum,
            peso_g: pesoNum,
            altura_cm: alturaNum,
            largura_cm: larguraNum,
            comprimento_cm: comprimentoNum,
            imagem: enderecoImagem,
            imagem_url: enderecoImagem,
            ativo: ativo !== false
        };

        if (supabaseConfigurado && supabase) {
            try {
                const categoriaId = await obterOuCriarCategoriaId(supabase, categoriaLimpa);
                dadosNovoProduto.categoria_id = categoriaId;

                const { data: inserido, error } = await supabase
                    .from("produtos")
                    .insert([dadosNovoProduto])
                    .select("*")
                    .single();

                if (error) {
                    throw new Error(error.message);
                }

                const novoProduto = normalizarProduto(inserido);

                // Salvar como backup/espelho em produtos.json
                try {
                    const locais = lerProdutosArquivo();
                    locais.push(novoProduto);
                    salvarProdutosArquivo(locais);
                } catch {}

                return res.status(201).json({
                    mensagem: "Produto cadastrado com sucesso no Supabase!",
                    produto: novoProduto
                });
            } catch (erroSupabase) {
                console.error("[SUPABASE] Falha ao cadastrar no Supabase, salvando localmente:", erroSupabase.message);
            }
        }

        // Modo Local (produtos.json)
        const locais = lerProdutosArquivo();
        const proximoId = locais.length > 0
            ? Math.max(...locais.map(p => Number(p.id) || 0)) + 1
            : 1;

        const novoProduto = normalizarProduto({
            id: proximoId,
            ...dadosNovoProduto
        });

        locais.push(novoProduto);
        salvarProdutosArquivo(locais);

        return res.status(201).json({
            mensagem: "Produto cadastrado com sucesso (modo local)!",
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
// REMOVER PRODUTO NO SUPABASE SQL (PAINEL ADMIN)
// ======================================================

app.delete("/api/produtos/:id", exigirAdmin, async (req, res) => {
    try {
        const id = Number(req.params.id);

        if (!Number.isSafeInteger(id) || id <= 0) {
            return res.status(400).json({
                erro: "ID de produto inválido."
            });
        }

        if (supabaseConfigurado && supabase) {
            try {
                const { error } = await supabase
                    .from("produtos")
                    .delete()
                    .eq("id", id);

                if (error) {
                    throw new Error(error.message);
                }
            } catch (erroSupabase) {
                console.warn("[SUPABASE] Falha ao remover produto no Supabase:", erroSupabase.message);
            }
        }

        const locais = lerProdutosArquivo();
        const filtrados = locais.filter(p => Number(p.id) !== id);
        salvarProdutosArquivo(filtrados);

        return res.json({
            mensagem: "Produto removido com sucesso."
        });
    } catch (erro) {
        console.error("Erro ao remover produto:", erro);

        return res.status(500).json({
            erro: erro.message || "Não foi possível remover o produto."
        });
    }
});

// ======================================================
// CÁLCULO DE FRETE (Melhor Envio Sandbox)
// ======================================================

app.post("/api/frete/calcular", async (req, res) => {
    try {
        const corpo = req.body || {};
        const { cep, itens } = corpo;
        const cepLimpo = String(cep || "").replace(/\D/g, "");

        if (!cepLimpo || cepLimpo.length !== 8) {
            return res.status(400).json({
                erro: "Informe um CEP válido com 8 números para cotação."
            });
        }

        const opcoes = await calcularFrete(cepLimpo, itens);

        return res.json({
            cep: cepLimpo,
            opcoes
        });
    } catch (erro) {
        console.error("Erro ao calcular frete:", erro);

        return res.status(500).json({
            erro: erro.message || "Não foi possível calcular o frete."
        });
    }
});

// ======================================================
// REGISTRAR PEDIDO
// ======================================================

app.post("/api/pedidos", async (req, res) => {
    try {
        const corpo = req.body || {};
        const { cliente, itens, frete: freteInformado } = corpo;

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

        // Os preços e nomes são obtidos do servidor (Supabase).
        const produtosDisponiveis = await carregarProdutos();
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

        // Processamento do frete
        let subtotalProdutosCentavos = totalCentavos;
        let freteCentavos = 0;
        let freteObj = null;

        if (freteInformado && typeof freteInformado === "object" && !Array.isArray(freteInformado)) {
            const valorFreteNum = Number(freteInformado.valor || 0);
            if (Number.isFinite(valorFreteNum) && valorFreteNum >= 0) {
                freteCentavos = Math.round(valorFreteNum * 100);
                freteObj = {
                    id: freteInformado.id || null,
                    nome: String(freteInformado.nome || "Frete Padrão").slice(0, 80),
                    transportadora: String(freteInformado.transportadora || "").slice(0, 60),
                    servico: String(freteInformado.servico || "").slice(0, 60),
                    valor: freteCentavos / 100,
                    prazo: Number(freteInformado.prazo || 0),
                    foto: freteInformado.foto || null
                };
            }
        }

        const totalFinalCentavos = subtotalProdutosCentavos + freteCentavos;

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
            subtotal: subtotalProdutosCentavos / 100,
            frete: freteObj,
            total: totalFinalCentavos / 100,
            criadoEm: new Date().toISOString(),
            status: "Aguardando pagamento",
            pagamento: await criarCobrancaPixPagarme({
                pedidoNumero: numero,
                valor: totalFinalCentavos / 100,
                clienteNome: nome
            })
        };

        pedidos.push(pedido);
        salvarPedidos(pedidos);

        // Persistência em Supabase SQL (se configurado)
        if (supabaseConfigurado && supabase) {
            try {
                const dadosPedidoDb = {
                    codigo: pedido.numero,
                    cliente_nome: nome,
                    cliente_cpf: cliente.cpf ? String(cliente.cpf).replace(/\D/g, "").slice(0, 14) : "",
                    cliente_email: email,
                    cliente_telefone: telefone.slice(0, 20),
                    endereco_cep: cep.slice(0, 9),
                    endereco_rua: endereco.slice(0, 255),
                    endereco_numero: String(cliente.numero || "").slice(0, 50),
                    endereco_complemento: String(complemento || "").slice(0, 100),
                    endereco_bairro: String(cliente.bairro || "").slice(0, 100),
                    endereco_cidade: cidade.slice(0, 100),
                    endereco_estado: estado.slice(0, 2),
                    valor_produtos: pedido.subtotal,
                    valor_frete: pedido.frete ? Number(pedido.frete.valor || 0) : 0,
                    valor_total: pedido.total,
                    transportadora: pedido.frete ? String(pedido.frete.transportadora || pedido.frete.nome || "").slice(0, 100) : "",
                    servico_frete_id: pedido.frete?.id ? String(pedido.frete.id).slice(0, 50) : "",
                    prazo_frete_dias: pedido.frete?.prazo ? Number(pedido.frete.prazo) : null,
                    status: pedido.status,
                    pagarme_order_id: pedido.pagamento?.cobranca_id || pedido.pagamento?.transacao_id || null,
                    pix_qr_code_url: pedido.pagamento?.qr_code_url || null,
                    pix_copia_cola: pedido.pagamento?.qr_code || null,
                    expira_em: pedido.pagamento?.expira_em || null
                };

                const { data: pedidoDb, error: erroPedido } = await supabase
                    .from("pedidos")
                    .insert([dadosPedidoDb])
                    .select("id")
                    .single();

                if (erroPedido) {
                    console.error("[SUPABASE] Erro ao gravar pedido:", erroPedido.message);
                } else if (pedidoDb && pedidoDb.id) {
                    const itensDb = itensPedido.map(item => ({
                        pedido_id: pedidoDb.id,
                        produto_id: item.id,
                        produto_nome: item.nome,
                        quantidade: item.quantidade,
                        preco_unitario: item.preco,
                        subtotal: item.subtotal
                    }));

                    const { error: erroItens } = await supabase
                        .from("pedido_itens")
                        .insert(itensDb);

                    if (erroItens) {
                        console.error("[SUPABASE] Erro ao gravar itens do pedido:", erroItens.message);
                    }

                    // Decrementar estoque no Supabase
                    for (const item of itensPedido) {
                        try {
                            const { data: prodDb } = await supabase
                                .from("produtos")
                                .select("estoque")
                                .eq("id", item.id)
                                .maybeSingle();

                            if (prodDb && typeof prodDb.estoque === "number") {
                                const novoEstoque = Math.max(0, prodDb.estoque - item.quantidade);
                                await supabase
                                    .from("produtos")
                                    .update({ estoque: novoEstoque })
                                    .eq("id", item.id);
                            }
                        } catch (erroEstoque) {
                            console.error(`[SUPABASE] Falha ao atualizar estoque do produto ${item.id}:`, erroEstoque.message);
                        }
                    }
                }
            } catch (erroDb) {
                console.error("[SUPABASE] Falha ao persistir pedido no Supabase:", erroDb.message);
            }
        }

        // Disparo assíncrono de confirmação de pedido por e-mail com Pix
        enviarEmailPedidoCriado(pedido).catch(erroEmail => {
            console.error("[EMAIL] Erro no envio assíncrono do pedido criado:", erroEmail.message);
        });

        return res.status(201).json({
            mensagem: "Pedido registrado com sucesso. Aguardando pagamento via PIX.",
            pedido: {
                numero: pedido.numero,
                itens: pedido.itens,
                subtotal: pedido.subtotal,
                frete: pedido.frete,
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
app.get("/api/admin/pedidos", exigirAdmin, async (req, res) => {
    try {
        if (supabaseConfigurado && supabase) {
            try {
                const { data: pedidosDb, error: erroDb } = await supabase
                    .from("pedidos")
                    .select(`
                        *,
                        pedido_itens (*)
                    `)
                    .order("created_at", { ascending: false });

                if (!erroDb && Array.isArray(pedidosDb)) {
                    const formatados = pedidosDb.map(p => ({
                        numero: p.codigo || `PED-${p.id}`,
                        criadoEm: p.created_at,
                        cliente: {
                            nome: p.cliente_nome,
                            cpf: p.cliente_cpf,
                            email: p.cliente_email,
                            telefone: p.cliente_telefone,
                            cep: p.endereco_cep,
                            endereco: p.endereco_rua,
                            numero: p.endereco_numero,
                            complemento: p.endereco_complemento,
                            bairro: p.endereco_bairro,
                            cidade: p.endereco_cidade,
                            estado: p.endereco_estado
                        },
                        itens: (p.pedido_itens || []).map(i => ({
                            id: i.produto_id,
                            nome: i.produto_nome,
                            preco: Number(i.preco_unitario),
                            quantidade: Number(i.quantidade),
                            subtotal: Number(i.subtotal)
                        })),
                        subtotal: Number(p.valor_produtos || 0),
                        frete: p.valor_frete ? {
                            transportadora: p.transportadora,
                            valor: Number(p.valor_frete),
                            prazo: p.prazo_frete_dias,
                            rastreio: p.rastreio_codigo
                        } : null,
                        total: Number(p.valor_total || 0),
                        status: p.status,
                        pagamento: {
                            metodo: "PIX",
                            status: p.status === "Pagamento aprovado" ? "Aprovado" : "Aguardando pagamento",
                            cobranca_id: p.pagarme_order_id,
                            qr_code: p.pix_copia_cola,
                            qr_code_url: p.pix_qr_code_url,
                            expira_em: p.expira_em
                        }
                    }));

                    return res.json(formatados);
                }

                console.warn("[SUPABASE] Falha ao listar pedidos no Supabase, usando pedidos.json:", erroDb?.message);
            } catch (erroSupabase) {
                console.warn("[SUPABASE] Erro ao buscar pedidos no Supabase, usando pedidos.json:", erroSupabase.message);
            }
        }

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
app.patch("/api/admin/pedidos/:numero/status", exigirAdmin, async (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const status = req.body?.status;

        if (!STATUS_PEDIDOS.includes(status)) {
            return res.status(400).json({
                erro: "Status informado inválido."
            });
        }

        if (status === "Pagamento aprovado") {
            return res.status(400).json({
                erro: "A aprovação de pagamento exige confirmação válida do provedor."
            });
        }

        const pedidos = carregarPedidos();
        const pedido = encontrarPedido(pedidos, numero);

        if (pedido) {
            if (pedido.status === "Cancelado" && status !== "Cancelado") {
                return res.status(400).json({
                    erro: "Pedido cancelado não pode ter o status alterado."
                });
            }

            pedido.status = status;
            salvarPedidos(pedidos);
        }

        if (supabaseConfigurado && supabase) {
            try {
                await supabase
                    .from("pedidos")
                    .update({
                        status,
                        updated_at: new Date().toISOString()
                    })
                    .eq("codigo", numero);
            } catch (errSupabase) {
                console.warn("[SUPABASE] Falha ao atualizar status do pedido no Supabase:", errSupabase.message);
            }
        }

        if (!pedido && (!supabaseConfigurado || !supabase)) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        return res.json({
            mensagem: "Status atualizado com sucesso.",
            pedido: pedido || { numero, status }
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

app.get("/api/pedidos/:numero/pagamento", async (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const pedidos = carregarPedidos();
        let pedido = encontrarPedido(pedidos, numero);

        if (!pedido && supabaseConfigurado && supabase) {
            try {
                const { data: pDb } = await supabase
                    .from("pedidos")
                    .select("*, pedido_itens(*)")
                    .eq("codigo", numero)
                    .maybeSingle();

                if (pDb) {
                    pedido = {
                        numero: pDb.codigo,
                        criadoEm: pDb.created_at,
                        cliente: {
                            nome: pDb.cliente_nome,
                            cpf: pDb.cliente_cpf,
                            email: pDb.cliente_email,
                            telefone: pDb.cliente_telefone,
                            cep: pDb.endereco_cep,
                            endereco: pDb.endereco_rua,
                            numero: pDb.endereco_numero,
                            complemento: pDb.endereco_complemento,
                            bairro: pDb.endereco_bairro,
                            cidade: pDb.endereco_cidade,
                            estado: pDb.endereco_estado
                        },
                        itens: (pDb.pedido_itens || []).map(i => ({
                            id: i.produto_id,
                            nome: i.produto_nome,
                            preco: Number(i.preco_unitario),
                            quantidade: Number(i.quantidade),
                            subtotal: Number(i.subtotal)
                        })),
                        subtotal: Number(pDb.valor_produtos || 0),
                        frete: pDb.valor_frete ? {
                            transportadora: pDb.transportadora,
                            valor: Number(pDb.valor_frete),
                            prazo: pDb.prazo_frete_dias
                        } : null,
                        total: Number(pDb.valor_total || 0),
                        status: pDb.status,
                        pagamento: {
                            metodo: "PIX",
                            status: pDb.status === "Pagamento aprovado" ? "Aprovado" : "Aguardando pagamento",
                            cobranca_id: pDb.pagarme_order_id,
                            qr_code: pDb.pix_copia_cola,
                            qr_code_url: pDb.pix_qr_code_url,
                            expira_em: pDb.expira_em
                        }
                    };
                }
            } catch (errSupabase) {
                console.warn("[SUPABASE] Falha ao consultar pedido no Supabase:", errSupabase.message);
            }
        }

        if (!pedido) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        // Se o pedido ainda não tiver o QR Code do Pix, gera na hora
        if (!pedido.pagamento || !pedido.pagamento.qr_code) {
            pedido.pagamento = await criarCobrancaPixPagarme({
                pedidoNumero: pedido.numero,
                valor: pedido.total,
                clienteNome: pedido.cliente?.nome
            });
            salvarPedidos(pedidos);

            if (supabaseConfigurado && supabase) {
                try {
                    await supabase
                        .from("pedidos")
                        .update({
                            pix_qr_code_url: pedido.pagamento?.qr_code_url || null,
                            pix_copia_cola: pedido.pagamento?.qr_code || null,
                            expira_em: pedido.pagamento?.expira_em || null,
                            pagarme_order_id: pedido.pagamento?.cobranca_id || pedido.pagamento?.transacao_id || null
                        })
                        .eq("codigo", numero);
                } catch {}
            }
        }

        return res.json({
            numero: pedido.numero,
            itens: pedido.itens || [],
            subtotal: pedido.subtotal ?? pedido.total,
            frete: pedido.frete || null,
            total: pedido.total,
            status: pedido.status,
            pagamento: pedido.pagamento
        });
    } catch (erro) {
        console.error("Erro ao consultar pagamento:", erro);

        return res.status(500).json({
            erro: "Não foi possível consultar o pagamento."
        });
    }
});

// ======================================================
// SIMULAR APROVAÇÃO DO PAGAMENTO PIX (Pagar.me v5)
// ======================================================

app.post("/api/pedidos/:numero/pagamento/simular", async (req, res) => {
    try {
        const numero = String(req.params.numero || "").trim();
        const pedidos = carregarPedidos();
        const pedido = encontrarPedido(pedidos, numero);

        if (!pedido && (!supabaseConfigurado || !supabase)) {
            return res.status(404).json({
                erro: "Pedido não encontrado."
            });
        }

        if (pedido && pedido.status === "Cancelado") {
            return res.status(400).json({
                erro: "Este pedido foi cancelado."
            });
        }

        if (pedido) {
            pedido.pagamento = {
                ...(pedido.pagamento || {}),
                status: "Aprovado",
                confirmadoEm: new Date().toISOString()
            };

            pedido.status = "Pagamento aprovado";
            salvarPedidos(pedidos);
        }

        if (supabaseConfigurado && supabase) {
            try {
                await supabase
                    .from("pedidos")
                    .update({
                        status: "Pagamento aprovado",
                        updated_at: new Date().toISOString()
                    })
                    .eq("codigo", numero);
            } catch (errSupabase) {
                console.warn("[SUPABASE] Falha ao atualizar pagamento no Supabase:", errSupabase.message);
            }
        }

        // Disparo assíncrono de e-mail de pagamento aprovado
        if (pedido) {
            enviarEmailPagamentoAprovado(pedido).catch(erroEmail => {
                console.error("[EMAIL] Erro no envio assíncrono do pagamento aprovado:", erroEmail.message);
            });
        }

        return res.json({
            mensagem: "Pagamento aprovado com sucesso via simulação PI2.",
            pedido: pedido ? {
                numero: pedido.numero,
                itens: pedido.itens || [],
                subtotal: pedido.subtotal ?? pedido.total,
                frete: pedido.frete || null,
                total: pedido.total,
                status: pedido.status,
                pagamento: pedido.pagamento
            } : {
                numero,
                status: "Pagamento aprovado"
            }
        });
    } catch (erro) {
        console.error("Erro ao confirmar pagamento:", erro);

        return res.status(500).json({
            erro: "Não foi possível confirmar o pagamento."
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