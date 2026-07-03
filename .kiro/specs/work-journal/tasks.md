# Implementation Plan: Work Journal

## Overview

Implementação incremental do Work Journal como SPA React + TypeScript + Vite, seguindo arquitetura feature-first com Zustand para estado, TailwindCSS + shadcn/ui para estilização, e Jest + fast-check para testes. Cada etapa constrói sobre a anterior, finalizando com a integração completa dos módulos.

## Tasks

- [x] 1. Configuração do projeto e infraestrutura base
  - [x] 1.1 Inicializar projeto Vite com React + TypeScript e configurar dependências
    - Criar projeto com `npm create vite@latest` usando template react-ts
    - Instalar dependências: zustand, react-router-dom, react-hook-form, zod, @hookform/resolvers, lucide-react
    - Instalar dependências de dev: tailwindcss, postcss, autoprefixer, jest, @testing-library/react, @testing-library/jest-dom, ts-jest, fast-check, eslint, @typescript-eslint/eslint-plugin, prettier
    - Configurar `tsconfig.json` com `"strict": true`
    - Configurar ESLint com plugin @typescript-eslint e Prettier com `.prettierrc`
    - _Requisitos: 7.1, 7.3, 7.4_

  - [x] 1.2 Configurar TailwindCSS, tema escuro e shadcn/ui
    - Configurar `tailwind.config.ts` com tema escuro como padrão
    - Criar `src/styles/globals.css` com variáveis CSS para tema escuro (inspirado em Linear/Notion)
    - Configurar shadcn/ui com estilo dark por padrão
    - Criar `src/lib/utils.ts` com utilitário `cn()` para classes condicionais
    - _Requisitos: 1.4, 1.6_

  - [x] 1.3 Criar estrutura de diretórios feature-first
    - Criar árvore de diretórios conforme design: `src/app/`, `src/components/`, `src/features/{dashboard,routine,inbox,journal,reports}/`, `src/services/`, `src/styles/`, `src/lib/`
    - Cada feature com subdiretórios: `components/`, `pages/`, `hooks/`, `services/`, `types/`, `tests/`
    - _Requisitos: 6.4_

  - [x] 1.4 Configurar React Router v6 e layout principal
    - Criar `src/app/router.tsx` com rotas para: Dashboard (/), Rotina (/routine), Inbox (/inbox), Journal (/journal), Relatórios (/reports)
    - Criar `src/app/App.tsx` com RouterProvider
    - Criar `src/app/providers.tsx` para encapsular providers
    - Configurar rota catch-all para página 404 com link para Dashboard
    - _Requisitos: 1.1, 1.3_

  - [x] 1.5 Configurar Jest com suporte a TypeScript e React Testing Library
    - Criar `jest.config.ts` com ts-jest ou @swc/jest
    - Configurar setup file para @testing-library/jest-dom
    - Verificar que `npm test` executa corretamente
    - _Requisitos: 7.1_

- [x] 2. Componentes compartilhados e layout
  - [x] 2.1 Implementar componentes UI base (Button, Input, Textarea, Badge, Modal, Loading)
    - Criar `src/components/Button.tsx` com variantes (primary, secondary, destructive, ghost)
    - Criar `src/components/Input.tsx` com props label e error
    - Criar `src/components/Textarea.tsx` com props label, error e minHeight
    - Criar `src/components/Badge.tsx` com variantes (default, success, warning, destructive)
    - Criar `src/components/Modal.tsx` para diálogos modais
    - Criar `src/components/Loading.tsx` para indicador de carregamento
    - Todas interfaces TypeScript explícitas sem uso de `any`
    - _Requisitos: 6.1, 6.3, 6.5_

  - [x] 2.2 Implementar AppSidebar com navegação
    - Criar `src/components/AppSidebar.tsx` com itens: Dashboard, Minha Rotina, Inbox, Journal, Relatórios, Configurações
    - Cada item com ícone Lucide correspondente e label
    - Destacar item ativo baseado na rota atual
    - Navegação via React Router (Link/NavLink) sem reload da página
    - _Requisitos: 1.2, 1.3_

  - [x] 2.3 Implementar PageHeader e EmptyState
    - Criar `src/components/PageHeader.tsx` com title, description e actions
    - Criar `src/components/EmptyState.tsx` com icon, title, description e action opcional
    - _Requisitos: 6.1, 6.3_

  - [x] 2.4 Implementar Layout Principal integrando Sidebar, Header e área de conteúdo
    - Criar layout wrapper com sidebar fixa à esquerda e área de conteúdo à direita
    - Garantir espaçamento mínimo de 16px entre seções, border-radius mínimo de 4px
    - Garantir sem overflow horizontal em telas >= 1024px
    - _Requisitos: 1.1, 1.5, 1.6_

  - [ ]* 2.5 Escrever testes unitários para AppSidebar
    - Testar renderização dos itens na ordem correta
    - Testar destaque do item ativo
    - _Requisitos: 7.2_

- [x] 3. Checkpoint - Verificar infraestrutura base
  - Garantir que todos os testes passam e a aplicação renderiza com layout correto. Perguntar ao usuário se há dúvidas.

- [x] 4. Feature: Minha Rotina
  - [x] 4.1 Definir tipos e schemas de validação para Rotina
    - Criar `src/features/routine/types/routine.types.ts` com interfaces `Routine` e `Frequency`
    - Criar schema Zod `routineSchema` com validação de título (min 1, max 100, não whitespace-only) e frequência (daily/weekly/sprint)
    - _Requisitos: 2.1, 2.2_

  - [x] 4.2 Implementar routineStore com Zustand
    - Criar `src/features/routine/hooks/useRoutineStore.ts` com estado e actions: addRoutine, toggleRoutine, removeRoutine
    - Gerar ID único para cada rotina criada
    - Persistir estado durante a sessão
    - _Requisitos: 2.1, 2.4, 2.5, 2.6_

  - [x] 4.3 Implementar componente RoutineCard
    - Criar `src/features/routine/components/RoutineCard.tsx` com título, badge de frequência e checkbox
    - Aplicar estilo visual de conclusão (opacidade reduzida, texto riscado) quando marcada
    - Respeitar limite de 150 linhas e responsabilidade única
    - _Requisitos: 2.3, 2.4, 2.5, 6.5_

  - [x] 4.4 Implementar RoutinePage com formulário de criação e lista
    - Criar `src/features/routine/pages/RoutinePage.tsx` com formulário React Hook Form + Zod
    - Exibir lista de rotinas usando RoutineCard
    - Exibir EmptyState quando não houver rotinas
    - Exibir mensagem de validação inline para título inválido
    - _Requisitos: 2.1, 2.2, 2.3, 2.7_

  - [ ]* 4.5 Escrever teste de propriedade para rejeição de whitespace (Property 1)
    - **Property 1: Rejeição de entrada whitespace-only**
    - Usar fast-check para gerar strings compostas apenas de espaços/tabs/newlines
    - Verificar que routineSchema rejeita todas elas
    - **Valida: Requisitos 2.2**

  - [ ]* 4.6 Escrever teste de propriedade para criação com entrada válida (Property 2)
    - **Property 2: Criação com entrada válida preserva dados**
    - Usar fast-check para gerar títulos válidos e frequências
    - Verificar que addRoutine cria item com campos correspondentes à entrada
    - **Valida: Requisitos 2.1**

  - [ ]* 4.7 Escrever teste de propriedade para toggle round-trip (Property 3)
    - **Property 3: Toggle de conclusão é round-trip**
    - Usar fast-check para gerar rotinas em qualquer estado
    - Verificar que toggleRoutine duas vezes restaura estado original
    - **Valida: Requisitos 2.4, 2.5**

  - [ ]* 4.8 Escrever testes unitários para RoutineCard
    - Testar renderização correta com dados
    - Testar aplicação de estilo de conclusão
    - _Requisitos: 7.2_

- [x] 5. Feature: Inbox
  - [x] 5.1 Definir tipos e schemas de validação para Inbox
    - Criar `src/features/inbox/types/inbox.types.ts` com interface `InboxTask`
    - Criar schema Zod `inboxTaskSchema` com validação de texto (min 1, max 200, não whitespace-only)
    - _Requisitos: 3.1, 3.3_

  - [x] 5.2 Implementar inboxStore com Zustand
    - Criar `src/features/inbox/hooks/useInboxStore.ts` com estado e actions: addTask, toggleTask, editTask, removeTask
    - Nova tarefa inserida no topo da lista (ordenação cronológica decrescente)
    - Persistir estado durante a sessão
    - _Requisitos: 3.2, 3.4, 3.5, 3.6, 3.7, 3.8_

  - [x] 5.3 Implementar componente InboxItem
    - Criar `src/features/inbox/components/InboxItem.tsx` com checkbox, texto, botões editar e excluir
    - Aplicar line-through e opacidade reduzida quando concluída
    - _Requisitos: 3.5, 6.5_

  - [x] 5.4 Implementar InboxPage com campo de captura rápida e lista
    - Criar `src/features/inbox/pages/InboxPage.tsx` com campo de texto (placeholder "O que surgiu?", max 200 chars)
    - Criar tarefa ao pressionar Enter, limpar campo, inserir no topo
    - Ignorar ação se texto vazio ou whitespace-only
    - Exibir lista de tarefas com InboxItem
    - _Requisitos: 3.1, 3.2, 3.3, 3.4_

  - [ ]* 5.5 Escrever teste de propriedade para rejeição de whitespace no Inbox (Property 1)
    - **Property 1: Rejeição de entrada whitespace-only**
    - Usar fast-check para gerar strings whitespace-only
    - Verificar que inboxTaskSchema rejeita todas elas
    - **Valida: Requisitos 3.3**

  - [ ]* 5.6 Escrever teste de propriedade para ordenação cronológica (Property 4)
    - **Property 4: Ordenação cronológica decrescente**
    - Usar fast-check para gerar listas de tarefas com timestamps distintos
    - Verificar que exibição mantém ordem decrescente por createdAt
    - **Valida: Requisitos 3.4**

  - [ ]* 5.7 Escrever teste de propriedade para exclusão (Property 5)
    - **Property 5: Exclusão remove exatamente um item**
    - Usar fast-check para gerar listas de N itens e selecionar um para remoção
    - Verificar que lista resultante tem N-1 itens e item removido não está presente
    - **Valida: Requisitos 3.7**

  - [ ]* 5.8 Escrever testes unitários para InboxItem
    - Testar renderização com ações
    - Testar aplicação de line-through quando concluída
    - _Requisitos: 7.2_

- [x] 6. Checkpoint - Verificar features Rotina e Inbox
  - Garantir que todos os testes passam e as features Rotina e Inbox funcionam corretamente. Perguntar ao usuário se há dúvidas.

- [x] 7. Feature: Journal
  - [x] 7.1 Definir tipos e schemas de validação para Journal
    - Criar `src/features/journal/types/journal.types.ts` com interface `JournalEntry`
    - Criar schema Zod `journalEntrySchema` com validação de rawText (min 1, não whitespace-only)
    - _Requisitos: 4.3_

  - [x] 7.2 Implementar formatJournalEntry como função mock assíncrona
    - Criar `src/features/journal/services/formatJournalEntry.ts`
    - Implementar como função pura síncrona envolvida em `Promise.resolve()`
    - Aceitar string não vazia, retornar texto em linguagem profissional
    - Sem efeitos colaterais e sem dependências externas
    - _Requisitos: 4.5, 4.6, 7.5, 8.2_

  - [x] 7.3 Implementar journalStore com Zustand
    - Criar `src/features/journal/hooks/useJournalStore.ts` com estado e actions: addEntry, getEntriesByPeriod
    - Preservar rawText inalterado junto ao formattedText
    - Ordenar entradas da mais recente para a mais antiga
    - _Requisitos: 4.4, 4.7, 4.8_

  - [x] 7.4 Implementar componentes JournalEditor e JournalCard
    - Criar `src/features/journal/components/JournalEditor.tsx` com textarea (min 200px altura, placeholder "O que você fez hoje?") e botão "Salvar"
    - Desabilitar botão quando texto vazio ou whitespace-only
    - Criar `src/features/journal/components/JournalCard.tsx` exibindo rawText e formattedText com data
    - _Requisitos: 4.1, 4.2, 4.3, 4.8_

  - [x] 7.5 Implementar JournalPage com editor e lista de entradas
    - Criar `src/features/journal/pages/JournalPage.tsx` integrando JournalEditor e JournalCards
    - Chamar formatJournalEntry ao salvar e armazenar resultado
    - Exibir EmptyState quando não houver entradas
    - Limpar campo após salvar com sucesso
    - _Requisitos: 4.4, 4.5, 4.8, 4.9_

  - [ ]* 7.6 Escrever teste de propriedade para preservação do rawText (Property 6)
    - **Property 6: Preservação do texto original (round-trip)**
    - Usar fast-check para gerar textos válidos
    - Verificar que rawText na entrada salva é idêntico ao texto original fornecido
    - **Valida: Requisitos 4.7**

  - [ ]* 7.7 Escrever teste de propriedade para transparência referencial do formatador (Property 7)
    - **Property 7: Formatador Journal — transparência referencial e output não-vazio**
    - Usar fast-check para gerar strings válidas
    - Verificar que formatJournalEntry retorna mesmo resultado para mesmo input e resultado não é vazio
    - **Valida: Requisitos 4.5, 7.5**

  - [ ]* 7.8 Escrever testes unitários para formatJournalEntry
    - Testar formatação de texto simples
    - Testar comportamento com texto multilinha
    - _Requisitos: 7.2_

- [x] 8. Feature: Relatórios
  - [x] 8.1 Definir tipos para Relatórios
    - Criar `src/features/reports/types/report.types.ts` com interfaces `ReportPeriod`, `ReportSection` e `Report`
    - _Requisitos: 5.1_

  - [x] 8.2 Implementar reportStore com Zustand
    - Criar `src/features/reports/hooks/useReportStore.ts` com estado e actions: selectedPeriod, setSelectedPeriod, generateReport
    - Período padrão: "today"
    - Filtrar entradas por período (today = dia atual, week = últimos 7 dias, sprint = últimos 14 dias)
    - Agrupar por data e ordenar cronologicamente (mais recente primeiro)
    - _Requisitos: 5.1, 5.2, 5.3, 5.4_

  - [x] 8.3 Implementar componente ReportViewer
    - Criar `src/features/reports/components/ReportViewer.tsx` com título do período, seções por data e texto formatado
    - _Requisitos: 5.3, 5.4_

  - [x] 8.4 Implementar ReportsPage com seleção de período e visualização
    - Criar `src/features/reports/pages/ReportsPage.tsx` com botões de período (Hoje, Semana, Sprint)
    - Integrar com journalStore para obter entradas e reportStore para gerar relatório
    - Exibir EmptyState quando não houver entradas no período
    - _Requisitos: 5.1, 5.2, 5.3, 5.5_

  - [ ]* 8.5 Escrever teste de propriedade para filtragem por período (Property 8)
    - **Property 8: Filtragem por período retorna apenas entradas dentro do intervalo**
    - Usar fast-check para gerar entradas com datas variadas e períodos
    - Verificar que relatório contém apenas entradas dentro do intervalo selecionado
    - **Valida: Requisitos 5.3, 5.4**

- [x] 9. Feature: Dashboard
  - [x] 9.1 Implementar componente StatCard
    - Criar `src/features/dashboard/components/StatCard.tsx` com title, value, icon e trend opcional
    - _Requisitos: 6.2_

  - [x] 9.2 Implementar DashboardPage com estatísticas e resumo
    - Criar `src/features/dashboard/pages/DashboardPage.tsx` com cards de estatísticas
    - Exibir: total de rotinas concluídas hoje, tarefas no inbox, entradas no journal hoje
    - Integrar com stores de rotina, inbox e journal
    - Exibir EmptyState quando não houver dados
    - _Requisitos: 6.2_

  - [ ]* 9.3 Escrever testes unitários para Dashboard
    - Testar renderização de estatísticas
    - Testar exibição de EmptyState quando vazio
    - _Requisitos: 7.2_

- [x] 10. Checkpoint - Verificar todas as features
  - Garantir que todos os testes passam e todas as features (Rotina, Inbox, Journal, Relatórios, Dashboard) funcionam integradas. Perguntar ao usuário se há dúvidas.

- [x] 11. Interfaces de integração futura e finalização
  - [x] 11.1 Criar interfaces de serviço para integrações futuras
    - Criar `src/services/openai.service.ts` com interface OpenAIService (formatText, summarize)
    - Criar `src/services/jira.service.ts` com interface JiraService (getMyTasks, syncRoutines)
    - Criar `src/services/github.service.ts` com interface GitHubService (getCommits, getPullRequests)
    - Criar `src/services/gitlab.service.ts` com interface GitLabService (getMergeRequests, getCommits)
    - Criar `src/services/teams.service.ts` com interface TeamsService (sendReport, getStatus)
    - Apenas interfaces TypeScript com tipos de entrada e saída definidos
    - _Requisitos: 8.1, 8.4_

  - [x] 11.2 Integrar todas as rotas e verificar navegação completa
    - Conectar todas as páginas ao router
    - Verificar navegação sem reload entre todas as telas
    - Verificar página 404 para rotas inexistentes
    - Verificar que item ativo da sidebar é atualizado ao navegar
    - _Requisitos: 1.3_

- [x] 12. Checkpoint final - Garantir qualidade do projeto
  - Garantir que todos os testes passam, ESLint e Prettier não reportam erros, TypeScript compila sem erros com strict mode. Perguntar ao usuário se há dúvidas.

## Notes

- Tarefas marcadas com `*` são opcionais e podem ser puladas para um MVP mais rápido
- Cada tarefa referencia requisitos específicos para rastreabilidade
- Checkpoints garantem validação incremental
- Testes de propriedade validam propriedades universais de corretude (fast-check)
- Testes unitários validam exemplos específicos e edge cases (Jest + RTL)
- Todas as interfaces de integração são apenas definições TypeScript — sem implementação real no MVP

## Task Dependency Graph

```json
{
  "waves": [
    { "id": 0, "tasks": ["1.1"] },
    { "id": 1, "tasks": ["1.2", "1.5"] },
    { "id": 2, "tasks": ["1.3"] },
    { "id": 3, "tasks": ["1.4", "2.1"] },
    { "id": 4, "tasks": ["2.2", "2.3"] },
    { "id": 5, "tasks": ["2.4", "2.5"] },
    { "id": 6, "tasks": ["4.1", "5.1", "7.1", "8.1"] },
    { "id": 7, "tasks": ["4.2", "5.2", "7.2", "8.2"] },
    { "id": 8, "tasks": ["4.3", "5.3", "7.3", "8.3", "9.1"] },
    { "id": 9, "tasks": ["4.4", "5.4", "7.4", "8.4", "9.2"] },
    { "id": 10, "tasks": ["4.5", "4.6", "4.7", "4.8", "5.5", "5.6", "5.7", "5.8", "7.5"] },
    { "id": 11, "tasks": ["7.6", "7.7", "7.8", "8.5", "9.3"] },
    { "id": 12, "tasks": ["11.1", "11.2"] }
  ]
}
```
