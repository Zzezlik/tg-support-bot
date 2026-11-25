import { t } from '../i18n.js';
import { buildMainMenu } from '../keyboards.js';
import { settingsStore } from '../storage/settingsStore.js';

const LANG_CALLBACK_RE = /^lang:set:(uk|en)$/;

export async function languageCallbackHandler(ctx) {
  const match = LANG_CALLBACK_RE.exec(ctx.callbackQuery?.data ?? '');

  if (!match) {
    await ctx.answerCallbackQuery();
    return;
  }

  const lang = match[1];
  await settingsStore.setLang(ctx.from.id, lang);

  const text = `${t(lang, `lang.saved.${lang}`)}\n\n${t(lang, 'start.welcome')}`;
  const keyboard = buildMainMenu(lang);

  await ctx.answerCallbackQuery({ text: t(lang, `lang.saved.${lang}`) });

  try {
    await ctx.editMessageText(text, { reply_markup: keyboard });
  } catch {
    await ctx.reply(text, { reply_markup: keyboard });
  }
}
