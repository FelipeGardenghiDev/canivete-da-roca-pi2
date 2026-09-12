-- ==========================================================
-- PROJETO INTEGRADOR II (PI2) — CANIVETE DA ROÇA
-- Script DDL para criação das tabelas no Supabase (PostgreSQL)
-- ==========================================================
-- ⚠️ NOTA PARA O DBA DO PROJETO:
-- Este script serve como GUIA / PONTO DE PARTIDA para a modelagem relacional.
-- Você (DBA) tem total liberdade e autonomia para alterar tipos de dados, 
-- criar novas colunas, índices, constraints ou reorganizar as tabelas conforme
-- julgar mais adequado para a evolução do banco de dados do projeto.
-- ==========================================================

-- 1. Tabela de Categorias (para o menu superior e filtros da vitrine)
CREATE TABLE IF NOT EXISTS categorias (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,       -- Ex: 'Canivetes', 'Bainhas', 'Kits', 'Polimento'
    slug VARCHAR(100) UNIQUE NOT NULL, -- Ex: 'canivetes', 'bainhas', 'kits', 'polimento'
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Produtos (Simples e Kits)
CREATE TABLE IF NOT EXISTS produtos (
    id BIGSERIAL PRIMARY KEY,
    categoria_id BIGINT REFERENCES categorias(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    descricao TEXT,
    preco NUMERIC(10, 2) NOT NULL,
    tipo VARCHAR(50) DEFAULT 'simples' CHECK (tipo IN ('simples', 'kit')),
    estoque INT NOT NULL DEFAULT 0,
    
    -- Dimensões e peso obrigatórios para cálculo de frete no Melhor Envio:
    peso_g INT NOT NULL,            -- Peso em gramas (ex: 250)
    altura_cm NUMERIC(5, 2) NOT NULL,
    largura_cm NUMERIC(5, 2) NOT NULL,
    comprimento_cm NUMERIC(5, 2) NOT NULL,
    
    -- Imagens: URL pública gerada pelo bucket no Supabase Storage (ex: bucket 'produtos')
    imagem_url TEXT,
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. Tabela de Composição de Kits (para Kits virtuais)
CREATE TABLE IF NOT EXISTS kit_itens (
    id BIGSERIAL PRIMARY KEY,
    kit_id BIGINT REFERENCES produtos(id) ON DELETE CASCADE,
    produto_id BIGINT REFERENCES produtos(id) ON DELETE CASCADE,
    quantidade INT NOT NULL DEFAULT 1
);

-- 4. Tabela de Fila 'Avise-me quando chegar' (Lead de ruptura de estoque)
CREATE TABLE IF NOT EXISTS avise_me (
    id BIGSERIAL PRIMARY KEY,
    produto_id BIGINT REFERENCES produtos(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Pedidos (Guest Checkout - sem necessidade de login com senha)
CREATE TABLE IF NOT EXISTS pedidos (
    id BIGSERIAL PRIMARY KEY,
    -- Dados do Comprador
    cliente_nome VARCHAR(200) NOT NULL,
    cliente_cpf VARCHAR(14) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(20),
    
    -- Endereço de Entrega
    endereco_cep VARCHAR(9) NOT NULL,
    endereco_rua VARCHAR(255) NOT NULL,
    endereco_numero VARCHAR(50) NOT NULL,
    endereco_complemento VARCHAR(100),
    endereco_bairro VARCHAR(100) NOT NULL,
    endereco_cidade VARCHAR(100) NOT NULL,
    endereco_estado VARCHAR(2) NOT NULL,

    -- Valores Financeiros
    valor_produtos NUMERIC(10, 2) NOT NULL,
    valor_frete NUMERIC(10, 2) NOT NULL,
    valor_total NUMERIC(10, 2) NOT NULL,

    -- Logística (Melhor Envio)
    transportadora VARCHAR(100), -- Ex: Correios PAC, Jadlog .Package
    servico_frete_id VARCHAR(50),
    prazo_frete_dias INT,
    rastreio_codigo VARCHAR(100),

    -- Pagamento Pix (Pagar.me v5)
    status VARCHAR(50) DEFAULT 'AGUARDANDO_PAGAMENTO' 
        CHECK (status IN ('NOVO', 'AGUARDANDO_PAGAMENTO', 'PAGO', 'CANCELADO', 'ENVIADO', 'ENTREGUE')),
    pagarme_order_id VARCHAR(100),
    pagarme_charge_id VARCHAR(100),
    pix_qr_code_url TEXT,
    pix_copia_cola TEXT,
    expira_em TIMESTAMPTZ, -- Validade estrita de 30 min

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Itens do Pedido
CREATE TABLE IF NOT EXISTS pedido_itens (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT REFERENCES pedidos(id) ON DELETE CASCADE,
    produto_id BIGINT REFERENCES produtos(id),
    produto_nome VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Índices úteis para performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cpf ON pedidos(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_pedidos_expira_em ON pedidos(expira_em);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON produtos(ativo);
