import {
  adminStatusCallback,
  idHandler,
  leadsHandler,
  statsHandler,
} from './admin.js';
import {
  adminEditCallbackHandler,
  adminEditTextHandler,
  contactsHandler,
} from './adminTexts.js';
import {
  cancelHandler,
  draftCallbackHandler,
  leadOtherMessageHandler,
  leadTextHandler,
} from './lead.js';
import { languageCallbackHandler } from './language.js';
import { menuCallbackHandler } from './menu.js';
import { startHandler } from './start.js';

export function registerHandlers(bot) {
  bot.command('start', startHandler);
  bot.command('cancel', cancelHandler);
  bot.command('id', idHandler);
  bot.command('stats', statsHandler);
  bot.command('leads', leadsHandler);
  bot.command('contacts', contactsHandler);

  bot.callbackQuery(/^lang:/, languageCallbackHandler);
  bot.callbackQuery(/^menu:/, menuCallbackHandler);
  bot.callbackQuery(/^draft:/, draftCallbackHandler);
  bot.callbackQuery(/^admin:status:/, adminStatusCallback);
  bot.callbackQuery(/^admin:text:/, adminEditCallbackHandler);

  // Текст адміна під час редагування перехоплюємо раніше за заявку.
  bot.on('message:text', adminEditTextHandler);
  bot.on('message:text', leadTextHandler);
  bot.on('message', leadOtherMessageHandler);
}
