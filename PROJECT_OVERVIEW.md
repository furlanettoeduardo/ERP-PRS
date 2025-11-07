# 🏢 ERP - Sistema de Gestão Empresarial
## Visão Geral do Projeto

---

## 📋 Sobre o Projeto

Sistema ERP moderno desenvolvido para gerenciar vendas em múltiplos marketplaces:
- 🛒 **Mercado Livre**
- 🛍️ **Shopee**
- 📦 **Amazon**
- 🌐 **WooCommerce**

---

## 🎯 Objetivos

1. **Centralizar** a gestão de produtos em uma única plataforma
2. **Sincronizar** estoque entre todos os marketplaces
3. **Automatizar** processos de vendas e atualização de dados
4. **Facilitar** o controle financeiro e operacional
5. **Escalar** o negócio com tecnologia moderna

---

## 🏗️ Arquitetura

```
┌─────────────────────────────────────────────────────┐
│                    FRONTEND                         │
│          Next.js 15 + TailwindCSS                   │
│              (Interface Web)                        │
└────────────────┬────────────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────────────┐
│                    BACKEND                          │
│              NestJS + Prisma                        │
│           (API + Lógica de Negócio)                 │
└────────────────┬────────────────────────────────────┘
                 │
        ┌────────┴────────┐
        │                 │
        ▼                 ▼
┌──────────────┐   ┌──────────────┐
│  PostgreSQL  │   │    Redis     │
│  (Database)  │   │ (Cache/Queue)│
└──────────────┘   └──────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────┐
│            INTEGRAÇÕES MARKETPLACE                  │
│  Mercado Livre │ Shopee │ Amazon │ WooCommerce     │
└─────────────────────────────────────────────────────┘
```

---

## 🛠️ Stack Tecnológica Completa

### Backend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Node.js | 20 LTS | Runtime JavaScript |
| TypeScript | 5.3 | Linguagem principal |
| NestJS | 10.3 | Framework backend |
| Prisma | 5.7 | ORM |
| PostgreSQL | 16 | Banco de dados |
| JWT | - | Autenticação |
| Passport | - | Estratégias de auth |
| class-validator | - | Validação de dados |
| Swagger | - | Documentação API |
| BullMQ | - | Filas de processamento |
| Redis | 7 | Cache e filas |
| Jest | - | Testes |

### Frontend
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Next.js | 15 | Framework React |
| React | 18 | Biblioteca UI |
| TypeScript | 5.3 | Linguagem principal |
| TailwindCSS | 3.4 | Framework CSS |
| ShadCN/UI | - | Componentes UI |
| Radix UI | - | Primitivos de UI |
| Zustand | - | Gerenciamento de estado |
| Axios | - | Cliente HTTP |
| Lucide React | - | Ícones |
| date-fns | - | Manipulação de datas |
| Zod | - | Validação de schemas |

### DevOps
| Tecnologia | Versão | Propósito |
|------------|--------|-----------|
| Docker | - | Containerização |
| Docker Compose | - | Orquestração |
| ESLint | - | Linting |
| Prettier | - | Formatação |
| Git | - | Controle de versão |

---

## 📦 Módulos do Sistema

### ✅ Implementados (Etapa 00)
- [x] Estrutura base do projeto
- [x] Configuração do ambiente
- [x] Docker Compose
- [x] Backend NestJS básico
- [x] Frontend Next.js básico
- [x] Prisma configurado
- [x] Health check endpoint

### 🚧 Planejados

#### Etapa 01: Autenticação e Usuários
- [ ] Registro de usuários
- [ ] Login/Logout
- [ ] JWT Guards
- [ ] Refresh tokens
- [ ] Recuperação de senha
- [ ] Roles e permissões (RBAC)
- [ ] CRUD de usuários
- [ ] Upload de avatar

#### Etapa 02: Dashboard
- [ ] Layout principal
- [ ] Sidebar navigation
- [ ] Header com menu do usuário
- [ ] Páginas protegidas
- [ ] Métricas e KPIs

#### Etapa 03: Produtos
- [ ] CRUD de produtos
- [ ] Categorias
- [ ] Variações (tamanhos, cores)
- [ ] Imagens de produtos
- [ ] Importação em lote

#### Etapa 04: Estoque
- [ ] Controle de estoque
- [ ] Movimentações
- [ ] Alertas de estoque baixo
- [ ] Inventário

#### Etapa 05: Integrações - Mercado Livre
- [ ] OAuth2
- [ ] Listagem de produtos
- [ ] Sincronização de estoque
- [ ] Processamento de vendas
- [ ] Atualização de preços

#### Etapa 06: Integrações - Shopee
- [ ] Autenticação API
- [ ] Gestão de produtos
- [ ] Sincronização
- [ ] Webhooks

#### Etapa 07: Integrações - Amazon
- [ ] SP-API
- [ ] Catálogo de produtos
- [ ] Fulfillment
- [ ] Relatórios

#### Etapa 08: Integrações - WooCommerce
- [ ] REST API
- [ ] Produtos e variações
- [ ] Pedidos
- [ ] Webhooks

#### Etapa 09: Vendas e Pedidos
- [ ] Central de pedidos
- [ ] Status de pedidos
- [ ] Rastreamento
- [ ] Notas fiscais
- [ ] Faturamento

#### Etapa 10: Relatórios e Analytics
- [ ] Dashboard de vendas
- [ ] Relatórios financeiros
- [ ] Análise de performance
- [ ] Exportação de dados

#### Etapa 11: Notificações
- [ ] Sistema de notificações
- [ ] E-mail
- [ ] Push notifications
- [ ] Webhooks

#### Etapa 12: Configurações
- [ ] Configurações gerais
- [ ] APIs e integrações
- [ ] Preferências do usuário
- [ ] Logs de auditoria

---

## 🔐 Segurança

- ✅ JWT para autenticação
- ✅ Variáveis de ambiente
- ✅ Validação de dados (class-validator)
- ✅ CORS configurado
- ✅ Helmet (headers de segurança)
- 🚧 Rate limiting (a implementar)
- 🚧 RBAC (a implementar)
- 🚧 2FA (a implementar)

---

## 📈 Performance

- ✅ Redis para cache
- ✅ BullMQ para filas
- ✅ Next.js com SSR/SSG
- ✅ Docker multi-stage builds
- 🚧 CDN para assets (a implementar)
- 🚧 Database indexing (a implementar)
- 🚧 Load balancing (a implementar)

---

## 🧪 Qualidade de Código

- ✅ TypeScript strict mode
- ✅ ESLint configurado
- ✅ Prettier configurado
- ✅ Conventional Commits
- ✅ Jest configurado
- 🚧 Testes E2E (a implementar)
- 🚧 CI/CD (a implementar)
- 🚧 Code coverage > 80% (a implementar)

---

## 📊 Métricas do Projeto

### Código
- **Linhas de código**: ~5.000 (base)
- **Arquivos criados**: 50+
- **Pacotes instalados**: 1.266
  - Backend: 807 pacotes
  - Frontend: 459 pacotes

### Dependências Principais
- **Backend**: 18 dependências diretas
- **Frontend**: 13 dependências diretas
- **DevDependencies**: 30+ ferramentas de desenvolvimento

---

## 🌍 Ambientes

### Desenvolvimento
- Backend: http://localhost:3001
- Frontend: http://localhost:3000
- Swagger: http://localhost:3001/api/docs
- Prisma Studio: http://localhost:5555
- PostgreSQL: localhost:5432
- Redis: localhost:6379

### Produção (Planejado)
- VPS com Docker
- Domínio próprio
- SSL/TLS (Let's Encrypt)
- Backup automático
- Monitoramento

---

## 📝 Convenções

### Commits
- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Documentação
- `style:` Formatação
- `refactor:` Refatoração
- `test:` Testes
- `chore:` Manutenção

### Branches
- `main` - Produção
- `develop` - Desenvolvimento
- `feature/<nome>` - Nova feature
- `fix/<nome>` - Correção
- `hotfix/<nome>` - Correção urgente

### Código
- Inglês para código
- Português para documentação
- Componentes em PascalCase
- Funções em camelCase
- Arquivos em kebab-case

---

## 👥 Equipe

- **Desenvolvedor**: ERP Team
- **Data de início**: 07/11/2025
- **Status**: Etapa 00 concluída ✅

---

## 📚 Documentação

- `README.md` - Documentação principal
- `QUICK_START.md` - Guia de início rápido
- `SETUP_CHECKLIST.md` - Checklist de configuração
- `TESTING_GUIDE.md` - Guia de testes
- `COMMANDS.md` - Comandos úteis
- `PROJECT_OVERVIEW.md` - Este arquivo

---

## 🎯 Roadmap 2025-2026

### Q4 2025
- ✅ Etapa 00: Configuração base
- 🚧 Etapa 01: Autenticação
- 🚧 Etapa 02: Dashboard
- 🚧 Etapa 03: Produtos

### Q1 2026
- 🚧 Etapa 04: Estoque
- 🚧 Etapa 05: Integração Mercado Livre
- 🚧 Etapa 06: Integração Shopee

### Q2 2026
- 🚧 Etapa 07: Integração Amazon
- 🚧 Etapa 08: Integração WooCommerce
- 🚧 Etapa 09: Vendas e Pedidos

### Q3 2026
- 🚧 Etapa 10: Relatórios
- 🚧 Etapa 11: Notificações
- 🚧 Etapa 12: Configurações

### Q4 2026
- 🚧 Deploy em produção
- 🚧 Testes de carga
- 🚧 Documentação final

---

## 🚀 Como Contribuir

1. Fork o projeto
2. Crie uma branch (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'feat: adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

---

## 📞 Suporte

- **Email**: suporte@erp.com
- **Documentação**: Ver arquivos `.md` na raiz
- **Issues**: GitHub Issues (quando disponível)

---

## ⚖️ Licença

MIT License - Veja arquivo `LICENSE` para detalhes.

---

**Última atualização**: 07/11/2025
**Versão**: 1.0.0-beta
**Status**: 🟢 Em desenvolvimento ativo
