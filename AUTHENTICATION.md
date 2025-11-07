# 📚 Módulo de Autenticação e Usuários - Documentação

## ✅ Funcionalidades Implementadas

### Backend (NestJS)

#### 1. **Módulo Users** (`/api/v1/users`)

**Endpoints disponíveis:**

- `GET /users` - Listar usuários com paginação e filtros
  - Query params: `page`, `limit`, `search`, `role`
  - Requer autenticação JWT
  
- `GET /users/:id` - Buscar usuário por ID
  - Requer autenticação JWT
  
- `POST /users` - Criar novo usuário (apenas admin)
  - Requer autenticação JWT + role admin
  - Body: `{ name, email, password, role? }`
  
- `PATCH /users/:id` - Atualizar usuário (admin/manager)
  - Requer autenticação JWT + role admin ou manager
  - Body: `{ name?, role?, active? }`
  
- `DELETE /users/:id` - Desativar usuário (apenas admin)
  - Soft delete - marca como inativo
  - Requer autenticação JWT + role admin

**DTOs implementados:**
- `CreateUserDto` - Validação para criação
- `UpdateUserDto` - Validação para atualização
- `QueryUsersDto` - Paginação e filtros
- `UserEntity` - Entidade com exclusão de senha

#### 2. **Módulo Auth** (`/api/v1/auth`)

**Endpoints disponíveis:**

- `POST /auth/register` - Registrar novo usuário
  - Body: `{ name, email, password }`
  - Retorna: `{ accessToken, refreshToken, tokenType, expiresIn, user }`
  
- `POST /auth/login` - Autenticar usuário
  - Body: `{ email, password }`
  - Retorna: `{ accessToken, refreshToken, tokenType, expiresIn, user }`
  
- `POST /auth/refresh` - Renovar access token
  - Body: `{ refreshToken }`
  - Retorna novos tokens
  
- `POST /auth/logout` - Invalidar refresh token
  - Body: `{ refreshToken }`
  
- `GET /auth/me` - Obter perfil do usuário autenticado
  - Requer autenticação JWT
  - Retorna dados do usuário sem senha

**Segurança implementada:**
- Senhas hasheadas com bcrypt
- JWT com expiração de 1 hora
- Refresh tokens com expiração de 7 dias
- Refresh tokens únicos por sessão
- Revogação de tokens no logout
- Validação de usuário ativo

**Guards e Decorators:**
- `JwtAuthGuard` - Proteção de rotas com JWT
- `RolesGuard` - Controle de acesso baseado em roles
- `@CurrentUser()` - Obter usuário autenticado
- `@Roles('admin', 'manager')` - Definir roles permitidas

#### 3. **Testes Unitários**

Testes implementados com Jest:
- `auth.service.spec.ts` - Testes de registro, login e refresh
- `users.service.spec.ts` - Testes de CRUD de usuários

### Frontend (Next.js 15)

#### 1. **Páginas Implementadas**

- `/` - Landing page com links para login/registro
  - Redireciona para dashboard se autenticado
  
- `/login` - Página de login
  - Formulário com email e senha
  - Validação client-side
  - Feedback de erros
  - Redireciona para dashboard após login
  
- `/register` - Página de registro
  - Formulário com nome, email e senha
  - Validação de senha (mínimo 6 caracteres)
  - Feedback de erros
  - Login automático após registro
  
- `/dashboard` - Dashboard protegido
  - Exibe dados do usuário autenticado
  - Botão de logout
  - Navbar com informações do usuário

#### 2. **Gerenciamento de Estado**

**Zustand Store** (`store/authStore.ts`):
- Estado: `user`, `accessToken`, `refreshToken`, `isAuthenticated`, `isLoading`
- Ações: `setAuth()`, `setUser()`, `clearAuth()`, `setLoading()`
- Persistência de dados do usuário (sem tokens sensíveis)
- Tokens armazenados em cookies HTTP-only

#### 3. **Autenticação Segura**

**Cookies HTTP-only:**
- `accessToken` - Expira em 1 hora
- `refreshToken` - Expira em 7 dias
- Flags: `secure` (prod), `sameSite: strict`

**Interceptores Axios:**
- Adiciona token JWT automaticamente nas requisições
- Refresh automático de token expirado
- Redireciona para login em caso de falha

**Middleware Next.js:**
- Proteção de rotas privadas
- Redirecionamento automático baseado em autenticação
- Preserva URL de destino após login

#### 4. **Serviços**

**authService** (`lib/auth.ts`):
- `login()` - Autenticação
- `register()` - Registro
- `logout()` - Logout
- `refreshToken()` - Renovação de token
- `getProfile()` - Obter perfil

**API Client** (`lib/api.ts`):
- Configuração base do Axios
- Interceptores de request/response
- Refresh automático de token
- Tratamento de erros

## 🔐 Fluxo de Autenticação

### 1. Registro/Login
```
Frontend → POST /auth/register ou /auth/login
Backend → Valida credenciais
Backend → Cria access token (JWT, 1h)
Backend → Cria refresh token (random, 7d)
Backend → Salva refresh token no BD
Frontend → Armazena tokens em cookies
Frontend → Atualiza store Zustand
Frontend → Redireciona para /dashboard
```

### 2. Requisição Autenticada
```
Frontend → GET /users (com cookie accessToken)
Axios Interceptor → Adiciona Bearer token no header
Backend → JwtAuthGuard valida token
Backend → Retorna dados
```

### 3. Token Expirado (Refresh Automático)
```
Frontend → GET /users
Backend → 401 Unauthorized (token expirado)
Axios Interceptor → POST /auth/refresh com refreshToken
Backend → Valida refresh token
Backend → Gera novos tokens
Frontend → Atualiza cookies
Frontend → Repete requisição original
```

### 4. Logout
```
Frontend → POST /auth/logout com refreshToken
Backend → Revoga refresh token (revoked=true)
Frontend → Remove cookies
Frontend → Limpa store
Frontend → Redireciona para /login
```

## 📊 Schema do Banco de Dados

```prisma
model User {
  id            String         @id @default(uuid())
  name          String
  email         String         @unique
  password      String         // bcrypt hash
  role          String         @default("user")
  active        Boolean        @default(true)
  createdAt     DateTime       @default(now())
  updatedAt     DateTime       @updatedAt
  refreshTokens RefreshToken[]
}

model RefreshToken {
  id        String   @id @default(uuid())
  token     String   @unique
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  revoked   Boolean  @default(false)
  createdAt DateTime @default(now())
  expiresAt DateTime
}
```

## 🧪 Testando a Autenticação

### Via Swagger (http://localhost:3001/api/docs)

1. **Registrar usuário:**
   - POST /api/v1/auth/register
   - Body: `{ "name": "Test User", "email": "test@test.com", "password": "123456" }`

2. **Copiar access token da resposta**

3. **Autenticar no Swagger:**
   - Clicar no botão "Authorize"
   - Inserir: `Bearer {seu-token-aqui}`

4. **Testar endpoints protegidos:**
   - GET /api/v1/users
   - GET /api/v1/auth/me

### Via Frontend (http://localhost:3000)

1. Acesse http://localhost:3000
2. Clique em "Criar Conta"
3. Preencha o formulário e envie
4. Você será redirecionado para o dashboard
5. Teste o logout e login novamente

### Via cURL

```bash
# Registro
curl -X POST http://localhost:3001/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"name":"John","email":"john@example.com","password":"123456"}'

# Login
curl -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"john@example.com","password":"123456"}'

# Usar token
curl -X GET http://localhost:3001/api/v1/auth/me \
  -H "Authorization: Bearer {seu-token}"
```

## 🎯 Roles e Permissões

- **user** (padrão) - Acesso básico ao sistema
- **manager** - Pode atualizar usuários
- **admin** - Pode criar, atualizar e desativar usuários

## 📝 Variáveis de Ambiente

### Backend (.env)
```bash
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRES_IN="1h"
DATABASE_URL="postgresql://erp_user:erp_password@postgres:5432/erp_database?schema=public"
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL="http://localhost:3001/api/v1"
NODE_ENV="development"
```

## ✅ Checklist de Implementação

- [x] Prisma Schema com User e RefreshToken
- [x] Migração Prisma aplicada
- [x] Módulo Users com CRUD completo
- [x] Módulo Auth com JWT
- [x] Guards e Decorators
- [x] Testes unitários
- [x] Páginas de login e registro
- [x] Dashboard protegido
- [x] Zustand store
- [x] Interceptores Axios
- [x] Middleware Next.js
- [x] Cookies HTTP-only
- [x] Refresh automático de token
- [x] Documentação Swagger

## 🚀 Próximos Passos

1. ✅ Etapa 01 - Autenticação (COMPLETA)
2. ⏳ Etapa 02 - Dashboard e Layout
3. ⏳ Etapa 03 - Módulo de Produtos
4. ⏳ Etapa 04 - Integrações com Marketplaces
5. ⏳ Etapa 05 - Módulo de Pedidos
