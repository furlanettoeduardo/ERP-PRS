# 🚀 Guia de Início Rápido - ERP

## Começando em 5 minutos

### Pré-requisitos instalados
- ✅ Node.js 20+
- ✅ Docker Desktop
- ✅ Git

---

## 📦 Opção 1: Desenvolvimento Local (sem Docker)

### 1. Instalar dependências

```powershell
# Backend
cd backend
npm install
npx prisma generate

# Frontend (em outro terminal)
cd frontend
npm install
```

### 2. Configurar variáveis de ambiente

```powershell
# Raiz
Copy-Item .env.example .env

# Backend
cd backend
Copy-Item .env.example .env

# Frontend
cd frontend
Copy-Item .env.example .env.local
```

### 3. Iniciar banco de dados (com Docker)

```powershell
docker run -d --name erp-postgres -e POSTGRES_USER=erp_user -e POSTGRES_PASSWORD=erp_password -e POSTGRES_DB=erp_database -p 5432:5432 postgres:16-alpine
```

### 4. Executar migrações

```powershell
cd backend
npx prisma migrate dev
```

### 5. Iniciar servidores

```powershell
# Backend (terminal 1)
cd backend
npm run start:dev

# Frontend (terminal 2)
cd frontend
npm run dev
```

✅ **Pronto!** Acesse:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs

---

## 🐳 Opção 2: Com Docker (Recomendado)

### 1. Configurar variáveis de ambiente

```powershell
Copy-Item .env.example .env
Copy-Item backend\.env.example backend\.env
Copy-Item frontend\.env.example frontend\.env.local
```

### 2. Iniciar tudo com Docker Compose

```powershell
docker-compose up -d
```

### 3. Aguardar containers iniciarem (30s)

```powershell
docker-compose logs -f
```

✅ **Pronto!** Os serviços estarão disponíveis:
- Frontend: http://localhost:3000
- Backend: http://localhost:3001
- Swagger: http://localhost:3001/api/docs
- PostgreSQL: localhost:5432
- Redis: localhost:6379

---

## 🛠️ Comandos Úteis

### Docker

```powershell
# Iniciar ambiente
.\dev-start.ps1

# Parar ambiente
.\dev-stop.ps1

# Ver logs
docker-compose logs -f

# Ver logs de um serviço específico
docker-compose logs -f backend

# Reiniciar serviço
docker-compose restart backend

# Parar e remover tudo (incluindo volumes)
docker-compose down -v
```

### Backend

```powershell
cd backend

# Desenvolvimento
npm run start:dev

# Build
npm run build

# Prisma
npx prisma studio          # Abrir GUI do banco
npx prisma migrate dev     # Criar migração
npx prisma generate        # Gerar client

# Testes
npm test
npm run test:cov
```

### Frontend

```powershell
cd frontend

# Desenvolvimento
npm run dev

# Build
npm run build
npm start

# Lint e formatação
npm run lint
npm run format
```

---

## 🐛 Problemas Comuns

### Erro: "Port already in use"

```powershell
# Ver o que está usando a porta
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432

# Matar processo (substitua PID)
taskkill /PID <PID> /F
```

### Erro: Docker não inicia

```powershell
# Verificar status do Docker
docker info

# Reiniciar Docker Desktop
# Settings > Reset > Restart Docker Desktop
```

### Erro: Prisma Client não encontrado

```powershell
cd backend
npx prisma generate
```

### Erro: Module not found

```powershell
# Backend
cd backend
rm -rf node_modules
npm install

# Frontend
cd frontend
rm -rf node_modules
npm install
```

---

## 📚 Próximos Passos

Após o ambiente configurado:

1. ✅ Explore a interface em http://localhost:3000
2. ✅ Veja a documentação da API em http://localhost:3001/api/docs
3. ✅ Abra o Prisma Studio: `cd backend; npx prisma studio`
4. 🚀 Comece a desenvolver os módulos funcionais!

---

## 💡 Dicas

- Use o **Prisma Studio** para visualizar dados do banco
- Configure o **ESLint** e **Prettier** no VS Code
- Instale extensões recomendadas:
  - ESLint
  - Prettier
  - Prisma
  - Docker
  - REST Client (para testar APIs)

---

**Ambiente pronto!** 🎉 Agora você pode começar a desenvolver o ERP.
