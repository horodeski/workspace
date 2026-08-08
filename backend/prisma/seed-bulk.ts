import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import {
  format,
  subDays,
  addDays,
  startOfISOWeek,
  endOfISOWeek,
  getISOWeek,
  getISOWeekYear,
} from 'date-fns';

const prisma = new PrismaClient();

// --- Helpers ---

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function dateStr(d: Date): string {
  return format(d, 'yyyy-MM-dd');
}

function dayMonth(d: Date): string {
  return format(d, 'dd/MM');
}

// --- Data pools ---

const activityTitles = [
  'Standup diário',
  'Code review',
  'Planejamento de sprint',
  'Pair programming',
  'Refatoração de módulo',
  'Deploy em staging',
  'Escrita de documentação',
  'Reunião com stakeholders',
  'Mentoria com júnior',
  'Bug triage',
  'Teste de integração',
  'Migração de banco',
  'Design system update',
  'Análise de performance',
  'Retrospectiva',
  'Alinhamento técnico',
  'Prototipação rápida',
  'Atualização de dependências',
  'Onboarding novo membro',
  'Criação de ADR',
  'Sessão de mob programming',
  'Revisão de arquitetura',
  'Configuração de CI/CD',
  'Investigação de incidente',
  'Apresentação tech talk',
  'Escrita de RFC',
  'Testes exploratórios',
  'Otimização de queries',
  'Setup de monitoramento',
  'Automação de processos',
];

const descriptions = [
  'Sync rápido com time sobre bloqueios e progresso.',
  'Revisar PRs pendentes e garantir qualidade.',
  'Definir prioridades e escopo para próxima sprint.',
  'Sessão colaborativa para resolver problema complexo.',
  'Melhorar legibilidade e manutenibilidade do código.',
  'Validar mudanças em ambiente pré-produção.',
  'Manter docs atualizados para o time.',
  'Alinhar expectativas e prazos com negócio.',
  'Compartilhar conhecimento e auxiliar crescimento.',
  'Classificar e priorizar bugs reportados.',
  'Garantir que fluxos principais funcionam corretamente.',
  'Aplicar mudanças no schema sem downtime.',
  'Atualizar componentes visuais compartilhados.',
  'Identificar gargalos e propor melhorias.',
  'Refletir sobre o que funcionou e o que pode melhorar.',
  '',
  '',
  '',
];

const priorities = ['high', 'medium', 'low', null];
const recurrences = ['none', 'daily', 'weekday', 'weekly', 'monthly'];
const startTimes = [
  '07:00', '07:30', '08:00', '08:30', '09:00', '09:30',
  '10:00', '10:30', '11:00', '11:30', '13:00', '13:30',
  '14:00', '14:30', '15:00', '15:30', '16:00', '16:30',
  '17:00', '17:30', '18:00', '19:00', '20:00', '21:00',
];
const durations = [15, 20, 25, 30, 45, 60, 90, 120, null];

const supportDescriptions = [
  'Ajudei colega com configuração de Docker',
  'Pair programming na feature de auth',
  'Resolvi dúvida sobre TypeScript generics',
  'Auxiliei deploy em produção',
  'Expliquei padrão de repository',
  'Suporte com configuração de ambiente local',
  'Revisão e feedback em design doc',
  'Ajudei a debugar problema de CORS',
  'Orientação sobre testes unitários',
  'Suporte com Git rebase interativo',
  'Ajuda com query N+1 no Prisma',
  'Explicação sobre refresh token rotation',
  'Pair na migração para ESM',
  'Suporte com Zod schemas',
  'Ajudei a configurar CI pipeline',
  'Orientação sobre error handling patterns',
  'Resolvi problema de timezone em date-fns',
  'Auxiliei no setup de monitoramento',
  'Expliquei arquitetura hexagonal',
  'Suporte com WebSocket reconnection',
];

const supportDurations = [
  '15 minutos', '20 minutos', '30 minutos', '45 minutos',
  '1 hora', '1h30', '2 horas', '2h30', '3 horas',
];

const observations = [
  'Problema era porta já em uso no host.',
  'Decidimos usar refresh token rotation.',
  'Necessário atualizar Node para v20+.',
  'Faltava variável de ambiente no .env.',
  'Solução: adicionar index no banco.',
  'Resolvido com leitura da documentação oficial.',
  'Issue aberta no repositório upstream.',
  'Requer follow-up na próxima semana.',
  '',
  '',
  '',
];

const boardNames = [
  'Ideias', 'Backlog', 'Leitura', 'Projetos pessoais', 'Referências',
  'Tech Radar', 'Aprendizado', 'Débitos técnicos', 'Próximos passos', 'Inspiração',
];

const boardContents = [
  '"A simplicidade é a sofisticação suprema." — Leonardo da Vinci',
  '"First, solve the problem. Then, write the code." — John Johnson',
  '"Any fool can write code that a computer can understand." — Martin Fowler',
  'https://fastify.dev/docs/latest/',
  'https://www.prisma.io/docs',
  'https://zod.dev/',
  'https://date-fns.org/',
  'https://vitest.dev/guide/',
  'Explorar integração com Google Calendar API',
  'Implementar sistema de notificações push',
  'Estudar Event Sourcing para auditoria',
  'Criar dashboard de métricas do time',
  'Migrar para monorepo com turborepo',
  'Adicionar testes E2E com Playwright',
  'Experimentar Bun como runtime',
  'Investigar edge functions para latência',
  'Setup de feature flags com Unleash',
  'Documentar decisões com ADRs',
  'Criar CLI interna para scaffolding',
  'Avaliar tracing distribuído com OpenTelemetry',
  'Melhorar onboarding com scripts automatizados',
  'Organizar knowledge base do time',
  'Prototipar modo offline com service workers',
  'Benchmark de ORMs: Prisma vs Drizzle vs Kysely',
  'Explorar AI code review automatizado',
];

const boardItemTypes = ['note', 'quote', 'link'];

const learnings = [
  'Aprendi sobre refresh token rotation e como prevenir replay attacks.',
  'Descobri que Prisma tem limitações com raw queries em transactions.',
  'Entendi melhor o modelo de concorrência do Node.js event loop.',
  'Aprendi a usar discriminated unions em TypeScript para type safety.',
  'Estudei sobre CQRS e quando faz sentido aplicar.',
  'Aprendi sobre connection pooling com PgBouncer.',
  'Explorei streaming responses com Fastify.',
  'Entendi melhor race conditions em testes assíncronos.',
  'Aprendi sobre semantic versioning e breaking changes.',
  'Descobri patterns avançados de Zod como transform e refine.',
];

const decisions = [
  'Decidimos usar Prisma ORM pela type-safety superior.',
  'Optamos por Fastify por performance e plugin ecosystem.',
  'Vamos manter testes unitários e de integração separados.',
  'Escolhemos date-fns por ser tree-shakeable.',
  'Definimos padrão de error handling centralizado.',
  'Adotamos conventional commits para changelog automático.',
  'Decidimos não usar GraphQL nesse projeto pela simplicidade.',
  'Vamos usar feature branches curtas (max 2 dias).',
  'Optamos por UUID v4 como primary key.',
  'Definimos code review obrigatório para merge.',
];

const resolvedProblems = [
  'Resolvemos problema de CORS configurando origins corretamente.',
  'Fix no memory leak causado por event listeners não removidos.',
  'Corrigimos race condition no refresh token flow.',
  'Resolvemos N+1 queries com include do Prisma.',
  'Fix no timezone offset que causava datas erradas.',
  'Corrigimos deadlock no banco com order de locks consistente.',
  'Resolvemos flaky test com retry e cleanup adequado.',
  'Fix no upload que falhava com arquivos > 5MB.',
  'Corrigimos pagination que pulava registros.',
  'Resolvemos inconsistência no soft delete cascade.',
];

const timeWastes = [
  'Perdi tempo debugando variável de ambiente com espaço no final.',
  'Gastei horas com problema que era cache do browser.',
  'Docker rebuild desnecessário por .dockerignore mal configurado.',
  'Tempo perdido em reunião sem pauta definida.',
  'Debug de teste que só falhava no CI por timezone.',
  'Tentei resolver problema que já tinha PR aberto.',
  'Perdi tempo com breaking change não documentada de lib.',
  'Gastei tempo com linter configurado diferente local vs CI.',
  '',
  '',
];

const focuses = [
  'Focar na implementação dos módulos de domínio.',
  'Priorizar cobertura de testes acima de 80%.',
  'Entregar feature de sync offline.',
  'Melhorar performance das queries mais lentas.',
  'Documentar APIs públicas com Swagger.',
  'Reduzir tech debt no módulo de auth.',
  'Finalizar migração para ESM.',
  'Implementar rate limiting por endpoint.',
  'Setup de monitoring e alertas.',
  'Preparar apresentação da sprint review.',
];

// --- Main ---

async function main() {
  const email = 'dev@workspace.local';
  const passwordHash = await bcrypt.hash('password123', 10);

  // Upsert user
  const user = await prisma.user.upsert({
    where: { email },
    update: {},
    create: { email, passwordHash },
  });

  console.log(`User: ${email}`);

  const today = new Date();

  // --- Activities: 90 days of data, ~3-6 activities per day ---
  console.log('Creating activities...');
  const activities = [];
  for (let daysAgo = 90; daysAgo >= 0; daysAgo--) {
    const day = subDays(today, daysAgo);
    const count = randomInt(3, 6);
    for (let i = 0; i < count; i++) {
      activities.push({
        userId: user.id,
        title: pick(activityTitles),
        description: pick(descriptions),
        date: dateStr(day),
        startTime: pick(startTimes),
        duration: pick(durations),
        recurrence: pick(recurrences),
        priority: pick(priorities),
      });
    }
  }

  // Batch insert activities
  await prisma.activity.createMany({ data: activities });
  console.log(`  ${activities.length} activities created`);

  // --- Completions for ~60% of activities ---
  console.log('Creating completions...');
  const allActivities = await prisma.activity.findMany({
    where: { userId: user.id },
    select: { id: true, date: true },
  });

  const completions = [];
  for (const act of allActivities) {
    if (Math.random() < 0.6) {
      completions.push({
        activityId: act.id,
        date: act.date,
        completed: true,
      });
    }
  }

  // Batch in chunks to avoid unique constraint issues (activityId+date)
  const uniqueCompletions = new Map<string, (typeof completions)[0]>();
  for (const c of completions) {
    uniqueCompletions.set(`${c.activityId}-${c.date}`, c);
  }
  const completionData = [...uniqueCompletions.values()];
  await prisma.activityCompletion.createMany({ data: completionData, skipDuplicates: true });
  console.log(`  ${completionData.length} completions created`);

  // --- Support Entries: ~2-4 per week for 12 weeks ---
  console.log('Creating support entries...');
  const supportEntries = [];
  for (let weeksAgo = 12; weeksAgo >= 0; weeksAgo--) {
    const count = randomInt(2, 4);
    for (let i = 0; i < count; i++) {
      const day = subDays(today, weeksAgo * 7 + randomInt(0, 6));
      supportEntries.push({
        userId: user.id,
        date: dayMonth(day),
        description: pick(supportDescriptions),
        duration: pick(supportDurations),
        observation: pick(observations),
        isFinalized: weeksAgo > 1,
      });
    }
  }

  await prisma.supportEntry.createMany({ data: supportEntries });
  console.log(`  ${supportEntries.length} support entries created`);

  // --- Boards: 5 boards, 6-12 items each ---
  console.log('Creating boards...');
  let totalItems = 0;
  const usedNames = new Set<string>();

  for (let b = 0; b < 5; b++) {
    let name = pick(boardNames);
    while (usedNames.has(name)) name = pick(boardNames);
    usedNames.add(name);

    const board = await prisma.board.create({
      data: { userId: user.id, name },
    });

    const itemCount = randomInt(6, 12);
    const items = [];
    for (let i = 0; i < itemCount; i++) {
      items.push({
        boardId: board.id,
        content: pick(boardContents),
        type: pick(boardItemTypes),
        positionX: randomInt(20, 800),
        positionY: randomInt(20, 600),
        width: randomInt(200, 350),
        height: randomInt(140, 250),
      });
    }
    await prisma.boardItem.createMany({ data: items });
    totalItems += itemCount;
  }
  console.log(`  5 boards, ${totalItems} items created`);

  // --- Reviews: 1 per week for last 12 weeks ---
  console.log('Creating reviews...');
  let reviewCount = 0;
  for (let weeksAgo = 12; weeksAgo >= 0; weeksAgo--) {
    const day = subDays(today, weeksAgo * 7);
    const weekNumber = getISOWeek(day);
    const year = getISOWeekYear(day);
    const weekStart = startOfISOWeek(day);
    const weekEnd = endOfISOWeek(day);

    await prisma.review.upsert({
      where: { userId_weekNumber_year: { userId: user.id, weekNumber, year } },
      update: {},
      create: {
        userId: user.id,
        weekNumber,
        year,
        startDate: dateStr(weekStart),
        endDate: dateStr(weekEnd),
        learning: pick(learnings),
        decisions: pick(decisions),
        resolvedProblems: pick(resolvedProblems),
        timeWaste: pick(timeWastes),
        nextWeekFocus: pick(focuses),
        isLocked: weeksAgo > 0,
      },
    });
    reviewCount++;
  }
  console.log(`  ${reviewCount} reviews created`);

  console.log('\nBulk seed done!');
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error('Bulk seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
