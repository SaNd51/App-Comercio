# Mercadinho Ximenes — Loja virtual com Pix

Projeto em etapas (ver seção 10 da especificação).

## Estrutura
```
loja/
├── backend/   API REST (Node + Express + TypeScript + Prisma + Zod)
└── app/       App (React Native + Expo) — a partir da Etapa 4
```

## Etapa 1 — Estrutura e banco

```bash
cd backend
cp .env.example .env        # edite JWT_SECRET e a chave Pix
npm install
npx prisma migrate dev --name init
npm run db:seed
npx prisma studio           # confira os dados no navegador
```

Usuários do seed: `admin@mercadinho.com / Admin@123` e `cliente@mercadinho.com / Cliente@123`.

### Como testar a Etapa 1
- `prisma studio` deve mostrar 2 usuários, 5 categorias e 15 produtos.
- Rodar `npm run db:seed` de novo não deve duplicar nada.

## Etapa 2 — API de autenticação

```bash
cd backend
npm install            # instala também o supertest
npm run dev            # http://localhost:3333  |  Swagger: /api/docs
npm test
```

| Método | Rota                | Descrição                          |
|--------|---------------------|------------------------------------|
| POST   | /api/auth/register  | Cadastro de cliente (role sempre `user`) |
| POST   | /api/auth/login     | Retorna `{ token, usuario }`       |
| GET    | /api/auth/me        | Usuário autenticado (Bearer token) |

### Testar manualmente (curl)
```bash
curl -X POST localhost:3333/api/auth/login -H "Content-Type: application/json" \
  -d '{"email":"admin@mercadinho.com","senha":"Admin@123"}'

curl localhost:3333/api/auth/me -H "Authorization: Bearer <TOKEN>"
```
Rate limit: após 10 tentativas em 15 min no mesmo IP, o login responde `429`.

## Etapa 3 — API de produtos

| Método | Rota                        | Acesso  | Descrição |
|--------|-----------------------------|---------|-----------|
| GET    | /api/products               | público | `?search=&category=&page=&limit=` (só ativos). Admin: `&status=ativo\|inativo\|todos` |
| GET    | /api/products/:id           | público | Inativo → 404 (exceto admin) |
| POST   | /api/products               | admin   | Cadastra produto |
| PUT    | /api/products/:id           | admin   | Altera (campos parciais) |
| PATCH  | /api/products/:id/status    | admin   | `{ "status": "ativo" \| "inativo" }` |
| DELETE | /api/products/:id           | admin   | Remove; se já estiver em pedidos, apenas inativa |
| GET    | /api/categories             | público | Categorias + total de produtos ativos |

**Preços são sempre inteiros em centavos** (R$ 4,90 = `490`). O app converte para exibir.

Resposta da listagem: `{ itens: [...], paginacao: { pagina, limite, total, totalPaginas } }`.

**PostgreSQL:** a busca por nome usa `contains`; em Postgres, adicione `mode: 'insensitive'`
em `products.service.ts` para ignorar maiúsculas/minúsculas.

## Etapa 4 — App: login e home (Expo)

### Criar o projeto Expo e copiar o código
Como as versões das bibliotecas dependem do SDK do Expo, o projeto base é gerado pelo próprio Expo
e depois recebe os arquivos desta etapa:

```bash
cd loja
mv app app-codigo                                   # guarda os arquivos desta etapa
npx create-expo-app@latest app --template blank-typescript
cp -R app-codigo/src app-codigo/App.tsx app-codigo/.env.example app/
rm -rf app-codigo
cd app
npx expo install @react-navigation/native @react-navigation/native-stack @react-navigation/bottom-tabs \
  react-native-screens react-native-safe-area-context expo-secure-store expo-font \
  @expo-google-fonts/inter @expo/vector-icons
cp .env.example .env     # ajuste EXPO_PUBLIC_API_URL (celular físico: IP do PC, ex. http://192.168.0.10:3333)
npx tsc --noEmit         # confere os tipos
npx expo start
```
Suba a API em outro terminal (`cd backend && npm run dev`). Para o app web, mantenha
`http://localhost:8081` em `CORS_ORIGINS` no `.env` da API.

### Como testar
1. Abra o app → tela de **Login**. Campos vazios/e-mail inválido mostram erro sob o campo.
2. `cliente@mercadinho.com / Cliente@123` → **Início** (busca, atalhos de categoria, grade de produtos).
3. Em **Conta → Sair**, entre com `admin@mercadinho.com / Admin@123` → cai no **Painel Admin** (provisório).
4. **Criar conta**: cadastra e já entra logado. Feche e reabra o app: a sessão é mantida.
5. Desligue a API e puxe a lista para atualizar: aparece o estado de erro com "Tentar de novo".

## Etapa 5 — Carrinho

Dependências novas (dentro de `app/`):
```bash
npm install zustand
npx expo install @react-native-async-storage/async-storage
npm install -D vitest
# em package.json, em "scripts":  "test": "vitest run"
npm test            # testa a lógica do carrinho e a formatação de preço
npx tsc --noEmit && npx expo start
```

### Como funciona
- **Estado:** Zustand (`src/store/carrinho.ts`), salvo no aparelho (AsyncStorage). A lógica está em
  `src/store/carrinhoLogica.ts` (funções puras, com testes).
- **Estoque:** a quantidade nunca passa do estoque; o app avisa quando limita.
- **Sincronização:** ao abrir o Carrinho, o app consulta cada produto. Preço/estoque atualizados são
  aplicados; produtos inativos, esgotados ou removidos ficam marcados como *indisponíveis* e bloqueiam
  a finalização até serem removidos.
- **Outro usuário no aparelho:** o carrinho da pessoa anterior é descartado no login.
- **Confiança:** o app só sugere valores. No pedido (Etapa 6) o servidor recalcula tudo a partir do banco.

### Como testar
1. Na Home, toque no **+** de um produto → toast "adicionado" e o selo do carrinho sobe.
2. Toque no cartão → **detalhe**: ajuste a quantidade (− mínimo 1, + até o estoque), veja o total no botão e adicione.
3. Ícone do carrinho → altere quantidades, remova itens, confira subtotais e total (R$ 4,90 × 2 + R$ 3,10 = R$ 12,90).
4. Feche e reabra o app: o carrinho continua. Faça logout e entre com outro usuário: carrinho vazio.
5. Como admin, inative um produto que está no carrinho do cliente; ao reabrir o carrinho ele aparece como indisponível.

## Etapa 6 — Pedidos e Pix (API)

| Método | Rota                       | Acesso        | Descrição |
|--------|----------------------------|---------------|-----------|
| POST   | /api/orders                | logado        | `{ itens: [{ produtoId, quantidade }] }` → cria pedido e devolve o Pix |
| GET    | /api/orders                | logado        | Cliente: os seus. Admin: todos. `?status=&page=&limit=` → `{ pedidos, paginacao }` |
| GET    | /api/orders/:id            | dono ou admin | Pedido de outra pessoa → 404 |
| POST   | /api/orders/:id/cancel     | dono ou admin | Só "aguardando_pagamento"; devolve o estoque |
| PATCH  | /api/orders/:id/status     | admin         | `{ "status": "pago" \| "cancelado" }` (confirmação manual do Pix) |

- **Total sempre no servidor:** o app envia só `produtoId` e `quantidade`; preço e total vêm do banco.
  Preço fica "congelado" em `OrderItem.precoUnitario`.
- **Tudo ou nada:** verificação de estoque/status, baixa de estoque e criação do pedido ocorrem em uma
  transação; a baixa é condicional (`estoque >= quantidade`), protegendo contra pedidos simultâneos.
- **Pix:** `src/modules/pix/pix.ts` gera o BR Code (EMV, CRC16) com `PIX_CHAVE`, `PIX_NOME_RECEBEDOR`
  e `PIX_CIDADE` do `.env`. O `txid` é derivado do id do pedido (25 primeiros caracteres do UUID).
- **Confirmação do pagamento:** o código é um Pix *estático*, então não há aviso automático do banco.
  O admin confirma em `PATCH /api/orders/:id/status`. Para confirmação automática seria preciso
  integrar a API Pix de um PSP (cobrança dinâmica + webhook).
- **Pedidos parados:** pedidos não pagos seguram estoque até serem pagos ou cancelados. Um job que
  cancela pedidos com mais de N minutos é um bom próximo passo.

> **Testes em paralelo:** os arquivos de teste compartilham o mesmo SQLite. Se aparecer
> "database is locked", rode com `fileParallelism: false` no `vitest.config.mts`.

### App — checkout Pix (Etapa 6)

Dependências novas (dentro de `app/`):
```bash
npx expo install react-native-svg expo-clipboard
npm install react-native-qrcode-svg
npm test && npx tsc --noEmit && npx expo start
```
Configure no `.env` da **API** a chave Pix real da loja (`PIX_CHAVE`, `PIX_NOME_RECEBEDOR`, `PIX_CIDADE`).

**Fluxo:** Carrinho → *Finalizar compra* → a API cria o pedido (total recalculado, estoque baixado) →
tela de **Checkout** com QR Code, "Pix Copia e Cola" (botão copiar), resumo e status
*Aguardando pagamento*. A tela consulta o status a cada 8 s e avisa quando fica *Pago*.
Em **Conta → Meus Pedidos** dá para reabrir o Pix de um pedido pendente.

**Como testar (ponta a ponta):**
1. Como cliente, adicione produtos e toque em *Finalizar compra* → aparece o QR e o código (total confere).
2. Toque em *Copiar código Pix* → toast; cole em um app de banco para conferir valor e recebedor.
3. Confirme o pagamento como admin (Swagger em `/api/docs` ou curl):
   `PATCH /api/orders/<id>/status` com `{"status":"pago"}` → o app mostra "Pagamento confirmado".
4. Crie outro pedido e use *Cancelar pedido*: o estoque do produto volta.
5. Tente pedir mais que o estoque (reduza o estoque no admin/seed): o app mostra o erro e atualiza o carrinho.

## Etapa 7 — Painel Admin (app)

Não há dependências novas. Entre como `admin@mercadinho.com / Admin@123` → cai no **Painel Admin**
(o cliente comum nunca vê essa tela, e a API recusa qualquer chamada de admin sem o perfil).

**Produtos**
- Busca por nome (com debounce), filtro por **categoria** e por **status** (Todos/Ativos/Inativos).
- **Switch** ativa/desativa na hora (desfaz sozinho se a API recusar). Inativo some da loja dos clientes.
- **Novo** abre o formulário; tocar numa linha edita: nome, categoria, preço (máscara em R$), estoque,
  descrição, imagem (link, com pré-visualização) e status.
- **Excluir**: se o produto já está em pedidos, a API apenas o inativa (o app avisa).

**Pedidos**
- Filtro por status (abre em *Aguardando*), detalhes do pedido e do cliente.
- **Marcar como pago** (confirma o Pix recebido) e **Cancelar** (devolve o estoque), ambos com confirmação.

**Como testar**
1. Painel → Produtos → desative um produto → entre como cliente: ele sumiu da Home e da busca.
2. Novo produto: deixe campos vazios (erros sob cada campo) e depois cadastre; ele aparece na Home do cliente.
3. Edite o preço: um carrinho que já tinha o produto mostra "Alguns preços foram atualizados".
4. Cliente faz um pedido → Painel → Pedidos → *Marcar como pago* → no app do cliente aparece "Pagamento confirmado".
5. `npm test` (lógica de validação e máscara de preço) e `npx tsc --noEmit`.

**Limitações:** imagens são por link (não há upload de arquivo) e categorias vêm do seed (não há tela para criá-las).

## Etapa 8 — Novas funcionalidades

Execute as migrations e atualize o seed:

```bash
cd backend
npx prisma migrate dev
npm run db:seed
npm run dev
```

Em outro terminal:

```bash
cd app
npx expo install react-native-mask-input expo-image
npm start
```

Novas variáveis da API: mantêm-se `DATABASE_URL`, `JWT_SECRET` e as configurações Pix. A loja agora usa
dados públicos configuráveis pelas rotas `/api/loja`, `/api/banners`, `/api/addresses` e `/api/cep/:cep`.

Principais rotas novas:

| Método | Rota | Descrição |
|---|---|---|
| `GET` / `POST` | `/api/addresses` | Lista/cria endereços |
| `PUT` / `DELETE` | `/api/addresses/:id` | Edita/exclui endereço |
| `PATCH` | `/api/addresses/:id/principal` | Define endereço principal |
| `GET` | `/api/cep/:cep` | Consulta ViaCEP pelo backend |
| `GET` / `PUT` / `DELETE` | `/api/favorites/:productId` | Gerencia favoritos |
| `GET` | `/api/banners` | Lista banners ativos |
| `GET` / `PUT` | `/api/loja` | Dados públicos/configuração da loja |
| `PATCH` | `/api/orders/:id/entrega` | [ADMIN] Avança estado da entrega |

Teste novamente com:

```bash
cd backend && npm test
cd ../app && npm test
npx tsc --noEmit
```
