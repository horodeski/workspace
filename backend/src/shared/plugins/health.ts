import { type FastifyInstance, type FastifyPluginAsync } from 'fastify';
import { prisma } from '../database/prisma.js';

interface HealthResponse {
  status: 'ok';
  uptime: number;
  memory: {
    rss: number;
    heapUsed: number;
    heapTotal: number;
  };
  database: 'connected' | 'disconnected';
  timestamp: string;
}

interface ReadyResponse {
  status: 'ok';
}

interface UnavailableResponse {
  status: 'unavailable';
  component: string;
}

async function checkDatabaseConnection(): Promise<boolean> {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return true;
  } catch {
    return false;
  }
}

function bytesToMB(bytes: number): number {
  return Math.round((bytes / 1024 / 1024) * 100) / 100;
}

const healthPlugin: FastifyPluginAsync = async (app: FastifyInstance) => {
  app.get<{ Reply: HealthResponse }>('/health', async (_request, reply) => {
    const memoryUsage = process.memoryUsage();
    const dbConnected = await checkDatabaseConnection();

    const response: HealthResponse = {
      status: 'ok',
      uptime: Math.floor(process.uptime()),
      memory: {
        rss: bytesToMB(memoryUsage.rss),
        heapUsed: bytesToMB(memoryUsage.heapUsed),
        heapTotal: bytesToMB(memoryUsage.heapTotal),
      },
      database: dbConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString(),
    };

    return reply.status(200).send(response);
  });

  app.get<{ Reply: ReadyResponse | UnavailableResponse }>('/ready', async (_request, reply) => {
    const dbConnected = await checkDatabaseConnection();

    if (!dbConnected) {
      return reply.status(503).send({
        status: 'unavailable',
        component: 'database',
      });
    }

    return reply.status(200).send({
      status: 'ok',
    });
  });
};

export default healthPlugin;
