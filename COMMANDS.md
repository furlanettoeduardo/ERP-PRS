# 📝 COMANDOS ÚTEIS - ERP

## 🚀 Inicialização

```powershell
# Iniciar ambiente completo com Docker
.\dev-start.ps1

# OU manualmente
docker-compose up -d

# Parar ambiente
.\dev-stop.ps1

# OU manualmente
docker-compose down
```

---

## 🐳 Docker

```powershell
# Iniciar serviços
docker-compose up -d

# Parar serviços
docker-compose down

# Ver status
docker-compose ps

# Ver logs (todos)
docker-compose logs -f

# Ver logs (específico)
docker-compose logs -f backend
docker-compose logs -f frontend
docker-compose logs -f postgres

# Reiniciar serviço
docker-compose restart backend

# Remover tudo (incluindo volumes)
docker-compose down -v

# Rebuild containers
docker-compose up -d --build

# Entrar no container
docker exec -it erp-backend sh
docker exec -it erp-frontend sh
docker exec -it erp-postgres psql -U erp_user -d erp_database
```

---

## 💻 Backend (NestJS)

```powershell
cd backend

# Desenvolvimento
npm run start:dev          # Hot-reload
npm run start:debug        # Com debug
npm run start              # Normal

# Build e Produção
npm run build              # Build
npm run start:prod         # Executar build

# Testes
npm test                   # Testes unitários
npm run test:watch         # Watch mode
npm run test:cov           # Com coverage
npm run test:e2e           # Testes E2E
npm run test:debug         # Com debug

# Qualidade de Código
npm run lint               # ESLint
npm run lint -- --fix      # ESLint com correção automática
npm run format             # Prettier

# Prisma
npx prisma generate        # Gerar client
npx prisma migrate dev     # Criar migração
npx prisma migrate deploy  # Aplicar migrações (prod)
npx prisma studio          # GUI do banco
npx prisma db push         # Sincronizar schema (dev)
npx prisma db pull         # Puxar schema do banco
npx prisma format          # Formatar schema.prisma
npx prisma validate        # Validar schema

# Instalação
npm install                # Instalar dependências
npm ci                     # Clean install (CI/CD)
```

---

## 🌐 Frontend (Next.js)

```powershell
cd frontend

# Desenvolvimento
npm run dev                # Servidor dev (porta 3000)

# Build e Produção
npm run build              # Build para produção
npm start                  # Executar build

# Qualidade de Código
npm run lint               # ESLint
npm run lint -- --fix      # ESLint com correção automática
npm run format             # Prettier

# Instalação
npm install                # Instalar dependências
npm ci                     # Clean install
```

---

## 🗄️ Banco de Dados (PostgreSQL)

```powershell
# Conectar ao banco (Docker)
docker exec -it erp-postgres psql -U erp_user -d erp_database

# Comandos SQL úteis
\l                         # Listar databases
\dt                        # Listar tabelas
\d users                   # Descrever tabela
\q                         # Sair

# Backup (Docker)
docker exec -t erp-postgres pg_dump -U erp_user erp_database > backup.sql

# Restore (Docker)
docker exec -i erp-postgres psql -U erp_user -d erp_database < backup.sql

# Criar novo banco
docker exec -it erp-postgres psql -U erp_user -c "CREATE DATABASE novo_db;"

# Dropar banco
docker exec -it erp-postgres psql -U erp_user -c "DROP DATABASE IF EXISTS nome_db;"
```

---

## 🔴 Redis

```powershell
# Conectar ao Redis (Docker)
docker exec -it erp-redis redis-cli

# Comandos úteis
PING                       # Testar conexão
KEYS *                     # Listar todas as keys
GET key_name               # Obter valor
SET key_name value         # Definir valor
DEL key_name               # Deletar key
FLUSHALL                   # Limpar tudo
INFO                       # Informações do servidor
```

---

## 🔧 Git

```powershell
# Inicializar repositório
git init
git add .
git commit -m "feat: configuração inicial do projeto"

# Criar branch
git checkout -b feature/nova-funcionalidade

# Commit seguindo Conventional Commits
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug no login"
git commit -m "docs: atualiza README"
git commit -m "style: formata código"
git commit -m "refactor: refatora módulo de usuários"
git commit -m "test: adiciona testes unitários"
git commit -m "chore: atualiza dependências"

# Push
git push origin main
```

---

## 📦 NPM / Gerenciamento de Pacotes

```powershell
# Instalar pacote
npm install <package>          # Dependência de produção
npm install -D <package>       # Dependência de dev
npm install -g <package>       # Global

# Remover pacote
npm uninstall <package>

# Atualizar pacotes
npm update                     # Atualizar todos
npm update <package>           # Atualizar específico

# Verificar vulnerabilidades
npm audit                      # Ver vulnerabilidades
npm audit fix                  # Corrigir automaticamente
npm audit fix --force          # Corrigir (breaking changes)

# Listar pacotes
npm list                       # Todos
npm list --depth=0             # Apenas top-level
npm list <package>             # Específico

# Limpar cache
npm cache clean --force
```

---

## 🔍 Debug e Troubleshooting

```powershell
# Ver processos usando portas
netstat -ano | findstr :3000
netstat -ano | findstr :3001
netstat -ano | findstr :5432
netstat -ano | findstr :6379

# Matar processo por PID
taskkill /PID <PID> /F

# Verificar versões
node -v
npm -v
docker -v
docker-compose -v

# Limpar tudo e reinstalar
cd backend
rm -rf node_modules package-lock.json
npm install

cd ../frontend
rm -rf node_modules package-lock.json .next
npm install

# Limpar Docker
docker system prune -a         # Remove tudo não usado
docker volume prune            # Remove volumes não usados
docker image prune -a          # Remove imagens não usadas
```

---

## 🧪 Testes de API (com curl)

```powershell
# Health check
curl http://localhost:3001/api/v1

# POST com JSON
curl -X POST http://localhost:3001/api/v1/users `
  -H "Content-Type: application/json" `
  -d '{"email":"test@example.com","password":"123456"}'

# GET com autenticação
curl http://localhost:3001/api/v1/users `
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Monitoramento

```powershell
# Ver uso de recursos Docker
docker stats

# Ver logs em tempo real
docker-compose logs -f --tail=100

# Ver espaço em disco
docker system df

# Inspecionar container
docker inspect erp-backend
docker inspect erp-postgres
```

---

## 🎯 Shortcuts Úteis

```powershell
# Backend dev rápido
cd backend; npm run start:dev

# Frontend dev rápido
cd frontend; npm run dev

# Prisma Studio
cd backend; npx prisma studio

# Ver todos os containers
docker ps -a

# Parar todos os containers
docker stop $(docker ps -aq)

# Remover todos os containers
docker rm $(docker ps -aq)
```

---

## 📝 Aliases Sugeridos (PowerShell Profile)

Adicione ao seu `$PROFILE`:

```powershell
# Abrir profile
notepad $PROFILE

# Adicionar aliases
function erp-start { Set-Location "C:\Users\prsed\Desktop\projects\ERP-Prs"; .\dev-start.ps1 }
function erp-stop { Set-Location "C:\Users\prsed\Desktop\projects\ERP-Prs"; .\dev-stop.ps1 }
function erp-logs { docker-compose logs -f }
function erp-backend { Set-Location "C:\Users\prsed\Desktop\projects\ERP-Prs\backend"; npm run start:dev }
function erp-frontend { Set-Location "C:\Users\prsed\Desktop\projects\ERP-Prs\frontend"; npm run dev }
function erp-studio { Set-Location "C:\Users\prsed\Desktop\projects\ERP-Prs\backend"; npx prisma studio }
```

Depois use:
```powershell
erp-start      # Iniciar tudo
erp-stop       # Parar tudo
erp-logs       # Ver logs
erp-backend    # Iniciar backend
erp-frontend   # Iniciar frontend
erp-studio     # Abrir Prisma Studio
```

---

**💡 Dica**: Salve este arquivo para referência rápida!
