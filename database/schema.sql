-- ==========================================================
-- PROJETO INTEGRADOR II (PI2) — CANIVETE DA ROÇA
-- Script DDL completo para criação e atualização no Supabase (PostgreSQL)
-- ==========================================================

-- 1. Tabela de Categorias (para o menu superior e filtros da vitrine)
CREATE TABLE IF NOT EXISTS public.categorias (
    id BIGSERIAL PRIMARY KEY,
    nome VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Tabela de Produtos (Simples e Kits)
CREATE TABLE IF NOT EXISTS public.produtos (
    id BIGSERIAL PRIMARY KEY,
    categoria_id BIGINT REFERENCES public.categorias(id) ON DELETE SET NULL,
    nome VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE,
    descricao TEXT DEFAULT '',
    preco NUMERIC(10, 2) NOT NULL,
    categoria VARCHAR(100) NOT NULL DEFAULT 'outros',
    tipo VARCHAR(50) DEFAULT 'simples' CHECK (tipo IN ('simples', 'kit')),
    estoque INT NOT NULL DEFAULT 10,
    
    -- Dimensões e peso obrigatórios para cálculo de frete no Melhor Envio:
    peso_g INT NOT NULL DEFAULT 250,            -- Peso em gramas
    altura_cm NUMERIC(5, 2) NOT NULL DEFAULT 5,
    largura_cm NUMERIC(5, 2) NOT NULL DEFAULT 12,
    comprimento_cm NUMERIC(5, 2) NOT NULL DEFAULT 22,
    
    -- Imagens: URL pública no Supabase Storage (bucket 'produtos')
    imagem TEXT DEFAULT '',
    imagem_url TEXT DEFAULT '',
    ativo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajustes idempotentes de colunas caso a tabela já tenha sido criada anteriormente:
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria VARCHAR(100) NOT NULL DEFAULT 'outros';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem TEXT DEFAULT '';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem_url TEXT DEFAULT '';
ALTER TABLE public.produtos ALTER COLUMN estoque SET DEFAULT 10;
ALTER TABLE public.produtos ALTER COLUMN peso_g SET DEFAULT 250;
ALTER TABLE public.produtos ALTER COLUMN altura_cm SET DEFAULT 5;
ALTER TABLE public.produtos ALTER COLUMN largura_cm SET DEFAULT 12;
ALTER TABLE public.produtos ALTER COLUMN comprimento_cm SET DEFAULT 22;

-- 3. Tabela de Composição de Kits (para Kits virtuais)
CREATE TABLE IF NOT EXISTS public.kit_itens (
    id BIGSERIAL PRIMARY KEY,
    kit_id BIGINT REFERENCES public.produtos(id) ON DELETE CASCADE,
    produto_id BIGINT REFERENCES public.produtos(id) ON DELETE CASCADE,
    quantidade INT NOT NULL DEFAULT 1
);

-- 4. Tabela de Fila 'Avise-me quando chegar' (Lead de ruptura de estoque)
CREATE TABLE IF NOT EXISTS public.avise_me (
    id BIGSERIAL PRIMARY KEY,
    produto_id BIGINT REFERENCES public.produtos(id) ON DELETE CASCADE,
    nome VARCHAR(150) NOT NULL,
    email VARCHAR(255) NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. Tabela de Pedidos (Guest Checkout - sem necessidade de login com senha)
CREATE TABLE IF NOT EXISTS public.pedidos (
    id BIGSERIAL PRIMARY KEY,
    codigo VARCHAR(50) UNIQUE,
    -- Dados do Comprador
    cliente_nome VARCHAR(200) NOT NULL,
    cliente_cpf VARCHAR(14) DEFAULT '',
    cliente_email VARCHAR(255) NOT NULL,
    cliente_telefone VARCHAR(20),
    
    -- Endereço de Entrega
    endereco_cep VARCHAR(9) NOT NULL,
    endereco_rua VARCHAR(255) NOT NULL,
    endereco_numero VARCHAR(50) DEFAULT '',
    endereco_complemento VARCHAR(100) DEFAULT '',
    endereco_bairro VARCHAR(100) DEFAULT '',
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
    status VARCHAR(50) DEFAULT 'Aguardando pagamento',
    pagarme_order_id VARCHAR(100),
    pagarme_charge_id VARCHAR(100),
    pix_qr_code_url TEXT,
    pix_copia_cola TEXT,
    expira_em TIMESTAMPTZ, -- Validade estrita de 30 min

    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Ajustes idempotentes de colunas caso a tabela de pedidos já tenha sido criada anteriormente:
ALTER TABLE public.pedidos ALTER COLUMN cliente_cpf DROP NOT NULL;
ALTER TABLE public.pedidos ALTER COLUMN endereco_numero DROP NOT NULL;
ALTER TABLE public.pedidos ALTER COLUMN endereco_bairro DROP NOT NULL;
ALTER TABLE public.pedidos ALTER COLUMN endereco_complemento DROP NOT NULL;

-- 6. Itens do Pedido
CREATE TABLE IF NOT EXISTS public.pedido_itens (
    id BIGSERIAL PRIMARY KEY,
    pedido_id BIGINT REFERENCES public.pedidos(id) ON DELETE CASCADE,
    produto_id BIGINT REFERENCES public.produtos(id),
    produto_nome VARCHAR(255) NOT NULL,
    quantidade INT NOT NULL,
    preco_unitario NUMERIC(10, 2) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL
);

-- Índices úteis para performance
CREATE INDEX IF NOT EXISTS idx_produtos_categoria ON public.produtos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_produtos_ativo ON public.produtos(ativo);
CREATE INDEX IF NOT EXISTS idx_pedidos_status ON public.pedidos(status);
CREATE INDEX IF NOT EXISTS idx_pedidos_cpf ON public.pedidos(cliente_cpf);
CREATE INDEX IF NOT EXISTS idx_pedidos_codigo ON public.pedidos(codigo);
CREATE INDEX IF NOT EXISTS idx_pedidos_expira_em ON public.pedidos(expira_em);

-- Recarrega o cache do PostgREST para o Supabase reconhecer as alterações na hora
NOTIFY pgrst, 'reload schema';
