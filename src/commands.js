import { config } from './config.js';
import { logger } from './utils/logger.js';

const BASIC_COMMANDS = [
  { command: 'start', description: 'Головне меню' },
  { command: 'cancel', description: 'Скасувати заявку' },
];

const ADMIN_COMMANDS = [
  { command: 'stats', description: 'Статистика заявок' },
  { command: 'leads', description: 'Останні заявки' },
  { command: 'contacts', description: 'Редагувати контакти й послуги' },
];

export async function setupCommands(bot) {
  await bot.api.setMyCommands(BASIC_COMMANDS);

  // Кожному адміну — свій список команд, інші його не бачать.
  for (const chatId of config.adminIds) {
    try {
      await bot.api.setMyCommands([...BASIC_COMMANDS, ...ADMIN_COMMANDS], {
        scope: { type: 'chat', chat_id: chatId },
      });
    } catch (error) {
      logger.warn(`Не вдалося увімкнути адмін-команди для ${chatId}: ${error.message}`);
    }
  }
}
