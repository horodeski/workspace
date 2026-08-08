# Workspace

App pessoal de produtividade e organização. Centraliza ferramentas de organização do dia a dia em um espaço único — lembretes, registros de apoio, quadros visuais e revisão semanal.

## Tech Stack

| Camada | Tecnologias |
|--------|-------------|
| Frontend | React 18, TypeScript, Vite 8, Tailwind CSS, shadcn/ui, Zustand, React Router DOM v7, Tiptap, Framer Motion, React Hook Form, Zod |
| Backend | Fastify 5, TypeScript, Prisma ORM, PostgreSQL 16, JWT (access + refresh tokens), Zod, Resend (email) |
| Infra | Docker, Docker Compose, GitHub Actions CI |
| Testes | Jest (frontend), Vitest (backend) |

## Funcionalidades

- **Lembretes (Calendário)** — visão mensal com sidebar de atividades, criação/edição de eventos, recorrência, prioridades, anexos
- **Card de Apoio** — registro de atividades de apoio com anexos, geração de texto formatado para Kanban, finalização
- **Quadros** — canvas freeform com post-its arrastáveis e redimensionáveis, múltiplos quadros por usuário
- **Weekly Review** — revisão semanal com editor rich text (Tiptap), histórico por semana/ano, lock de reviews finalizadas
- **Sync** — importação de dados do localStorage e operações offline
- **Upload de arquivos** — avatar de perfil, anexos em atividades e cards de apoio (JPEG, PNG, WebP)

## Estrutura do Projeto

```
workspace/
├── frontend/          # SPA React (Vite)
│   └── src/
│       ├── app/           # Router, layout, providers
│       ├── components/    # Componentes compartilhados + shadcn/ui
│       ├── features/      # Módulos por funcionalidade
│       │   ├── calendar/      # Lembretes e calendário
│       │   ├── routine/       # Card de apoio
│       │   ├── board-module/  # Quadros (canvas, post-its)
│       │   └── weekly-review/ # Revisão semanal
│       └── lib/           # Utilitários
├── backend/           # API REST (Fastify)
│   ├── src/
│   │   ├── modules/       # Domínios (auth, activities, boards, reviews, support-entries, sync)
│   │   ├── shared/        # Erros, plugins, database, utils
│   │   └── config/        # Variáveis de ambiente
│   └── prisma/        # Schema e seed
└── .github/workflows/ # CI pipeline
```

## Pré-requisitos

- Node.js >= 20
- Docker e Docker Compose

## Setup Rápido

### Backend

```bash
cd backend
cp .env.example .env
docker compose up --build
```

API disponível em `http://localhost:3000`. Swagger UI em `http://localhost:3000/api/docs`.

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Dev server em `http://localhost:5173`.

## Setup Local (sem Docker para API)

```bash
# Backend
cd backend
npm install
docker compose up postgres -d    # Só banco
npm run db:generate
npm run db:migrate
npm run db:seed                  # Opcional — dados iniciais
npm run dev

# Frontend
cd frontend
npm install
npm run dev
```

## Scripts Principais

### Backend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Servidor com hot-reload (tsx watch) |
| `npm run build` | Compila TypeScript |
| `npm start` | Produção |
| `npm test` | Testes (Vitest) |
| `npm run lint` | ESLint |
| `npm run typecheck` | Checagem de tipos |
| `npm run db:migrate` | Migrations Prisma |
| `npm run db:generate` | Gerar Prisma Client |
| `npm run db:seed` | Seed do banco |

### Frontend

| Script | Descrição |
|--------|-----------|
| `npm run dev` | Dev server (Vite) |
| `npm run build` | Build de produção |
| `npm test` | Testes (Jest) |
| `npm run lint` | ESLint |
| `npm run format` | Prettier |

## Variáveis de Ambiente (Backend)

| Variável | Descrição | Default |
|----------|-----------|---------|
| `DATABASE_URL` | Conexão PostgreSQL | — |
| `JWT_SECRET` | Segredo para access tokens (mín. 32 chars) | — |
| `JWT_REFRESH_SECRET` | Segredo para refresh tokens (mín. 32 chars) | — |
| `PORT` | Porta do servidor | `3000` |
| `CORS_ORIGINS` | Origens permitidas (vírgula) | `http://localhost:5173` |
| `NODE_ENV` | Ambiente | `development` |
| `LOG_LEVEL` | Nível de log | `info` |
| `RATE_LIMIT_AUTH` | Req/min por IP (auth) | `10` |
| `RATE_LIMIT_API` | Req/min por user (API) | `100` |
| `UPLOAD_MAX_SIZE_MB` | Tamanho máximo de upload | `10` |
| `UPLOAD_DIR` | Diretório de uploads | `./uploads` |
| `RESEND_API_KEY` | API key do Resend (envio de emails) | — |
| `RESEND_FROM` | Remetente dos emails | — |

## CI/CD

GitHub Actions roda em push/PR para `main`:

- **Backend**: install, prisma generate, lint, typecheck, test, build
- **Frontend**: install, lint, test, build

## Produção (Docker)

```bash
cd backend
docker build -t workspace-backend .
docker run -p 3000:3000 --env-file .env workspace-backend
```

## Roadmap

- [ ] Notificações e alertas para lembretes
- [ ] Dashboard com métricas e resumos da semana
- [ ] PWA para acesso offline
- [ ] Habit Tracker
- [ ] Pomodoro timer integrado
- [ ] Compartilhamento de quadros entre usuários
