import { t } from '../i18n.js';
import { buildLanguageMenu, buildMainMenu } from '../keyboards.js';
import { clearAdminEdit } from '../state/adminEdit.js';
import { deleteDraft } from '../state/drafts.js';
import { settingsStore } from '../storage/settingsStore.js';

export async function startHandler(ctx) {
  if (ctx.chat.type === 'private') {
    deleteDraft(ctx.from.id);
    clearAdminEdit(ctx.from.id);
  }

  const lang = settingsStore.getLang(ctx.from.id);

  // Перший запуск: мову ще не обрано — показуємо вибір.
  if (!lang) {
    await ctx.reply(t('uk', 'lang.chooseFirst'), { reply_markup: buildLanguageMenu() });
    return;
  }

  await ctx.reply(t(lang, 'start.welcome'), { reply_markup: buildMainMenu(lang) });
}
