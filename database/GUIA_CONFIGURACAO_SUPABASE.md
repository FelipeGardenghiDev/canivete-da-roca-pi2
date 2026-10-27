# 🚀 Guia de Configuração e Ativação do Supabase em Outra Máquina

> **Canivete da Roça — Projeto Integrador II (UNIVESP)**  
> Este guia é o checklist rápido e prático para configurar e ativar a comunicação com o banco de dados Supabase na sua outra máquina de desenvolvimento.

---

## 📋 Checklist Rápido de Configuração

Quando você estiver na sua outra máquina, siga os passos abaixo:

```text
[ ] 1. Atualizar o código local com o repositório remoto (git pull)
[ ] 2. Pegar as credenciais do Supabase no Dashboard
[ ] 3. Configurar as variáveis no arquivo backend/.env
[ ] 4. Rodar o script SQL de tabelas no Supabase (se ainda não tiver rodado)
[ ] 5. Verificar o bucket 'produtos' no Supabase Storage
[ ] 6. Instalar dependências e iniciar o backend
[ ] 7. Testar fluxo de vitrine, admin e checkout
```

---

## 🛠️ Passo a Passo Detalhado

### 1. Atualizar o Repositório Local
Abra o terminal (Git Bash, PowerShell ou prompt) na pasta do projeto e garanta que está com a versão mais recente da `main`:

```bash
git checkout main
git pull origin main
```

---

### 2. Obter as Chaves no Supabase Dashboard
1. Acesse: [https://supabase.com/dashboard](https://supabase.com/dashboard)
2. Faça login e entre no projeto do **Canivete da Roça**.
3. No menu lateral esquerdo (rodapé), clique em **Project Settings** (ícone de engrenagem).
4. Clique na seção **API** (em *Configuration*).
5. Localize e copie os dois dados:
   * **Project URL**: (exemplo: `https://xyzcompanyid123.supabase.co`)
   * **Project API Keys**:
     * Utilize a chave **`anon` / `public`** (ou a **`service_role`** caso tenha habilitado RLS com restrições).

---

### 3. Configurar o arquivo `backend/.env`
Na pasta `backend/`, crie ou edite o arquivo `.env` (se ainda não existir, copie o [.env.example](file:///c:/CODEBASE/canivete-da-roca-pi2/backend/.env.example)):

```bash
cd backend
cp .env.example .env
```

Abra o arquivo `.env` e preencha as variáveis do Supabase com as chaves que você copiou:

```env
# ======================================================
# SUPABASE (PostgreSQL & Storage)
# ======================================================
SUPABASE_URL=https://xyzcompanyid123.supabase.co
SUPABASE_KEY=eyJh...sua_chave_completa_aqui...

# ======================================================
# DEMAIS CONFIGURAÇÕES DA APLICAÇÃO
# ======================================================
PORT=3000
ADMIN_USER=admin
ADMIN_PASSWORD=univesppi
SESSION_SECRET=piunivesp2026

# Melhor Envio (Sandbox)
MELHOR_ENVIO_URL=https://sandbox.melhorenvio.com.br
MELHOR_ENVIO_TOKEN=seu_token_aqui
CEP_ORIGEM=14170460

# Pix (Pagar.me v5)
PIX_CHAVE=canivetedarocaunivesp@gmail.com

# E-mail (Nodemailer / SMTP)
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=canivetedarocaunivesp@gmail.com
EMAIL_PASS=sua_senha_de_app_gmail_16_digitos
EMAIL_FROM="Canivete da Roça" <canivetedarocaunivesp@gmail.com>
```

> [!NOTE]
> O arquivo `.env` está protegido no `.gitignore` e **nunca** é enviado ao GitHub, mantendo suas chaves em segurança.

---

### 4. Executar os Scripts DDL no Supabase (se ainda não executou)
Se o banco do projeto no Supabase ainda estiver vazio ou precisar ser sincronizado:

1. No menu lateral do Supabase, clique em **SQL Editor** (ícone de terminal `>_`).
2. Clique em **New query**.
3. Abra o arquivo [`database/schema.sql`](file:///c:/CODEBASE/canivete-da-roca-pi2/database/schema.sql) do projeto, copie todo o conteúdo, cole no editor do Supabase e clique em **Run**.
   * Ele criará as 6 tabelas necessárias:
     * `public.categorias`
     * `public.produtos`
     * `public.kit_itens`
     * `public.avise_me`
     * `public.pedidos`
     * `public.pedido_itens`
   * O script é **idempotente** (`IF NOT EXISTS` / `ADD COLUMN IF NOT EXISTS`), ou seja, pode ser rodado várias vezes sem risco de duplicar ou quebrar dados.
4. *(Opcional)* Se quiser carregar produtos de teste com fotos, categorias e preços, abra o arquivo [`database/seed.sql`](file:///c:/CODEBASE/canivete-da-roca-pi2/database/seed.sql), cole numa nova query e clique em **Run**.

---

### 5. Verificar o Bucket de Imagens no Storage
1. No menu lateral do Supabase, clique em **Storage**.
2. Verifique se existe o bucket chamado **`produtos`**.
3. Se não existir:
   * Clique em **New bucket**.
   * Nome: `produtos` (minúsculo).
   * Marque a opção **Public bucket** (obrigatório para que as imagens apareçam na loja).
   * Salve.

---

### 6. Instalar Dependências e Iniciar o Servidor
No terminal, dentro da pasta `backend/`:

```bash
# Instala o @supabase/supabase-js e demais pacotes
npm install

# Inicia o servidor
npm start
```

Ao iniciar, você verá no console:
```text
API funcionando em http://localhost:3000
```
Se as chaves estiverem corretas, nenhuma mensagem de aviso será exibida e todas as operações irão diretamente para o banco de dados.

---

## 🛡️ Como Funciona o Fallback Inteligente (Dual-Mode)

O backend foi projetado com alta tolerância a falhas:
* **Sem chaves ou chaves de exemplo:**  
  O servidor opera automaticamente no **Modo Local / Mock**, lendo e gravando em `produtos.json` e `pedidos.json`. Nada quebra, permitindo demonstrar o sistema offline.
* **Com chaves configuradas:**  
  O servidor opera no **Modo Supabase**, integrando:
  * Vitrine e catálogo (`GET /api/produtos`, `GET /api/produtos/:id`) direto da tabela `produtos`;
  * Cadastro e exclusão de itens no painel administrativo (`POST /api/produtos`, `DELETE /api/produtos/:id`);
  * Checkout e pedidos (`POST /api/pedidos`), gravando `pedidos`, relacionando `pedido_itens` e **decrementando o estoque dos produtos** automaticamente;
  * Painel de pedidos administrativos (`GET /api/admin/pedidos` e `PATCH /api/admin/pedidos/:numero/status`);
  * Simulação e aprovação de pagamentos via Pix (`POST /api/pedidos/:numero/pagamento/simular`).
* **Se a internet cair temporariamente:**  
  O backend tenta o Supabase e, caso não obtenha resposta, recorre aos dados locais em cache para manter a loja no ar.

---

## 🌐 URLs de Acesso Local

* 🛒 **Loja / Vitrine:** [http://localhost:3000](http://localhost:3000)
* 🛍️ **Carrinho de Compras:** [http://localhost:3000/carrinho.html](http://localhost:3000/carrinho.html)
* 📦 **Checkout / Pagamento:** [http://localhost:3000/checkout.html](http://localhost:3000/checkout.html)
* 🔐 **Login Administrativo:** [http://localhost:3000/login-admin.html](http://localhost:3000/login-admin.html)
  * **Usuário:** `admin`
  * **Senha:** `univesppi`
* 📊 **Gerenciamento de Produtos:** [http://localhost:3000/admin.html](http://localhost:3000/admin.html)
* 📋 **Gestão de Pedidos:** [http://localhost:3000/admin-pedidos.html](http://localhost:3000/admin-pedidos.html)
