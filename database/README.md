# 🗄️ Database — Canivete da Roça (PI2)

Módulo responsável pela modelagem, scripts DDL, migrations e dados de teste do banco de dados relacional (PostgreSQL hospedado no **Supabase**).

---

## 📁 Conteúdo deste Módulo

* **[`schema.sql`](./schema.sql):** Script DDL com a criação das tabelas sugeridas (`categorias`, `produtos`, `kit_itens`, `avise_me`, `pedidos` e `pedido_itens`).
* **[`seed.sql`](./seed.sql):** Carga inicial de dados para testes, incluindo as categorias do menu superior e produtos exemplares de cutelaria com fotos, dimensões para frete e amarração de kit.

---

## 📋 Passo a Passo para o DBA (Execução no Supabase)

Se esta é a sua primeira vez configurando um banco na nuvem, siga este roteiro:

### 1. Criar o Projeto no Supabase
1. Acesse [supabase.com](https://supabase.com) e entre com sua conta (ou faça login com GitHub/Google).
2. Clique no botão verde **"New Project"**.
3. Escolha um nome para o projeto (ex: `canivete-da-roca`).
4. Defina uma **Database Password** segura e guarde-a.
5. Em **Region**, selecione **South America (São Paulo) — sa-east-1**.
6. Deixe o plano no **Free Tier** e clique em **"Create new project"**. Aguarde 1 a 2 minutos até o banco provisionar.

### 2. Criar as Tabelas e Carga Inicial
1. No menu lateral esquerdo, clique no ícone **SQL Editor** (ou `Ctrl + Shift + S`).
2. Clique em **"New query"**.
3. Abra o arquivo [`schema.sql`](./schema.sql), copie todo o código, cole no editor do Supabase e clique no botão verde **"Run"**. Todas as tabelas serão criadas com sucesso.
4. Crie uma nova query, copie todo o conteúdo de [`seed.sql`](./seed.sql), cole e clique em **"Run"**. Os dados e categorias iniciais serão carregados.

### 3. Criar o Bucket de Fotos (Supabase Storage)
1. No menu lateral esquerdo, clique no ícone **Storage**.
2. Clique em **"New bucket"**.
3. Digite o nome: `produtos` (em letras minúsculas).
4. **IMPORTANTE:** Ative a chavinha **"Public bucket"** (isso permite que as imagens dos produtos apareçam na vitrine da loja sem bloqueio de permissão).
5. Clique em **"Save"**.

### 4. Fornecer as Credenciais para o Backend
1. No menu lateral esquerdo, clique na engrenagem **Project Settings**.
2. Clique na aba **API**.
3. Copie e envie para o time de backend os seguintes dados:
   * **Project URL** (exemplo: `https://abcdefg12345.supabase.co`)
   * **Project API Keys — anon / public** (a chave pública de acesso)

Pronto! Com essas 4 etapas, o banco e o storage estarão 100% operacionais para o projeto.

