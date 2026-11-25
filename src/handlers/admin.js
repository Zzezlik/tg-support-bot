import { isAdmin } from '../config.js';
import { LEAD_STATUSES, leadStore } from '../storage/leadStore.js';
import { logger } from '../utils/logger.js';
import {
  buildStatusKeyboard,
  escapeHtml,
  formatLeadCard,
  formatLeadSummary,
} from '../utils/leadView.js';

const ADMIN_STATUS_RE = /^admin:status:(\d+):(new|in_progress|closed)$/;
const ADMIN_ONLY = 'Це лише для адмінів.';
const STATUS_LABEL = {
  [LEAD_STATUSES.NEW]: 'нова',
  [LEAD_STATUSES.IN_PROGRESS]: 'в роботі',
  [LEAD_STATUSES.CLOSED]: 'закрита',
};

export async function adminStatusCallback(ctx) {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCallbackQuery({ text: 'Недостатньо прав.', show_alert: true });
    return;
  }

  const match = ADMIN_STATUS_RE.exec(ctx.callbackQuery?.data ?? '');
  if (!match) {
    await ctx.answerCallbackQuery();
    return;
  }

  const leadId = Number(match[1]);
  const lead = await leadStore.setStatus(leadId, match[2]);

  if (!lead) {
    await ctx.answerCallbackQuery({ text: `Заявку №${leadId} не знайдено.`, show_alert: true });
    return;
  }

  const label = STATUS_LABEL[lead.status] ?? 'оновлена';
  await ctx.answerCallbackQuery({ text: `Заявка №${leadId}: ${label}.` });

  try {
    await ctx.editMessageText(formatLeadCard(lead), {
      parse_mode: 'HTML',
      reply_markup: buildStatusKeyboard(lead),
    });
  } catch (error) {
    // Повторне натискання тієї ж кнопки — Telegram скаржиться на незмінений текст.
    if (!error.message.includes('message is not modified')) {
      logger.warn(`Картка заявки №${leadId} не оновилася: ${error.message}`);
    }
  }
}

export async function statsHandler(ctx) {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply(ADMIN_ONLY);
    return;
  }

  const stats = leadStore.stats();
  const text = [
    '📊 <b>Заявки</b>',
    `Усього ${stats.total} · нові ${stats[LEAD_STATUSES.NEW]} · ` +
      `в роботі ${stats[LEAD_STATUSES.IN_PROGRESS]} · закриті ${stats[LEAD_STATUSES.CLOSED]}`,
    `За добу ${stats.last24h} · за тиждень ${stats.last7d}`,
  ].join('\n');

  await ctx.reply(text, { parse_mode: 'HTML' });
}

export async function leadsHandler(ctx) {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply(ADMIN_ONLY);
    return;
  }

  const parsed = Number.parseInt((ctx.match ?? '').trim(), 10);
  const limit = Number.isNaN(parsed) ? 5 : Math.min(Math.max(parsed, 1), 20);
  const leads = leadStore.recent(limit);

  if (leads.length === 0) {
    await ctx.reply('Заявок поки немає.');
    return;
  }

  const text = ['<b>Останні заявки</b>', ...leads.map(formatLeadSummary)].join('\n\n');
  await ctx.reply(text, { parse_mode: 'HTML' });
}

export async function idHandler(ctx) {
  const lines = ['🪪 <b>ID</b>', `Чат: <code>${ctx.chat.id}</code>`, `Тип: ${ctx.chat.type}`];

  if (ctx.chat.title) {
    lines.push(`Назва: ${escapeHtml(ctx.chat.title)}`);
  }

  const threadId = ctx.message?.message_thread_id;
  if (threadId) {
    lines.push(`Тема: <code>${threadId}</code>`);
  }

  lines.push(`Ваш профіль: <code>${ctx.from.id}</code>`);

  await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' });
}
