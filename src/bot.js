import { Bot } from 'grammy';

import { config } from './config.js';
import { errorHandler } from './handlers/errors.js';
import { registerHandlers } from './handlers/index.js';

export function createBot() {
  const bot = new Bot(config.botToken);

  bot.catch(errorHandler);
  registerHandlers(bot);

  return bot;
}
