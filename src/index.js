import { createBot } from './bot.js';
import { setupCommands } from './commands.js';
import { config } from './config.js';
import { leadStore } from './storage/leadStore.js';
import { settingsStore } from './storage/settingsStore.js';
import { logger, setLogLevel } from './utils/logger.js';

setLogLevel(config.logLevel);

const bot = createBot();

let shuttingDown = false;

async function shutdown(signal) {
  if (shuttingDown) {
    return;
  }

  shuttingDown = true;
  logger.info(`Отримано ${signal}, зупиняємося...`);

  try {
    await bot.stop();
    await leadStore.flush();
    await settingsStore.flush();
  } catch (error) {
    logger.warn(`Зупинилися з помилкою: ${error.message}`);
  }

  process.exit(0);
}

async function main() {
  await leadStore.init();
  await settingsStore.init();
  await setupCommands(bot);

  await bot.start({
    onStart: (botInfo) => {
      logger.info(`Бот @${botInfo.username} на зв’язку.`);
      logger.info(
        `Заявки йдуть у ${config.adminChatId}${config.adminTopicId ? `, тема ${config.adminTopicId}` : ''}.`,
      );
      logger.info(`Сховище заявок: ${leadStore.filePath}.`);
      logger.info(`Сховище налаштувань: ${settingsStore.filePath}.`);
    },
  });
}

process.once('SIGINT', () => void shutdown('SIGINT'));
process.once('SIGTERM', () => void shutdown('SIGTERM'));

process.on('unhandledRejection', (reason) => {
  logger.error(`Необроблене відхилення проміса: ${reason?.message ?? String(reason)}`, {
    stack: reason?.stack,
  });
});

process.on('uncaughtException', (error) => {
  logger.error(`Необроблений виняток: ${error.message}`, { stack: error.stack });
  process.exit(1);
});

main().catch((error) => {
  logger.error(`Не вдалося запустити бота: ${error.message}`, { stack: error.stack });
  process.exit(1);
});
