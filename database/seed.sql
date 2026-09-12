-- ==========================================================
-- PROJETO INTEGRADOR II (PI2) — CANIVETE DA ROÇA
-- Carga inicial de dados (Seed) para testes
-- ==========================================================
-- ⚠️ NOTA PARA O DBA DO PROJETO:
-- Dados de teste para popular o catálogo inicial e validar as relações.
-- As URLs de imagens aqui são exemplos públicos; ao subir fotos reais no 
-- bucket do Supabase Storage, substitua as URLs abaixo pelos links do bucket.
-- ==========================================================

-- 1. Inserção das Categorias do Menu Superior
INSERT INTO categorias (id, nome, slug)
VALUES
(1, 'Canivetes', 'canivetes'),
(2, 'Bainhas', 'bainhas'),
(3, 'Kits de Afiação', 'kits'),
(4, 'Polimento e Afiação', 'polimento')
ON CONFLICT (id) DO NOTHING;

-- 2. Inserção dos Produtos de Exemplo
INSERT INTO produtos (id, categoria_id, nome, slug, descricao, preco, tipo, estoque, peso_g, altura_cm, largura_cm, comprimento_cm, imagem_url, ativo)
VALUES
(
    1,
    1, -- Categoria: Canivetes
    'Canivete Campeiro Aço Carbono com Cabo em Chifre',
    'canivete-campeiro-aco-carbono',
    'Canivete clássico artesanal com lâmina em aço carbono 1070 de alta retenção de fio e cabo trabalhado em chifre bovino legítimo.',
    139.90,
    'simples',
    15,
    180, -- 180g
    4.0, 6.0, 20.0,
    'https://images.unsplash.com/photo-1590486803833-1c5dc8ddd4c8?w=800',
    true
),
(
    2,
    2, -- Categoria: Bainhas
    'Bainha em Couro Bovino Legítimo com Passador de Cinto',
    'bainha-couro-legitimo-passador',
    'Bainha artesanal costurada à mão em soleta de couro bovino premium. Possui passador reforçado para cinto, ideal para canivetes de até 10cm fechados.',
    49.90,
    'simples',
    20,
    110, -- 110g
    3.0, 5.0, 14.0,
    'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800',
    true
),
(
    3,
    4, -- Categoria: Polimento e Afiação
    'Strop de Couro Bovino Dupla Face para Afiação',
    'strop-de-couro-dupla-face',
    'Assentador de fio artesanal em madeira maciça com couro bovino selecionado em ambas as faces (lado carnal e flor). Indispensável para deixar a navalha com fio cirúrgico.',
    79.90,
    'simples',
    25,
    350, -- 350g
    5.0, 8.0, 38.0,
    'https://images.unsplash.com/photo-1589182373726-e4f658ab50f0?w=800',
    true
),
(
    4,
    4, -- Categoria: Polimento e Afiação
    'Pasta de Polimento Verde Jacaré (Óxido de Cromo)',
    'pasta-polimento-verde-jacare',
    'Pasta abrasiva fina de óxido de cromo especial para aplicação em strops de couro. Proporciona polimento espelhado e acabamento de fio excepcional.',
    34.90,
    'simples',
    40,
    145, -- 145g
    3.0, 4.0, 10.0,
    'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?w=800',
    true
),
(
    5,
    3, -- Categoria: Kits de Afiação
    'Kit Mestre da Afiação (Strop + Pasta Verde + Canivete Campeiro)',
    'kit-mestre-da-afiacao',
    'Combo completo para quem valoriza a lâmina sempre afiada: 1 Canivete Campeiro, 1 Strop Dupla Face e 1 Pasta Verde de Polimento.',
    229.90,
    'kit',
    10,
    675, -- peso acumulado
    8.0, 15.0, 40.0,
    'https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=800',
    true
)
ON CONFLICT (id) DO NOTHING;

-- 3. Amarração dos componentes do Kit (Kit ID 5 é composto pelos itens 1, 3 e 4)
INSERT INTO kit_itens (kit_id, produto_id, quantidade)
VALUES 
(5, 1, 1), -- 1 Canivete
(5, 3, 1), -- 1 Strop
(5, 4, 1)  -- 1 Pasta Verde
ON CONFLICT DO NOTHING;
