-- ======================================================
-- ESTRUTURA COMPLETA DO SUPABASE SQL - CANIVETE DA ROÇA
-- ======================================================

-- 1. Ajusta valores padrão nas colunas obrigatórias de `produtos`
ALTER TABLE public.produtos ALTER COLUMN estoque SET DEFAULT 10;
ALTER TABLE public.produtos ALTER COLUMN peso_g SET DEFAULT 250;
ALTER TABLE public.produtos ALTER COLUMN altura_cm SET DEFAULT 5;
ALTER TABLE public.produtos ALTER COLUMN largura_cm SET DEFAULT 12;
ALTER TABLE public.produtos ALTER COLUMN comprimento_cm SET DEFAULT 22;

-- 2. Garante que as colunas usadas pelo catálogo/admin existam
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS categoria TEXT NOT NULL DEFAULT 'outros';
ALTER TABLE public.produtos ADD COLUMN IF NOT EXISTS imagem TEXT DEFAULT '';

-- 3. Recarrega o cache do PostgREST
NOTIFY pgrst, 'reload schema';
