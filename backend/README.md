# Workspace Backend

API backend em Fastify + Prisma + PostgreSQL.

## Pré-requisitos

- Node.js >= 20
- Docker e Docker Compose (para banco de dados)

## Setup rápido (com Docker Compose)

Sobe tudo (Postgres + API com hot-reload):

```bash
docker compose up --build
```

API disponível em `http://localhost:3000`.

## Setup local (sem container para API)

### 1. Instalar dependências

```bash
npm install
```

### 2. Configurar variáveis de ambiente

```bash
cp .env.example .env
# editar .env com suas credenciais
```

### 3. Subir banco PostgreSQL

```bash
docker compose up postgres -d
```

### 4. Rodar migrations e gerar client Prisma

```bash
npm run db:generate
npm run db:migrate
```

### 5. (Opcional) Popular banco com dados iniciais

```bash
npm run db:seed
```

### 6. Iniciar servidor em modo desenvolvimento

```bash
npm run dev
```

API disponível em `http://localhost:3000`.

## Scripts úteis

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor com hot-reload (tsx watch) |
| `npm run build` | Compila TypeScript para `dist/` |
| `npm start` | Roda build de produção |
| `npm test` | Executa testes (vitest) |
| `npm run lint` | Lint com ESLint |
| `npm run typecheck` | Checagem de tipos sem emitir |
| `npm run db:migrate` | Criar/aplicar migrations Prisma |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:seed` | Seed do banco |

## Variáveis de ambiente

Veja `.env.example` para lista completa. Principais:

- `DATABASE_URL` — conexão PostgreSQL
- `JWT_SECRET` — segredo para tokens de acesso (mín. 32 chars)
- `JWT_REFRESH_SECRET` — segredo para refresh tokens (mín. 32 chars)
- `PORT` — porta do servidor (default: 3000)
- `CORS_ORIGINS` — origens permitidas (separadas por vírgula)

## Produção (Docker)

```bash
docker build -t workspace-backend .
docker run -p 3000:3000 --env-file .env workspace-backend
```
