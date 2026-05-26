import dotenv from 'dotenv';
dotenv.config();

import app from './app.js';
import sequelize from './config/database.js';
import { seedDefaultAdmin } from './services/adminAuthService.js';
import './models/index.js'; // Import all models to register them

const PORT = parseInt(process.env.PORT ?? '3000', 10);

process.on('unhandledRejection', (reason: unknown) => {
  console.error('❌ Unhandled Promise Rejection:', reason);
});

process.on('uncaughtException', (err: Error) => {
  console.error('❌ Uncaught Exception:', err.message);
  console.error(err.stack);
});

// ─── Database Connection ───────────────────────────────────────────────────────
async function connectDatabase(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('✅ Database connected successfully');

    await sequelize.sync({ alter: false });
    await seedDefaultAdmin();
    console.log('✅ Database models synced');
  } catch (error) {
    console.error('❌ Unable to connect to the database:', error);
    process.exit(1);
  }
}


function startDbKeepalive(): void {
  const FIVE_MINUTES = 5 * 60 * 1000;

  setInterval(async () => {
    try {
      await sequelize.authenticate();
    } catch (err) {
      console.error('⚠️  DB keepalive ping failed — attempting reconnect...', err);
      try {
        await sequelize.authenticate();
        console.log('✅ DB reconnected successfully');
      } catch (reconnectErr) {
        console.error('❌ DB reconnect failed:', reconnectErr);
      }
    }
  }, FIVE_MINUTES);
}

// ─── Start Server ─────────────────────────────────────────────────────────────
async function startServer(): Promise<void> {
  await connectDatabase();

  // Start keepalive after successful connection
  startDbKeepalive();

  const server = app.listen(PORT, () => {
    console.log('');
    console.log('🎵 Music Backend API is running!');
    console.log('─────────────────────────────────────');
    console.log(`🌐 Local API   ➜  http://localhost:${PORT}`);
    console.log(`📦 Health      ➜  http://localhost:${PORT}/health`);
    console.log(`📦 Environment ➜  ${process.env.NODE_ENV ?? 'development'}`);
    console.log('─────────────────────────────────────');
    console.log('');
  });

  // ─── Graceful Shutdown ─────────────────────────────────────────────────────
  const shutdown = async (signal: string) => {
    console.log(`\n⚠️  ${signal} received — shutting down gracefully...`);
    server.close(async () => {
      await sequelize.close();
      console.log('✅ Database connection closed.');
      console.log('👋 Server stopped. Bye!');
      process.exit(0);
    });
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

startServer();
