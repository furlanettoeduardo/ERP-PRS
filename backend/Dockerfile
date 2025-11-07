# Backend Dockerfile - NestJS
# Estágio de desenvolvimento
FROM node:20-alpine AS development

WORKDIR /app

# Copiar arquivos de dependências
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm install

# Copiar código fonte
COPY . .

# Gerar Prisma Client
RUN npx prisma generate

# Expor porta
EXPOSE 3001

# Comando de desenvolvimento
CMD ["npm", "run", "start:dev"]

# Estágio de build para produção
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/

RUN npm ci --only=production && npm cache clean --force

COPY . .

RUN npx prisma generate
RUN npm run build

# Estágio de produção
FROM node:20-alpine AS production

WORKDIR /app

ENV NODE_ENV=production

COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY package*.json ./

EXPOSE 3001

CMD ["npm", "run", "start:prod"]
