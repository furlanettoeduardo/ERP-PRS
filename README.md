# 🚀 ERP - Sistema de Gestão Empresarial

Sistema ERP moderno desenvolvido para gerenciar vendas em múltiplos marketplaces (Mercado Livre, Shopee, Amazon e WooCommerce).

## 📋 Stack Tecnológica

### Backend
- **Framework:** NestJS (TypeScript)
- **ORM:** Prisma
- **Banco de Dados:** PostgreSQL
- **Autenticação:** JWT (Passport)
- **Cache/Filas:** Redis + BullMQ
- **Validação:** class-validator, class-transformer
- **Testes:** Jest
- **Documentação:** Swagger

### Frontend
- **Framework:** Next.js 15 (App Router)
- **Linguagem:** TypeScript
- **UI:** TailwindCSS + ShadCN/UI
- **Estado:** Zustand
- **Requisições:** Axios
- **Ícones:** Lucide React

### DevOps
- **Containerização:** Docker + Docker Compose
- **Banco de Dados:** PostgreSQL 16
- **Cache:** Redis 7

---

## 🏗️ Estrutura do Projeto

```
erp/
├── backend/                 # API NestJS
│   ├── src/
│   │   ├── modules/        # Módulos da aplicação
│   │   ├── prisma/         # Configuração Prisma
│   │   ├── app.module.ts
│   │   └── main.ts
│   ├── prisma/
│   │   └── schema.prisma   # Schema do banco
│   ├── Dockerfile
│   └── package.json
│
├── frontend/               # App Next.js
│   ├── app/               # App Router do Next.js
│   ├── components/        # Componentes React
│   ├── lib/              # Utilitários
│   ├── styles/           # Estilos globais
│   ├── Dockerfile
│   └── package.json
│
├── docker-compose.yml     # Orquestração de containers
├── .env.example          # Exemplo de variáveis de ambiente
└── README.md
```

---

## 🚀 Instalação e Configuração

### Pré-requisitos

- **Node.js** 20+ (LTS)
- **npm** ou **yarn**
- **Docker** e **Docker Compose** (para containerização)
- **Git**

### 1. Clonar o Repositório

```bash
git clone <url-do-repositorio>
cd ERP-Prs
```

### 2. Configurar Variáveis de Ambiente

#### Raiz do projeto (para Docker Compose)
```bash
cp .env.example .env
```

#### Backend
```bash
cd backend
cp .env.example .env
```

Edite o arquivo `.env` do backend com suas configurações:
```env
DATABASE_URL="postgresql://erp_user:erp_password@localhost:5432/erp_database?schema=public"
JWT_SECRET="your-super-secret-jwt-key"
```

#### Frontend
```bash
cd ../frontend
cp .env.example .env
```

Edite o arquivo `.env` do frontend:
```env
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
```

---

## 💻 Executar Localmente (Desenvolvimento)

### Backend

```bash
cd backend
npm install
npx prisma generate
npx prisma migrate dev
npm run start:dev
```

O backend estará disponível em: `http://localhost:3001`
Documentação Swagger: `http://localhost:3001/api/docs`

### Frontend

```bash
cd frontend
npm install
npm run dev
```

O frontend estará disponível em: `http://localhost:3000`

---

## 🐳 Executar com Docker

### Iniciar todos os serviços

```bash
# Na raiz do projeto
docker-compose up -d
```

Isso irá iniciar:
- **PostgreSQL** (porta 5432)
- **Redis** (porta 6379)
- **Backend** (porta 3001)
- **Frontend** (porta 3000)

### Verificar status dos containers

```bash
docker-compose ps
```

### Ver logs

```bash
# Todos os serviços
docker-compose logs -f

# Apenas backend
docker-compose logs -f backend

# Apenas frontend
docker-compose logs -f frontend
```

### Parar os serviços

```bash
docker-compose down
```

### Remover volumes (apaga dados do banco)

```bash
docker-compose down -v
```

---

## 📊 Banco de Dados

### Executar migrações

```bash
cd backend
npx prisma migrate dev
```

### Gerar Prisma Client

```bash
npx prisma generate
```

### Abrir Prisma Studio (GUI do banco)

```bash
npx prisma studio
```

### Resetar banco de dados

```bash
npx prisma migrate reset
```

---

## 🧪 Testes

### Backend

```bash
cd backend

# Testes unitários
npm run test

# Testes com coverage
npm run test:cov

# Testes e2e
npm run test:e2e

# Watch mode
npm run test:watch
```

---

## 🔧 Scripts Úteis

### Backend

```bash
npm run start:dev      # Desenvolvimento com hot-reload
npm run start:debug    # Desenvolvimento com debug
npm run build          # Build para produção
npm run start:prod     # Executar build de produção
npm run lint           # Executar ESLint
npm run format         # Formatar código com Prettier
```

### Frontend

```bash
npm run dev            # Desenvolvimento
npm run build          # Build para produção
npm run start          # Executar build de produção
npm run lint           # Executar ESLint
npm run format         # Formatar código com Prettier
```

---

## 📝 Convenções de Código

### Commits

Seguimos o padrão Conventional Commits:

```
feat: adiciona nova funcionalidade
fix: corrige um bug
docs: atualiza documentação
style: formatação de código
refactor: refatoração de código
test: adiciona ou corrige testes
chore: tarefas de manutenção
```

### Branches

- `main` - Produção
- `develop` - Desenvolvimento
- `feature/<nome>` - Nova funcionalidade
- `fix/<nome>` - Correção de bug
- `hotfix/<nome>` - Correção urgente

---

## 📚 Próximos Passos

Após a configuração do ambiente, você pode começar a implementar:

1. **Módulo de Autenticação**
   - Registro de usuários
   - Login/Logout
   - Guards JWT
   - Refresh tokens

2. **Módulo de Usuários**
   - CRUD de usuários
   - Perfis e permissões
   - Gerenciamento de roles

3. **Integrações com Marketplaces**
   - Mercado Livre API
   - Shopee API
   - Amazon SP-API
   - WooCommerce REST API

4. **Gestão de Produtos**
   - Catálogo unificado
   - Sincronização com marketplaces
   - Controle de estoque

---

## 🤝 Contribuindo

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📄 Licença

Este projeto está sob a licença MIT.

---

## 🔗 Links Úteis

- [Documentação NestJS](https://docs.nestjs.com/)
- [Documentação Next.js](https://nextjs.org/docs)
- [Documentação Prisma](https://www.prisma.io/docs)
- [Documentação TailwindCSS](https://tailwindcss.com/docs)
- [Documentação ShadCN/UI](https://ui.shadcn.com/)
- [Docker Docs](https://docs.docker.com/)

---

**Status:** ✅ Ambiente configurado e pronto para desenvolvimento
