# 🗄️ Database — Canivete da Roça (PI2)

Módulo responsável pela modelagem, scripts DDL, migrations e dados de teste do banco de dados relacional (PostgreSQL hospedado no **Supabase**).

---

## 📁 Conteúdo deste Módulo

* **[`schema.sql`](./schema.sql):** Script DDL com a criação das tabelas sugeridas (`categorias`, `produtos`, `kit_itens`, `avise_me`, `pedidos` e `pedido_itens`).
* **[`seed.sql`](./seed.sql):** Carga inicial de dados para testes, incluindo as categorias do menu superior e produtos exemplares de cutelaria com fotos, dimensões para frete e amarração de kit.

---

## ⚠️ Nota para o DBA do Projeto

> Os scripts contidos nesta pasta são um **guia prático de referência inicial**.  
> Você tem total liberdade e autonomia para:
> * Adicionar, renomear ou remover colunas;
> * Ajustar tipos de dados e constraints;
> * Criar novas tabelas, triggers, views ou funções;
> * Ajustar índices para melhoria de desempenho.

---

## 🖼️ Armazenamento de Fotos (Supabase Storage)

Lembre-se de que **não salvamos arquivos de imagens diretamente nas tabelas**:
1. No painel do Supabase, acesse a aba **Storage**.
2. Crie o bucket público chamado **`produtos`**.
3. Faça upload das fotos dos produtos e copie a URL pública para a coluna `imagem_url` da tabela `produtos`.
