import { GrammyError, HttpError } from 'grammy';

import { langFor, t } from '../i18n.js';
import { logger } from '../utils/logger.js';

export async function errorHandler({ ctx, error }) {
  const meta = {
    updateId: ctx?.update?.update_id,
    chatId: ctx?.chat?.id,
    userId: ctx?.from?.id,
  };

  if (error instanceof GrammyError) {
    logger.error(`Telegram API: ${error.description}`, {
      ...meta,
      code: error.error_code,
      method: error.method,
    });
  } else if (error instanceof HttpError) {
    logger.error(`Мережа: ${error.message}`, meta);
  } else {
    logger.error(`Помилка: ${error?.message ?? error}`, { ...meta, stack: error?.stack });
  }

  const lang = langFor(ctx?.from?.id);

  try {
    if (ctx?.callbackQuery) {
      await ctx.answerCallbackQuery({ text: t(lang, 'error.callback') });
    } else if (ctx?.chat) {
      await ctx.reply(t(lang, 'error.message'));
    }
  } catch (replyError) {
    logger.debug(`Не вдалося відповісти користувачу: ${replyError.message}`);
  }
}
