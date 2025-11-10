# Etapa 04 - Gestão de Estoque ✅

**Status**: Completa  
**Data**: 10 de Novembro de 2024

## 📋 Resumo

Implementação completa do módulo de **Gestão de Estoque** (Inventory Management), incluindo CRUD de produtos, movimentações de estoque (entradas, saídas e ajustes), validações de negócio e interface de usuário completa.

---

## 🎯 Funcionalidades Implementadas

### Backend (NestJS + Prisma)

#### 1. Modelos de Banco de Dados

**Product**
```prisma
- id: String (UUID)
- sku: String (único, obrigatório)
- name: String (obrigatório)
- description: String (opcional)
- price: Decimal (obrigatório, >= 0)
- cost: Decimal (opcional, >= 0)
- currentStock: Int (padrão: 0)
- minStock: Int (padrão: 0)
- active: Boolean (padrão: true)
- createdAt, updatedAt: DateTime
```

**StockMovement**
```prisma
- id: String (UUID)
- productId: String (FK → Product)
- type: MovementType enum (ENTRY, EXIT, ADJUSTMENT)
- quantity: Int (obrigatório, > 0)
- previousStock: Int
- newStock: Int
- userId: String (FK → User)
- origin: MovementOrigin enum (MANUAL, MARKETPLACE, ORDER, IMPORT, OTHER)
- note: String (opcional)
- createdAt, updatedAt: DateTime
```

**Warehouse** (estrutura básica para expansão futura)
```prisma
- id: String (UUID)
- name: String (obrigatório)
- address: String (opcional)
- active: Boolean (padrão: true)
- createdAt, updatedAt: DateTime
```

**Enums**
- `MovementType`: ENTRY (entrada), EXIT (saída), ADJUSTMENT (ajuste)
- `MovementOrigin`: MANUAL, MARKETPLACE, ORDER, IMPORT, OTHER

#### 2. DTOs (Data Transfer Objects)

**CreateProductDto**
- Validações: SKU único, preço >= 0, custo >= 0, estoque >= 0
- Decoradores Swagger para documentação automática

**UpdateProductDto**
- Campos opcionais (PartialType)
- Mantém validações de valores mínimos

**CreateMovementDto**
- Validação de tipo de movimento (enum)
- Quantidade obrigatória (> 0)
- Origem da movimentação

**QueryProductsDto**
- Busca por nome ou SKU (case-insensitive)
- Paginação (page, limit)
- Filtro por status (ativo/inativo)

#### 3. Service Layer (InventoryService)

**Produtos**
- `createProduct()`: Cria produto com validação de SKU único
- `findAllProducts()`: Lista paginada com busca (OR query em name/sku)
- `findProductById()`: Busca produto individual
- `updateProduct()`: Atualiza dados (exceto currentStock)
- `deleteProduct()`: Soft delete (marca como inativo)

**Movimentações**
- `createMovement()`: Cria movimentação com **transação atômica**:
  - Registra movimentação
  - Atualiza estoque do produto
  - Calcula novos valores:
    - **ENTRY**: `newStock = previousStock + quantity`
    - **EXIT**: `newStock = previousStock - quantity` (valida >= 0)
    - **ADJUSTMENT**: `newStock = quantity` (valor absoluto)
  - Vincula usuário responsável
- `findAllMovements()`: Lista paginada com joins (produto + usuário)
- `findMovementById()`: Busca movimentação individual

**Dashboard**
- `getDashboardStats()`: Estatísticas agregadas:
  - Total de produtos ativos
  - Estoque total (soma currentStock)
  - Produtos com estoque baixo (currentStock <= minStock)
  - Movimentações recentes (últimos 30 dias)

#### 4. Controllers

**ProductsController** (`/inventory/products`)
- `POST /` - Criar produto
- `GET /` - Listar produtos (com paginação e busca)
- `GET /:id` - Buscar produto por ID
- `PUT /:id` - Atualizar produto
- `DELETE /:id` - Deletar produto

**MovementsController** (`/inventory/movements`)
- `POST /` - Criar movimentação (requer userId do JWT)
- `GET /` - Listar movimentações
- `GET /:id` - Buscar movimentação por ID

**InventoryDashboardController** (`/inventory/dashboard`)
- `GET /stats` - Obter estatísticas do estoque

**Autenticação**: Todos os endpoints protegidos com `@UseGuards(JwtAuthGuard)`

### Frontend (Next.js 15 + TailwindCSS)

#### 1. Páginas Criadas

**Dashboard de Estoque** (`/dashboard/estoque`)
- 4 cards de estatísticas:
  - Total de produtos
  - Estoque total (unidades)
  - Produtos com estoque baixo (alerta vermelho)
  - Movimentações recentes (30 dias)
- Seção de ações rápidas (links para cadastro, listagem, movimentações)
- Card de alertas (exibe produtos com estoque abaixo do mínimo)

**Lista de Produtos** (`/dashboard/estoque/produtos`)
- Tabela responsiva com colunas:
  - SKU (monospace)
  - Nome + descrição
  - Preço de venda
  - Estoque atual + mínimo
  - Badge de status (cores: verde/amarelo/vermelho)
  - Ações (botão editar)
- Busca em tempo real (nome ou SKU)
- Paginação (10 produtos por página)
- Empty state elegante

**Novo Produto** (`/dashboard/estoque/produtos/novo`)
- Formulário completo:
  - SKU, Nome, Descrição
  - Preço de venda, Custo
  - Estoque inicial, Estoque mínimo
- Validação no frontend (campos obrigatórios, valores >= 0)
- Feedback de loading durante criação
- Redirecionamento após sucesso

**Editar Produto** (`/dashboard/estoque/produtos/[id]/editar`)
- Carrega dados do produto existente
- Card destacado mostrando estoque atual
- Não permite editar currentStock (somente via movimentações)
- Atualiza informações básicas e estoque mínimo

**Movimentações** (`/dashboard/estoque/movimentacoes`)
- Tabela de histórico:
  - Data/hora formatada (pt-BR)
  - Produto (nome + SKU)
  - Badge de tipo (Entrada/Saída/Ajuste)
  - Quantidade com cor (verde +, vermelho -, amarelo ±)
  - Transição de estoque (anterior → novo)
  - Origem da movimentação
  - Usuário responsável
- Modal de nova movimentação:
  - Seleção de produto (com estoque atual visível)
  - Tipo (ENTRY, EXIT, ADJUSTMENT)
  - Quantidade
  - Origem (MANUAL, MARKETPLACE, ORDER, IMPORT, OTHER)
  - Observações opcionais
- Validação de estoque (backend valida >= 0 em EXIT)
- Atualização automática após criar movimento

#### 2. Estilo e UX

**Tema Consistente**
- Cores: `#111827` (background) + `white` (texto/botões)
- Cards: `bg-[#111827]` + `border-gray-700`
- Inputs: `bg-[#1f2937]` + foco em `border-gray-600`
- Hover states: `hover:bg-white/10`

**Badges Coloridos**
- Status de Estoque:
  - 🟢 Normal: `text-green-400 bg-green-500/10`
  - 🟡 Baixo: `text-yellow-400 bg-yellow-500/10`
  - 🔴 Sem estoque: `text-red-400 bg-red-500/10`
- Tipos de Movimentação:
  - 🟢 Entrada: `text-green-400 bg-green-500/10`
  - 🔴 Saída: `text-red-400 bg-red-500/10`
  - 🟡 Ajuste: `text-yellow-400 bg-yellow-500/10`

**Ícones SVG**
- Uso consistente de ícones Heroicons
- Tamanhos: 16px (badges), 20px (botões), 24px (headers)

**Responsividade**
- Grid adaptativos (1 col mobile → 2/4 cols desktop)
- Tabelas com overflow-x-auto
- Modal centralizado com backdrop

#### 3. Navegação

Atualizado `constants/nav.ts`:
- Adicionado item "Estoque" com ícone `Warehouse` (lucide-react)
- Posicionado após "Usuários" e antes de "Produtos"
- Link: `/dashboard/estoque`

---

## 🔐 Validações e Regras de Negócio

### Backend

1. **SKU Único**: Validação em criação e atualização (409 Conflict)
2. **Preços**: Mínimo 0, aceita decimais (Prisma Decimal)
3. **Estoque Negativo**: Bloqueio em EXIT se `quantity > currentStock`
4. **Transações Atômicas**: Movimentação + atualização de estoque em transação única
5. **Audit Trail**: Registro de userId, previousStock, newStock em todas movimentações
6. **Soft Delete**: Produtos marcados como `active: false` em vez de deletados
7. **Timestamps**: `createdAt` e `updatedAt` automáticos

### Frontend

1. **Campos Obrigatórios**: Marcados com `*`, validação HTML5 `required`
2. **Números Positivos**: `min="0"` em inputs numéricos
3. **Feedback Visual**: Loading states, disabled buttons, mensagens de erro
4. **Empty States**: Mensagens amigáveis quando não há dados
5. **Confirmações**: Modal para criar movimentação (evita ações acidentais)

---

## 📁 Estrutura de Arquivos

### Backend
```
backend/src/modules/inventory/
├── dto/
│   ├── create-product.dto.ts
│   ├── update-product.dto.ts
│   ├── create-movement.dto.ts
│   └── query-products.dto.ts
├── inventory.service.ts
├── products.controller.ts
├── movements.controller.ts
├── inventory-dashboard.controller.ts
└── inventory.module.ts

backend/prisma/
├── schema.prisma (modelos Product, StockMovement, Warehouse)
└── migrations/
    └── 20251110140036_add_inventory_models/
        └── migration.sql
```

### Frontend
```
frontend/app/dashboard/estoque/
├── page.tsx (dashboard principal)
├── produtos/
│   ├── page.tsx (lista)
│   ├── novo/
│   │   └── page.tsx (cadastro)
│   └── [id]/
│       └── editar/
│           └── page.tsx (edição)
└── movimentacoes/
    └── page.tsx (histórico + modal)

frontend/constants/
└── nav.ts (navegação atualizada)
```

---

## 🧪 Como Testar

### 1. Criar Produto
```bash
curl -X POST http://localhost:3001/api/v1/inventory/products \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "sku": "PROD-001",
    "name": "Notebook Dell",
    "description": "Notebook i5 8GB 256GB SSD",
    "price": 3500.00,
    "cost": 2800.00,
    "currentStock": 10,
    "minStock": 5
  }'
```

### 2. Adicionar Movimentação (Entrada)
```bash
curl -X POST http://localhost:3001/api/v1/inventory/movements \
  -H "Authorization: Bearer <TOKEN>" \
  -H "Content-Type: application/json" \
  -d '{
    "productId": "<PRODUCT_ID>",
    "type": "ENTRY",
    "quantity": 20,
    "origin": "MANUAL",
    "note": "Reposição de estoque"
  }'
```

### 3. Dashboard Stats
```bash
curl http://localhost:3001/api/v1/inventory/dashboard/stats \
  -H "Authorization: Bearer <TOKEN>"
```

### 4. Fluxo Completo no Frontend

1. **Login**: Acesse `http://localhost:3000/auth/login`
2. **Dashboard**: Clique em "Estoque" na sidebar
3. **Criar Produto**:
   - Clique "+ Novo Produto"
   - Preencha: SKU "TEST-001", Nome "Produto Teste", Preço "100", Estoque "50", Mín "10"
   - Salve e verifique na lista
4. **Movimentação**:
   - Vá para "Movimentações"
   - Clique "+ Nova Movimentação"
   - Selecione produto, tipo "Saída", quantidade "15"
   - Confirme e veja estoque atualizado (50 → 35)
5. **Verificar Stats**:
   - Volte ao dashboard `/estoque`
   - Verifique estatísticas atualizadas

---

## 🔧 Comandos Úteis

### Regenerar Prisma Client
```bash
docker-compose exec backend npx prisma generate
```

### Ver Migrations
```bash
docker-compose exec backend npx prisma migrate status
```

### Resetar Banco (⚠️ CUIDADO)
```bash
docker-compose exec backend npx prisma migrate reset
```

### Logs do Backend
```bash
docker-compose logs -f backend
```

---

## 📊 Endpoints da API

### Produtos
- `POST   /api/v1/inventory/products` - Criar
- `GET    /api/v1/inventory/products` - Listar (paginado)
- `GET    /api/v1/inventory/products/:id` - Buscar
- `PUT    /api/v1/inventory/products/:id` - Atualizar
- `DELETE /api/v1/inventory/products/:id` - Deletar (soft)

### Movimentações
- `POST /api/v1/inventory/movements` - Criar
- `GET  /api/v1/inventory/movements` - Listar (paginado)
- `GET  /api/v1/inventory/movements/:id` - Buscar

### Dashboard
- `GET /api/v1/inventory/dashboard/stats` - Estatísticas

**Documentação Swagger**: `http://localhost:3001/api/docs`

---

## ✅ Checklist de Implementação

- [x] Modelos Prisma (Product, StockMovement, Warehouse)
- [x] Enums (MovementType, MovementOrigin)
- [x] Migration aplicada com sucesso
- [x] DTOs com validações (class-validator)
- [x] InventoryService completo (CRUD + movimentações + stats)
- [x] Controllers (Products, Movements, Dashboard)
- [x] Guards de autenticação (JwtAuthGuard)
- [x] Documentação Swagger (@ApiTags, @ApiOperation)
- [x] Módulo registrado em app.module.ts
- [x] Página de dashboard (/estoque)
- [x] Página de lista de produtos
- [x] Página de novo produto
- [x] Página de editar produto
- [x] Página de movimentações com modal
- [x] Navegação atualizada (nav.ts)
- [x] Estilo consistente (#111827 + white)
- [x] Responsividade mobile
- [x] Empty states e loading states
- [x] Badges coloridos por status
- [x] Paginação funcional
- [x] Busca em tempo real
- [x] Validações de formulário
- [x] Feedback de erros
- [x] Documentação completa (ETAPA_04_COMPLETA.md)

---

## 🚀 Próximos Passos (Etapa 05)

- **Multi-warehouse**: Associar produtos a múltiplos armazéns
- **Rastreamento de lotes**: Adicionar número de lote/série
- **Relatórios avançados**: Gráficos de movimentação ao longo do tempo
- **Alertas automáticos**: Notificações quando estoque baixo
- **Integração com pedidos**: Baixa automática de estoque ao vender
- **Importação em massa**: Upload de CSV/Excel para produtos
- **Histórico de preços**: Rastrear alterações de preço ao longo do tempo

---

## 📝 Observações Técnicas

### Performance
- Uso de índices únicos (sku)
- Paginação para evitar overload de dados
- Queries otimizadas com Prisma (select específico)

### Segurança
- Autenticação JWT obrigatória
- Validação de dados no backend (não confia no frontend)
- Transações atômicas previnem inconsistências
- Soft delete preserva histórico

### Manutenibilidade
- Código modular (service → controller → route)
- DTOs centralizados
- Enums tipados (TypeScript)
- Documentação Swagger automática
- Comentários em pontos críticos

---

**Desenvolvido por**: PRS ERP Team  
**Última atualização**: 10/11/2024  
**Versão**: 1.0.0
