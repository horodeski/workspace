import { buildApp } from './app.js';

async function start() {
  const app = await buildApp();
  const { PORT } = app.env;

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`Server running on http://0.0.0.0:${PORT}`);
  } catch (err) {
    app.log.fatal(err);
    process.exit(1);
  }

  const shutdown = async (signal: string) => {
    app.log.info(`${signal} received. Shutting down...`);
    try {
      await app.close();
      process.exit(0);
    } catch (err) {
      app.log.error(err);
      process.exit(1);
    }
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start();
