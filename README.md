# 🔪 Canivete da Roça — Projeto Integrador II (PI2)

> Plataforma completa de e-commerce dedicada à cutelaria artesanal brasileira: canivetes, facas, bainhas de couro e acessórios para afiação.

---

## 🎯 Sobre o Projeto

Este é o repositório oficial do **Projeto Integrador II (UNIVESP)** da nossa equipe. O projeto foi desenhado sob o princípio da **simplicidade, baixo custo e facilidade de manutenção para estudantes**, permitindo que todos os membros do grupo consigam entender, colaborar e evoluir o código.

### 📐 Escolhas Arquiteturais Principais:
* **Frontend:** HTML5 semântico, CSS3 responsivo e JavaScript Vanilla (puro, sem frameworks complexos como React ou Angular), garantindo acessibilidade e edição descomplicada.
* **Backend:** Node.js com Express para servir a API REST e gerenciar as regras de negócio da loja.
* **Banco de Dados:** **PostgreSQL no Supabase** (Nuvem gratuita), eliminando a necessidade de banco local complexo.
* **Fotos e Arquivos:** **Supabase Storage** (bucket público `produtos`), armazenando apenas as URLs nas tabelas.
* **Decisão de Hospedagem:** **Não utilizaremos o Render**. A aplicação roda localmente ou em servidor independente, conectando-se ao Supabase.
* **Pagamentos & Frete (Sandbox/Produção):** Exclusivo via **PIX (Pagar.me v5)** e cotação de frete dinâmica via **Melhor Envio v2**.

---

## 🏗️ Estrutura do Monorepo

O projeto está organizado em três pastas principais para facilitar a divisão de tarefas:

```text
canivete-da-roca-pi2/
├── frontend/             # Telas da loja e painel administrativo (HTML, CSS, JS)
│   ├── css/              # Estilos e responsividade (home.css, style.css)
│   ├── js/               # Lógica de vitrine, carrinho, produto e checkout
│   ├── index.html        # Vitrine principal da loja
│   ├── produto.html      # Página detalhada do item
│   ├── carrinho.html     # Carrinho de compras interativo
│   ├── checkout.html     # Finalização de pedido com dados do cliente
│   ├── admin.html        # Painel para cadastrar e gerenciar produtos
│   └── login-admin.html  # Autenticação de administradores
│
├── backend/              # Servidor Node.js + Express
│   ├── server.js         # API REST, autenticação de sessão e rotas
│   ├── produtos.json     # Catálogo mock utilizado para testes locais
│   ├── pedidos.json      # Pedidos mock gerados durante simulações
│   ├── .env.example      # Modelo de variáveis de ambiente
│   └── package.json      # Dependências do servidor
│
├── database/             # Modelagem relacional e scripts SQL para o Supabase
│   ├── schema.sql        # Criação de tabelas (categorias, produtos, pedidos, etc.)
│   ├── seed.sql          # Carga de teste inicial de produtos e categorias
│   └── README.md         # Manual de instruções para o DBA
│
└── DIRETRIZES_DO_PROJETO.md  # Especificação técnica e regras de negócio detalhadas
```

---

## 🚦 Estado Atual do Projeto

| Área | Status | O que já está pronto e testado |
| :--- | :---: | :--- |
| **Frontend** | ✅ 100% Pronto & Acessível | Todas as telas finalizadas, 100% responsivas (mobile-first), com acessibilidade WCAG 2.1 AA, navegação por teclado, leitor de tela e foco visível. |
| **Frete (Melhor Envio Sandbox)** | ✅ 100% Integrado & Ativo | Cotação em tempo real no carrinho e no checkout via API v2 do Melhor Envio Sandbox com cálculo de cubagem, fallback e seleção de Correios/Jadlog. |
| **Pagamento PIX (Pagar.me v5)** | ✅ 100% Integrado & Ativo | Geração de BR Code (Bacen / EMV) com QR Code dinâmico, código Copia e Cola, validade estrita de 30 min (TTL) e botão de simulação para PI2. |
| **E-mails Transacionais (Nodemailer)** | ✅ 100% Integrado & Ativo | Disparo automático de e-mail ao criar pedido (com QR Code Pix) e ao confirmar pagamento, com templates HTML elegantes e suporte ao Gmail oficial (`canivetedarocaunivesp@gmail.com`). |
| **Banco de Dados (Supabase)** | ⏳ Aguardando DBA | Scripts SQL prontos ([`schema.sql`](./database/schema.sql) e [`seed.sql`](./database/seed.sql)) e instruções detalhadas aguardando execução pelo DBA no painel do Supabase. |
| **Backend (Conexão Supabase)** | ⏳ Próxima Etapa | O backend está preparado; assim que o DBA entregar a URL e a Anon Key, faremos a substituição dos dados mock (`produtos.json`/`pedidos.json`) pelas tabelas reais. |


---

## 💻 Como Rodar o Projeto Localmente (Passo a Passo para Iniciantes)

Se você nunca rodou um projeto Node.js antes, siga este passo a passo simples:

### 1. Pré-requisitos
Tenha o **Node.js** instalado no seu computador ([baixe aqui a versão LTS](https://nodejs.org/)).

### 2. Passo a Passo no Terminal / PowerShell
Abra o terminal na pasta do projeto e execute:

```bash
# 1. Acesse a pasta do backend
cd backend

# 2. Copie o arquivo de exemplo de variáveis de ambiente
cp .env.example .env

# 3. Instale as dependências
npm install

# 4. Inicie o servidor
npm start
```

### 3. Acessar no Navegador
Abra seu navegador em:
* 🛒 **Loja / Vitrine:** [http://localhost:3000](http://localhost:3000)
* 🔐 **Painel Admin:** [http://localhost:3000/login-admin.html](http://localhost:3000/login-admin.html)
  * **Usuário:** `admin`
  * **Senha:** `univesppi`

---

## 👥 Guia Rápido para a Equipe

### 🗄️ Próximos Passos para o DBA (Banco de Dados):
Consulte o guia detalhado em [`database/README.md`](./database/README.md) para:
1. Criar a conta gratuita no [Supabase](https://supabase.com).
2. Rodar o [`schema.sql`](./database/schema.sql) e o [`seed.sql`](./database/seed.sql) no *SQL Editor*.
3. Criar o bucket público **`produtos`** no *Supabase Storage* e disponibilizar a URL e a Anon Key para o backend.

### ⚙️ Próximos Passos para o Backend:
1. Instalar a biblioteca oficial: `npm install @supabase/supabase-js`.
2. Criar uma conexão simples em `backend/supabase.js`.
3. Substituir a leitura dos arquivos `produtos.json` por consultas diretas à tabela do Supabase.

---

## ♿ Acessibilidade e Inclusão

O projeto foi construído respeitando as diretrizes **WCAG 2.1 (Nível AA)**:
* Navegação por teclado completa com atalhos de salto (*Skip Links*).
* Indicadores de foco destacados (`:focus-visible`).
* Notificações com regiões dinâmicas (`aria-live="polite"`).
* Textos com alto contraste e imagens com descrições acessíveis (`alt`).
* Suporte a usuários com sensibilidade a movimentos (`prefers-reduced-motion`).

---

*Projeto Integrador II — UNIVESP*
