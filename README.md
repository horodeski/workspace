# Workspace

Meu app pessoal de produtividade e organização. Feito por mim, para mim — com as ferramentas e fluxos que fazem sentido no meu dia a dia.

## Sobre

Este é um projeto pessoal que centraliza ferramentas de organização que uso no trabalho e na vida pessoal. A ideia é ter um espaço único onde consigo gerenciar lembretes, registrar atividades de apoio, organizar ideias em quadros visuais e manter o hábito de revisão semanal.

## Tech Stack

- **React 18** + **TypeScript** — base da aplicação
- **Vite** — build tool e dev server
- **Tailwind CSS** + **shadcn/ui** (estilo New York, base Zinc) — estilização e componentes de UI
- **Zustand** — gerenciamento de estado
- **React Router DOM v7** — roteamento SPA
- **React Hook Form** + **Zod** — formulários e validação
- **Tiptap** — editor de texto rico
- **Framer Motion** — animações
- **date-fns** — utilitários de data
- **Lucide React** — ícones
- **Jest** + **Testing Library** — testes
- **ESLint** + **Prettier** — qualidade de código

## Funcionalidades

### Lembretes (Calendário)
Visão mensal com calendário interativo, sidebar de atividades do dia selecionado com painel redimensionável, drawer para criação/edição de eventos e detalhes de atividades.

### Card de Apoio
Registro de atividades de apoio (data, descrição, duração, observação, anexos) com geração de texto formatado para copiar direto no Kanban do trabalho. Inclui preview do texto, download de anexos e finalização do card.

### Quadros
Canvas freeform com post-its arrastáveis e redimensionáveis. Suporta filtros, validação de imagens e múltiplos quadros com nomes editáveis.

### Weekly Review
Sistema de revisão semanal com histórico de reviews anteriores, edição com editor rich text (Tiptap) e lock de reviews finalizadas.

## Estrutura do Projeto

```
src/
├── app/              # Setup da aplicação (router, layout, providers)
├── assets/           # Assets estáticos
├── components/       # Componentes compartilhados + shadcn/ui
├── features/         # Módulos por funcionalidade
│   ├── board-module/ # Quadros (canvas, post-its, filtros)
│   ├── calendar/     # Lembretes e calendário
│   ├── routine/      # Card de apoio
│   └── weekly-review/# Revisão semanal
├── lib/              # Utilitários (cn, etc.)
└── styles/           # Estilos globais
```

Cada feature segue a mesma estrutura interna:
```
feature/
├── components/   # Componentes da feature
├── hooks/        # Hooks e stores (Zustand)
├── pages/        # Páginas/rotas
├── services/     # Lógica de negócio
├── tests/        # Testes
└── types/        # Tipos TypeScript
```

## Scripts

```bash
npm run dev        # Dev server (Vite)
npm run build      # Build de produção (tsc + vite build)
npm run lint       # Lint com ESLint
npm run format     # Formata com Prettier
npm run test       # Roda testes com Jest
npm run preview    # Preview do build
```

## Implementações Futuras

- [ ] Persistência com backend (atualmente tudo fica em localStorage via Zustand)
- [ ] Notificações e alertas para lembretes
- [ ] Pomodoro timer integrado ?
- [ ] Dashboard com métricas e resumos da semana
- [ ] PWA (Progressive Web App) para acesso offline e atalho na home
- [ ] Habit Tracker 

