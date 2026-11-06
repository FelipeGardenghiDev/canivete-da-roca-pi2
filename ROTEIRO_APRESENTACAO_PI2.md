# 🎬 Apresentação de Slides e Roteiro de Gravação — Projeto Integrador II (UNIVESP)

> [!IMPORTANT]
> **Alinhamento 100% aos Critérios Oficiais de Avaliação da UNIVESP (5 a 10 minutos):**
> A estrutura abaixo foi desenhada para que o seu vídeo atinja **~7 min 45 seg** (margem segura entre o mínimo de 5 min e o máximo de 10 min), cobrindo **todos os 6 elementos avaliados** pela banca:
> 1. **Identificação do grupo** *(Slides 01 e 02 — ~1m 05s)*
> 2. **Apresentação do problema, relevância comunitária e relação com o tema norteador** *(Slides 03 e 04 — ~1m 15s)*
> 3. **Conhecimentos desenvolvidos e arquitetura da solução** *(Slides 05, 06, 07 e 08 — ~2m 35s)*
> 4. **Testes, implementação na comunidade externa e impactos reais** *(Slides 09, 10 e 11 — ~1m 40s)*
> 5. **Apresentação da solução em funcionamento (Gravação de tela ao vivo)** *(Slide 12 + Demo — ~3m 10s)*
> 6. **Utilização de recursos e controle de tempo** *(Slides visuais + fotos reais + diagramas + demo ao vivo)*

---

## 📂 Arquivos Gerados no Seu Projeto

Foram gerados **dois formatos prontos para uso** dentro do seu projeto:

1. **Apresentação Web Interativa 16:9 com Teleprompter e Cronômetro Integrados:**
   - Arquivo: [apresentacao.html](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/frontend/apresentacao.html)
   - **Destaques para a sua gravação:**
     - Segue a identidade **Rústica Premium** da *Canivete da Roça* com as fotos reais dos produtos (`canivete.png`, `bainha.png`, `strop.png`, `pasta.png`, `kit.png`).
     - Pressione `F` para **Tela Cheia**, setas `←` / `→` ou `Espaço` para avançar.
     - Botão **↗ Teleprompter Externo**: abre uma janela separada sincronizada com o texto exato de leitura de cada slide (você pode deixá-la em um segundo monitor sem aparecer na gravação!).
     - **Cronômetro de Ensaio** na barra inferior que fica verde quando atinge a meta de `05:00` a `10:00`.
     - No **Slide 12**, há um botão direto **ABRIR LOJA AO VIVO (INICIAR DEMO) →** que já abre a vitrine ([index.html](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/frontend/index.html)) para a segunda parte do vídeo.

2. **Arquivo Editável do PowerPoint (`.pptx` Widescreen 16:9):**
   - Arquivo: [Apresentacao_PI2_Canivete_da_Roca.pptx](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/Apresentacao_PI2_Canivete_da_Roca.pptx)
   - Contém todos os 12 slides formatados em 16:9 com as anotações do apresentador (*Speaker Notes*) embutidas em cada slide, caso prefira abrir no PowerPoint, Google Apresentações ou Canva.

---

## 🗺️ Mapa de Cobertura dos Critérios da UNIVESP

| Critério Oficial UNIVESP | Slides Correspondentes | Tempo Estimado |
| :--- | :--- | :---: |
| **1. Identificação do grupo** (dados do grupo, RAs, cursos, polos, orientador e título) | Slides **01** e **02** | `~01:05` |
| **2. Apresentação do problema** (problema de pesquisa, relevância para a *Canivete da Roça* e tema norteador UNIVESP) | Slides **03** e **04** | `~01:15` |
| **3. Conhecimentos desenvolvidos na construção** (Design Thinking, arquitetura nuvem R$ 0,00, Motor Pix Bacen, Melhor Envio, WCAG) | Slides **05**, **06**, **07** e **08** | `~02:35` |
| **4. Implementação na comunidade externa e impactos** (bateria de testes CT01–CT06, homologação com o lojista e retorno de 16–20% de margem) | Slides **09**, **10** e **11** | `~01:40` |
| **5. Apresentação da solução em funcionamento** (transição e gravação de tela navegando na loja e no painel admin) | Slide **12** + **Demo na Tela** | `~03:10` |
| **Tempo Total Estimado do Vídeo** | **12 Slides + Demo Prática** | **`~07:45` a `08:30`** ✅ |

---

## 🎙️ PARTE 1: Roteiro de Leitura Slide a Slide (Teleprompter)

---

### 🔹 SLIDE 01 — Capa e Identificação do Projeto (`00:00` – `00:30`)
* **O que aparece no slide:**
  * **Título:** *Desenvolvimento de E-commerce Escalável em Nuvem com Processamento Automatizado de Pagamentos via Pix*
  * **Disciplina:** Projeto Integrador em Computação II (PJI240) — 2026
  * **Regional / Polos:** DRP 10 (Colina, Pitangueiras, Ribeirão Preto e Sertãozinho – SP)
  * **Cursos:** Engenharia da Computação, Ciência de Dados e Tecnologia da Informação
  * **Orientador do PI:** Prof. Francisco Leitão de Oliveira Neto
  * **Comunidade Externa:** Microempresa *Canivete da Roça* (Proprietário: Fernando Gonçalves — Sertãozinho/SP)
* **🎙️ Texto para você ler (Narração):**
  > *"Olá a todos! Somos alunos do Eixo de Computação da UNIVESP, pertencentes à Regional DRP 10 — polos de Colina, Pitangueiras, Ribeirão Preto e Sertãozinho — sob orientação do professor Francisco Leitão de Oliveira Neto. Neste vídeo, apresentamos o nosso Projeto Integrador em Computação II, intitulado 'Desenvolvimento de E-commerce Escalável em Nuvem com Processamento Automatizado de Pagamentos via Pix', desenvolvido em parceria com a comunidade externa Canivete da Roça."*

---

### 🔹 SLIDE 02 — Identificação da Equipe e Divisão de Papéis (`00:30` – `01:05`)
* **O que aparece no slide:**
  * Grade com os 7 integrantes, RAs e frentes técnicas especializadas (Kanban no Trello + Monorepo no GitHub):
    1. **Carlos Vinicius de Oliveira Santos** (RA: 24201757) — Acessibilidade Digital (WCAG 2.1 AA)
    2. **Felipe Gabriel Marcelino** (RA: 25205388) — Backend Node.js/Express, Motor Pix Bacen/EMV, Melhor Envio e Nodemailer
    3. **Felipe Gardenghi Gonçalves** (RA: 24214497) — Liderança, Governança GitHub, Relatórios Técnicos e Vídeo
    4. **João Paulo Souza Martins** (RA: 24220210) — Infraestrutura Serverless e Deploy em Nuvem (Vercel)
    5. **Lucas de Carvalho** (RA: 24223366) — Modelagem Relacional PostgreSQL (`schema.sql`/`seed.sql`) e Supabase Storage
    6. **Marina Berardi Barioni** (RA: 24210281) — Qualidade e Testes Funcionais de Ponta a Ponta (CT01 a CT06)
    7. **Sidney Nunes Ferreira** (RA: 2013327) — Frontend Responsivo (HTML5, CSS3, Vanilla JS) e Painel Admin
* **🎙️ Texto para você ler (Narração):**
  > *"Nosso grupo é composto por sete integrantes dos cursos de Ciência de Dados, Engenharia da Computação e Tecnologia da Informação. Para garantir agilidade e qualidade técnica, organizamos o trabalho em frentes especializadas utilizando GitHub e Kanban no Trello: Carlos Vinicius atuou na acessibilidade WCAG 2.1 AA; Felipe Gabriel desenvolveu o backend em Node.js, motor Pix e integrações; eu, Felipe Gardenghi, atuei na liderança, documentação, versionamento e produção do vídeo; João Paulo realizou o deploy serverless na Vercel; Lucas de Carvalho modelou o banco PostgreSQL e o Supabase Storage; Marina Barioni conduziu os testes funcionais de ponta a ponta; e Sidney Ferreira desenvolveu todo o frontend e o painel administrativo."*

---

### 🔹 SLIDE 03 — Apresentação do Problema e Comunidade Externa (`01:05` – `01:45`)
* **O que aparece no slide:**
  * **Comunidade Externa:** Microempresa *Canivete da Roça* (Sertãozinho/SP), especializada em cutelaria tradicional e afiação (canivetes campeiros, bainhas de couro legítimo, strops e pastas de óxido de cromo).
  * **Os 3 Gargalos dos Marketplaces (Mercado Livre e Shopee):**
    1. **Perda de Margem Financeira:** Retenção severa de **16% a 20%** do faturamento bruto em tarifas e comissões.
    2. **Ausência de Canal Direto:** Bloqueio do contato direto com os compradores, impedindo fidelização e pós-venda.
    3. **Rigidez em Fretes e Kits:** Dificuldade em sincronizar o estoque entre peças vendidas avulsas e montadas em *Kits de Afiação*.
* **🎙️ Texto para você ler (Narração):**
  > *"A comunidade externa atendida é a microempresa Canivete da Roça, de Sertãozinho, São Paulo, gerida pelo senhor Fernando Gonçalves e especializada em cutelaria tradicional e afiação — como canivetes campeiros artesanais, bainhas em couro legítimo, strops e pastas de polimento. No diagnóstico inicial, identificamos que a empresa operava exclusivamente via marketplaces como Mercado Livre e Shopee. Embora tragam visibilidade inicial, esses canais impõem três gargalos severos: primeiro, a perda de 16% a 20% do faturamento bruto em comissões e taxas; segundo, o bloqueio do relacionamento direto com o cliente final; e terceiro, a dificuldade de controlar o estoque simultâneo entre peças vendidas avulsas e montadas em kits promocionais."*

---

### 🔹 SLIDE 04 — Problema de Pesquisa e Relação com o Tema Norteador da UNIVESP (`01:45` – `02:20`)
* **O que aparece no slide:**
  * **Problema de Pesquisa:** *"Como projetar, desenvolver e implantar uma plataforma própria de comércio eletrônico, com custo fixo de infraestrutura nulo (R$ 0,00) e arquitetura modular em nuvem, capaz de mitigar a dependência operacional de marketplaces intermediários, integrando catálogo comercial, cotação logística dinâmica e liquidação automatizada de pagamentos instantâneos via Pix para um pequeno empreendimento de cutelaria?"*
  * **Relação com o Tema Norteador (PI2) e Disciplinas do Curso:**
    * *Engenharia de Software*, *Bancos de Dados*, *Desenvolvimento Web*, *Redes de Computadores e Sistemas Distribuídos* e *Acessibilidade Digital & IHC*.
* **🎙️ Texto para você ler (Narração):**
  > *"Diante desse cenário, formulamos a nossa questão norteadora de pesquisa: como projetar, desenvolver e implantar uma plataforma própria de e-commerce, com custo fixo de infraestrutura nulo de zero reais e arquitetura modular em nuvem, capaz de superar a dependência de marketplaces, integrando catálogo, frete dinâmico e pagamento instantâneo via Pix? Esse desafio conecta-se diretamente ao Tema Norteador do Projeto Integrador II da UNIVESP, que propõe o desenvolvimento de um sistema web integrado a banco de dados relacional, controle de versão e recursos de acessibilidade, articulando na prática cinco disciplinas fundamentais do nosso eixo de Computação."*

---

### 🔹 SLIDE 05 — Metodologia Design Thinking (`02:20` – `02:55`)
* **O que aparece no slide:**
  * **1. Ouvir e Interpretar:** Imersão com o lojista, análise das taxas de 16–20% e levantamento de peso/cubagem real dos produtos.
  * **2. Criar e Prototipar:** Arquitetura Custo R$ 0,00, fluxo *Guest Checkout* (compra sem senha para evitar abandono de carrinho) e regra matemática do estoque virtual de kits: $\text{Estoque}(\text{Kit}) = \min(\text{Estoque}_{\text{Item 1}}, \text{Estoque}_{\text{Item 2}}, \dots)$.
  * **3. Implementar e Testar:** Codificação Full Stack no monorepo, integrações nacionais e homologação.
* **🎙️ Texto para você ler (Narração):**
  > *"Para conduzir o desenvolvimento, aplicamos a metodologia do Design Thinking dividida em três grandes ciclos: na etapa Ouvir e Interpretar, realizamos entrevistas com o lojista em Sertãozinho e mapeamos seu catálogo e dificuldades logísticas. Na etapa Criar e Prototipar, desenhamos a arquitetura de custo zero, modelamos as seis tabelas relacionais e concebemos o modelo Guest Checkout sem obrigatoriedade de senha, além da regra matemática onde o estoque disponível de um kit é calculado pelo componente de menor saldo físico. Por fim, na etapa Implementar e Testar, realizamos a codificação full stack, integramos o motor Pix e o Melhor Envio, fizemos o deploy na Vercel e homologamos o sistema junto ao proprietário."*

---

### 🔹 SLIDE 06 — Arquitetura Técnica Desacoplada e Custo Fixo Zero (`02:55` – `03:35`)
* **O que aparece no slide:**
  * Diagrama das 3 camadas de custo fixo R$ 0,00:
    1. **Cliente (Frontend):** HTML5 semântico + CSS3 + JavaScript Puro (Vanilla JS) + Acessibilidade WCAG 2.1 AA.
    2. **Servidor (Backend):** API RESTful em Node.js + Express ([server.js](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/backend/server.js)) na nuvem Serverless Vercel (< 250ms) com **Resiliência Dual-Mode** (fallback automático para JSON local se a rede oscilar).
    3. **Dados e Mídia (Supabase):** PostgreSQL em 3FN ([schema.sql](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/database/schema.sql)) + **Supabase Storage** (bucket público `produtos` guardando apenas a URL pública no banco).
* **🎙️ Texto para você ler (Narração):**
  > *"Neste slide apresentamos a arquitetura técnica desacoplada da nossa solução. No navegador do cliente, construímos o frontend com HTML5 semântico, CSS3 e JavaScript puro, sem frameworks pesados, garantindo carregamento imediato e acessibilidade WCAG 2.1 AA. Essa interface se comunica via API REST com nosso servidor Node.js e Express hospedado de forma serverless na Vercel. Na camada de persistência, utilizamos o PostgreSQL na nuvem do Supabase para os dados relacionais e o Supabase Storage para servir as fotos otimizadas via URL pública, evitando guardar arquivos binários pesados no banco. Além disso, o backend conta com contingência Dual-Mode: caso a conexão externa oscile, ele aciona automaticamente o fallback local em JSON sem tirar a loja do ar."*

---

### 🔹 SLIDE 07 — Engenharia das Integrações: Motor Pix BACEN e Melhor Envio (`03:35` – `04:20`)
* **O que aparece no slide:**
  * **Motor Nativo Próprio de Pix ([pix.js](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/backend/pix.js)):** Padrão oficial BR Code / EMVCo do Banco Central, chave Pix da loja, identificador único `txid`, cálculo bit a bit do checksum **CRC16-CCITT (`0x1021`)**, QR Code Base64 e **TTL de 30 minutos** com estorno automático de estoque.
  * **Cotação Logística em Tempo Real ([frete.js](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/backend/frete.js)):** Integração à API v2 do Melhor Envio calculando peso e cubagem a partir do CEP de origem em Sertãozinho (`14170-460`) para **Correios (PAC e SEDEX)** e **Jadlog**.
  * **E-mails Transacionais ([email.js](file:///c:/CODEBASE/estudos/canivete-da-roca-pi2/backend/email.js)):** Nodemailer + SMTP Gmail oficial.
* **🎙️ Texto para você ler (Narração):**
  > *"Um grande destaque técnico do projeto foi a construção do nosso próprio motor nativo de pagamentos Pix em Node.js, seguindo estritamente a especificação oficial do Banco Central e EMVCo. Em vez de depender de sandboxes instáveis ou taxas de gateways de terceiros, nosso módulo monta o payload BR Code com a chave Pix da loja, valor exato com frete, identificador único txid e calcula o polinômio de verificação cíclica CRC16-CCITT. Ele gera instantaneamente o QR Code em Base64 e o código Copia e Cola, iniciando um cronômetro de 30 minutos de validade: se o pedido não for pago nesse prazo, o sistema cancela a ordem e devolve os itens ao estoque. Em paralelo, integramos a API v2 do Melhor Envio, que soma o peso e cubagem do carrinho a partir do CEP de Sertãozinho para cotar Correios PAC, SEDEX e Jadlog em tempo real, além do envio de e-mails automáticos via Nodemailer."*

---

### 🔹 SLIDE 08 — Módulos da Plataforma e Jornada do Usuário (`04:20` – `04:55`)
* **O que aparece no slide:**
  * **1. Vitrine Dinâmica & "Avise-me":** Filtros instantâneos e captura de leads quando `estoque <= 0`.
  * **2. Guest Checkout & Rastreio:** Compra sem senha e consulta pública por Código do Pedido ou CPF.
  * **3. Acessibilidade WCAG 2.1 AA:** *Skip links*, navegação por teclado (`TAB`), `:focus-visible` e `aria-live="polite"`.
  * **4. Painel Admin do Lojista:** Autenticação por sessão HTTP-Only, gestão de catálogo, kits e máquina de estados dos pedidos.
* **🎙️ Texto para você ler (Narração):**
  > *"Pensando na experiência tanto do comprador quanto do lojista, estruturamos quatro frentes funcionais completas: na vitrine, o cliente filtra canivetes, bainhas, strops e kits sem recarregar a página, e caso um item acabe, pode se cadastrar no recurso 'Avise-me quando chegar'. Na finalização, o Guest Checkout elimina o atrito de criar senhas e permite rastrear o pedido apenas com o código ou CPF. Toda a interface segue o padrão WCAG 2.1 AA de acessibilidade. Já para o senhor Fernando, construímos um painel administrativo seguro onde ele cadastra produtos, compõe kits, atualiza estoques e gerencia o status de envio dos pedidos."*

---

### 🔹 SLIDE 09 — Matriz de Testes Funcionais e Qualidade (`04:55` – `05:25`)
* **O que aparece no slide:**
  * Tabela oficial de testes executados (`CT01` a `CT06`): Catálogo & Filtros, Cotação de Frete, Motor Pix Bacen (CRC16), Temporizador TTL de 30 min, Notificações E-mail Nodemailer e Acessibilidade WCAG via Teclado/Leitor de Tela — **100% de Sucesso**.
* **🎙️ Texto para você ler (Narração):**
  > *"Antes da entrega à comunidade externa, submetemos a plataforma a uma bateria rigorosa de seis casos de teste funcionais e de usabilidade: validamos a filtragem assíncrona do catálogo, o cálculo de frete para diferentes CEPs no Melhor Envio, a leitura do QR Code Pix e seu checksum CRC16 em aplicativos bancários, o cancelamento automático por expiração dos 30 minutos com estorno de estoque, a entrega dos e-mails HTML pelo Nodemailer e a navegação acessível via teclado e leitor de tela. Todos os seis cenários obtiveram 100% de aprovação."*

---

### 🔹 SLIDE 10 — Implementação na Comunidade Externa e Impactos Reais (`05:25` – `06:05`)
* **O que aparece no slide:**
  * Validação junto ao proprietário Sr. Fernando Gonçalves (*Canivete da Roça*):
    * **Impacto Econômico:** Custo fixo mensal **R$ 0,00**, recuperação imediata de **+16% a 20% de margem bruta** e liquidez instantânea no Pix sem taxas.
    * **Impacto Operacional:** Estoque de kits sincronizado, frete automático e painel administrativo intuitivo.
    * **Impacto Comercial:** Base própria de clientes e checkout fluido para divulgação no WhatsApp e Instagram.
* **🎙️ Texto para você ler (Narração):**
  > *"A implementação e homologação junto à comunidade externa foi realizada com o proprietário da Canivete da Roça, senhor Fernando Gonçalves, gerando impactos concretos em três dimensões: na viabilidade econômica, o custo fixo mensal de hospedagem e banco de dados manteve-se em zero reais, permitindo à microempresa recuperar de 16% a 20% de margem líquida em cada venda direta, além de ter liquidez imediata e taxa zero pelo Pix nativo. Na viabilidade operacional e comercial, o lojista elogiou a simplicidade do painel administrativo para controlar o estoque unificado de kits e o checkout sem senha, que combina perfeitamente com seu público no WhatsApp e Instagram."*

---

### 🔹 SLIDE 11 — Considerações Finais e Trabalhos Futuros (`06:05` – `06:35`)
* **O que aparece no slide:**
  * Balanço extensionista da UNIVESP, estratégias de mitigação (Dual-Mode Fallback e tráfego via redes sociais) e **Trabalhos Futuros**:
    1. Painel de *Business Intelligence (BI)* com gráficos de conversão;
    2. Motor de cupons promocionais sazonais;
    3. Impressão térmica direta de etiquetas dos Correios e Jadlog.
* **🎙️ Texto para você ler (Narração):**
  > *"Como considerações finais, este Projeto Integrador comprovou que é plenamente possível empoderar microempresas tradicionais com engenharia de software moderna, acessível e de custo zero em nuvem. Também mapeamos com transparência a estratégia de mitigação para atração de tráfego orgânico via redes sociais e deixamos planejados como trabalhos futuros a adição de um dashboard de Business Intelligence para análise de conversão, cupons de desconto sazonais e impressão térmica direta de etiquetas logísticas."*

---

### 🔹 SLIDE 12 — Transição para a Demonstração Prática (`06:35` – `06:55`)
* **O que aparece no slide:**
  * Resumo das 3 etapas da demonstração ao vivo e botão **ABRIR LOJA AO VIVO (INICIAR DEMO) →**.
* **🎙️ Texto para você ler (Narração):**
  > *"Agora que apresentamos o problema de pesquisa, a fundamentação metodológica, a arquitetura em nuvem e os impactos gerados na comunidade externa, vamos passar para a demonstração prática da plataforma Canivete da Roça funcionando em tempo real. Vamos lá!"*

---

## 🖥️ PARTE 2: Roteiro Passo a Passo da Gravação de Tela (Demonstração em Funcionamento — `~2m 30s a 3m 00s`)

> [!TIP]
> **Antes de começar a gravar:**
> Certifique-se de que o servidor está rodando (`cd backend && npm start`) e abra [http://localhost:3000/apresentacao.html](http://localhost:3000/apresentacao.html). Ao chegar no Slide 12 e clicar em **ABRIR LOJA AO VIVO**, ele já abrirá [http://localhost:3000/index.html](http://localhost:3000/index.html).

### Passo 1 — Vitrine Rústica Premium, Acessibilidade e Filtros (`~40 seg`)
1. **Na tela inicial (`index.html`):** Pressione a tecla `TAB` uma vez para mostrar o botão de acessibilidade **"Pular para os produtos" (*Skip Link*)** e o contorno de foco visível (critério **WCAG 2.1 AA**).
2. **O que falar enquanto mostra:**
   > *"Aqui estamos na vitrine principal da Canivete da Roça. Notem que, ao pressionar a tecla TAB, o sistema exibe imediatamente o atalho de acessibilidade WCAG 2.1 AA e indicadores nítidos de foco visível para navegação por teclado e leitores de tela."*
3. Role até a seção de produtos e clique nos botões de filtro: **Canivetes**, **Bainhas**, **Strops** e **Kits de Afiação**, mostrando que a grade atualiza instantaneamente via API Fetch sem recarregar a página.

### Passo 2 — Página do Produto, Cubagem e Cálculo de Frete Melhor Envio (`~40 seg`)
1. Clique no **Canivete Campeiro Aço Inox com Cabo em Chifre** (ou no **Kit de Afiação**).
2. Na página do produto (`produto.html`), digite um CEP válido no simulador de frete (ex.: `01001-000` ou `14010-000`) e clique em **Calcular Frete**.
3. **O que falar enquanto mostra:**
   > *"Ao acessar a página de um produto, as fotos são carregadas diretamente do bucket público do Supabase Storage. Ao informar o CEP de destino, nosso backend consulta em tempo real a API v2 do Melhor Envio considerando o peso em gramas e as dimensões do item, retornando as opções e prazos dos Correios PAC e SEDEX."*
4. Clique em **Adicionar ao Carrinho** e vá para o **Carrinho (`carrinho.html`)**.

### Passo 3 — Guest Checkout sem Senha e Emissão do Pix Nativo BACEN (`~50 seg`)
1. Do carrinho, avance para **Finalizar Compra (`checkout.html`)**.
2. Preencha rapidamente os dados do cliente (Nome, CPF, E-mail, Telefone, CEP/Endereço) e selecione a modalidade de frete desejada.
3. **O que falar enquanto preenche:**
   > *"No nosso fluxo de Guest Checkout, o cliente não precisa criar conta nem decorar senhas, o que reduz drasticamente o abandono de carrinho. Informamos apenas os dados essenciais de entrega e escolhemos o frete."*
4. Clique em **Finalizar Pedido com Pix**.
5. Na tela de confirmação (`pedido-confirmado.html`), mostre:
   - O **QR Code Dinâmico** gerado pelo motor nativo `backend/pix.js`;
   - O código **Pix Copia e Cola** com checksum **CRC16-CCITT (`6304`)** no padrão EMVCo do Banco Central;
   - O **cronômetro regressivo de 30 minutos (TTL)** reservando o estoque;
   - Clique no botão de **Simular Pagamento Pix** para demonstrar a aprovação instantânea, a baixa definitiva no estoque e o disparo do e-mail de confirmação via **Nodemailer**.

### Passo 4 — Painel Administrativo do Lojista (`~40 seg`)
1. Acesse [http://localhost:3000/login-admin.html](http://localhost:3000/login-admin.html) e entre com `admin` / `univesppi`.
2. Mostre rapidamente:
   - A tela de **Gestão de Catálogo e Estoque (`admin.html`)**, onde o Sr. Fernando pode cadastrar novos canivetes, editar preços, pesos, dimensões e estoques;
   - A tela de **Gestão de Pedidos (`admin-pedidos.html`)**, mostrando o pedido recém-criado com status atualizado e opção de inserir o código de rastreio.
3. **Encerramento da fala (`~10 seg`):**
   > *"Por fim, aqui no Painel Administrativo protegido por sessão, o proprietário da Canivete da Roça gerencia todo o seu catálogo, acompanha os pedidos pagos via Pix e atualiza o status de envio com total autonomia e custo fixo zero. Muito obrigado pela atenção!"*
