import { langFor, t } from '../i18n.js';
import { buildLanguageMenu } from '../keyboards.js';
import { settingsStore } from '../storage/settingsStore.js';
import { beginLead } from './lead.js';

async function sendSection(ctx, lang, section, titleKey) {
  const body = settingsStore.getText(section, lang);
  const text = `${t(lang, titleKey)}\n\n${body}`;

  try {
    await ctx.reply(text, { parse_mode: 'HTML' });
  } catch {
    // Адмін міг зберегти невалідний HTML — тоді показуємо простим текстом.
    await ctx.reply(`${t(lang, titleKey).replace(/<[^>]+>/g, '')}\n\n${body}`);
  }
}

export async function menuCallbackHandler(ctx) {
  const data = ctx.callbackQuery?.data ?? '';
  const lang = langFor(ctx.from?.id);

  await ctx.answerCallbackQuery();

  switch (data) {
    case 'menu:lead':
      await beginLead(ctx);
      break;
    case 'menu:services':
      await sendSection(ctx, lang, 'services', 'section.services');
      break;
    case 'menu:contacts':
      await sendSection(ctx, lang, 'contacts', 'section.contacts');
      break;
    case 'menu:lang':
      await ctx.reply(t(lang, 'lang.choose'), { reply_markup: buildLanguageMenu() });
      break;
    default:
      await ctx.reply(t(lang, 'menu.unknown'));
  }
}
