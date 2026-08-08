import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';
import { getISOWeek, getISOWeekYear, startOfISOWeek, endOfISOWeek, format } from 'date-fns';

const prisma = new PrismaClient();

async function main() {
  const email = 'dev@workspace.local';

  const existingUser = await prisma.user.findUnique({ where: { email } });

  if (existingUser) {
    console.log(`Seed user "${email}" already exists. Skipping seed.`);
    return;
  }

  console.log(`Creating seed user "${email}"...`);

  const passwordHash = await bcrypt.hash('password123', 10);

  const user = await prisma.user.create({
    data: {
      email,
      name: 'Dev User',
      passwordHash,
    },
  });

  // Create 3 sample activities with different recurrence types
  const today = new Date();
  const todayStr = format(today, 'yyyy-MM-dd');

  await prisma.activity.createMany({
    data: [
      {
        userId: user.id,
        title: 'Reunião diária de standup',
        description: 'Sync com o time sobre progresso e bloqueios',
        date: todayStr,
        startTime: '09:00',
        duration: 15,
        recurrence: 'weekday',
        priority: 'high',
      },
      {
        userId: user.id,
        title: 'Revisão de código semanal',
        description: 'Revisar PRs pendentes no repositório',
        date: todayStr,
        startTime: '14:00',
        duration: 60,
        recurrence: 'weekly',
        priority: 'medium',
      },
      {
        userId: user.id,
        title: 'Leitura técnica',
        description: 'Ler artigos e documentação relevante',
        date: todayStr,
        startTime: '18:00',
        duration: 30,
        recurrence: 'daily',
        priority: 'low',
      },
    ],
  });

  // Create 2 support entries with observations
  const todayDayMonth = format(today, 'dd/MM');

  await prisma.supportEntry.createMany({
    data: [
      {
        userId: user.id,
        date: todayDayMonth,
        description: 'Ajudei colega com configuração de Docker',
        duration: '30 minutos',
        observation: 'Problema era porta já em uso no host',
      },
      {
        userId: user.id,
        date: todayDayMonth,
        description: 'Pair programming na feature de autenticação',
        duration: '1 hora',
        observation: 'Decidimos usar refresh token rotation para segurança',
      },
    ],
  });

  // Create 1 board named "Ideias" with 3 items (different types at different positions)
  const board = await prisma.board.create({
    data: {
      userId: user.id,
      name: 'Ideias',
    },
  });

  await prisma.boardItem.createMany({
    data: [
      {
        boardId: board.id,
        content: '"A simplicidade é a sofisticação suprema." — Leonardo da Vinci',
        type: 'quote',
        positionX: 50,
        positionY: 80,
        width: 300,
        height: 150,
      },
      {
        boardId: board.id,
        content: 'https://fastify.dev/docs/latest/',
        type: 'link',
        positionX: 400,
        positionY: 100,
        width: 240,
        height: 180,
      },
      {
        boardId: board.id,
        content: 'Explorar integração com calendário externo (Google Calendar API)',
        type: 'note',
        positionX: 150,
        positionY: 350,
        width: 280,
        height: 200,
      },
    ],
  });

  // Create 1 review for the current ISO week
  const weekNumber = getISOWeek(today);
  const year = getISOWeekYear(today);
  const weekStart = startOfISOWeek(today);
  const weekEnd = endOfISOWeek(today);

  await prisma.review.create({
    data: {
      userId: user.id,
      weekNumber,
      year,
      startDate: format(weekStart, 'yyyy-MM-dd'),
      endDate: format(weekEnd, 'yyyy-MM-dd'),
      learning: 'Aprendi sobre refresh token rotation e como prevenir replay attacks.',
      decisions: 'Decidimos usar Prisma ORM em vez de Knex pela type-safety superior.',
      resolvedProblems: 'Resolvemos o problema de CORS configurando origins corretamente.',
      timeWaste: 'Perdi tempo debugando uma variável de ambiente que estava com espaço no final.',
      nextWeekFocus: 'Focar na implementação dos módulos de domínio e testes de integração.',
      isLocked: true,
    },
  });

  console.log('Seed completed successfully!');
  console.log(`  - User: ${email}`);
  console.log('  - 3 activities (weekday, weekly, daily recurrence)');
  console.log('  - 2 support entries with observations');
  console.log('  - 1 board "Ideias" with 3 items');
  console.log('  - 1 review for current week');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('Seed failed:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
