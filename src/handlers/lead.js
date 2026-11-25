import { InlineKeyboard } from 'grammy';

import { config } from '../config.js';
import { langFor, t } from '../i18n.js';
import { buildMainMenu } from '../keyboards.js';
import { clearAdminEdit, getAdminEdit } from '../state/adminEdit.js';
import { deleteDraft, getDraft, setDraft } from '../state/drafts.js';
import { leadStore } from '../storage/leadStore.js';
import { logger } from '../utils/logger.js';
import { buildStatusKeyboard, formatLeadCard } from '../utils/leadView.js';

const STEPS = ['name', 'contact', 'description'];

const RULES = {
  name: { min: 2, max: 80, singleLine: true },
  contact: { min: 3, max: 100, singleLine: true },
  description: { min: 5, max: 1000, singleLine: false },
};

function question(step, lang) {
  return t(lang, `lead.${step}.question`);
}

function stepKeyboard(step, lang) {
  const keyboard = new InlineKeyboard();

  if (step !== STEPS[0]) {
    keyboard.text(t(lang, 'lead.back'), 'draft:back');
  }
  keyboard.text(t(lang, 'lead.cancel'), 'draft:cancel');

  return keyboard;
}

async function editPrompt(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, { reply_markup: keyboard ?? { inline_keyboard: [] } });
  } catch {
    await ctx.reply(text, { reply_markup: keyboard });
  }
}

function normalize(text, rule) {
  return (rule.singleLine ? text.replace(/\s+/g, ' ') : text).trim();
}

function validate(value, step, lang) {
  const rule = RULES[step];

  if (!value) {
    return t(lang, 'lead.empty');
  }
  if (value.length < rule.min) {
    return t(lang, `lead.${step}.short`);
  }
  if (value.length > rule.max) {
    return t(lang, 'lead.tooLong', { max: rule.max });
  }
  return null;
}

function privateChatHint(ctx, lang) {
  const username = ctx.me?.username;
  return username
    ? t(lang, 'lead.privateOnlyLink', { link: `https://t.me/${username}` })
    : t(lang, 'lead.privateOnly');
}

async function submit(ctx, values, lang) {
  const lead = await leadStore.create({
    userId: ctx.from.id,
    username: ctx.from.username ?? null,
    name: values.name,
    contact: values.contact,
    description: values.description,
    lang,
  });

  let delivered = true;

  try {
    await ctx.api.sendMessage(config.adminChatId, formatLeadCard(lead), {
      parse_mode: 'HTML',
      reply_markup: buildStatusKeyboard(lead),
      ...(config.adminTopicId ? { message_thread_id: config.adminTopicId } : {}),
    });
  } catch (error) {
    delivered = false;
    logger.error(`Заявка №${lead.id} не пішла в адмін-чат: ${error.message}`);
  }

  const text = delivered
    ? t(lang, 'lead.accepted', { id: lead.id })
    : t(lang, 'lead.savedNotDelivered', { id: lead.id });

  await ctx.reply(text, { reply_markup: buildMainMenu(lang) });
}

export async function beginLead(ctx) {
  const lang = langFor(ctx.from?.id);

  if (ctx.chat?.type !== 'private') {
    await ctx.reply(privateChatHint(ctx, lang));
    return;
  }

  const draft = getDraft(ctx.from.id);

  if (draft) {
    await ctx.reply(question(draft.step, lang), { reply_markup: stepKeyboard(draft.step, lang) });
    return;
  }

  setDraft(ctx.from.id, { step: STEPS[0], values: {} });
  await ctx.reply(question(STEPS[0], lang), { reply_markup: stepKeyboard(STEPS[0], lang) });
}

export async function leadTextHandler(ctx) {
  const lang = langFor(ctx.from?.id);
  const draft = ctx.from?.id ? getDraft(ctx.from.id) : undefined;

  if (!draft) {
    if (ctx.chat.type === 'private') {
      await ctx.reply(t(lang, 'lead.notUnderstood'));
    }
    return;
  }

  const rule = RULES[draft.step];
  const value = normalize(ctx.message.text, rule);
  const error = validate(value, draft.step, lang);

  if (error) {
    await ctx.reply(error);
    return;
  }

  draft.values[draft.step] = value;

  const nextStep = STEPS[STEPS.indexOf(draft.step) + 1];

  if (nextStep) {
    draft.step = nextStep;
    await ctx.reply(question(nextStep, lang), { reply_markup: stepKeyboard(nextStep, lang) });
    return;
  }

  deleteDraft(ctx.from.id);
  await submit(ctx, draft.values, lang);
}

export async function draftCallbackHandler(ctx) {
  const lang = langFor(ctx.from?.id);
  const data = ctx.callbackQuery?.data;
  const draft = ctx.from?.id ? getDraft(ctx.from.id) : undefined;

  await ctx.answerCallbackQuery();

  if (!draft) {
    await editPrompt(ctx, t(lang, 'lead.expired'));
    return;
  }

  if (data === 'draft:cancel') {
    deleteDraft(ctx.from.id);
    await editPrompt(ctx, t(lang, 'lead.cancelled'));
    return;
  }

  const index = STEPS.indexOf(draft.step);
  if (index <= 0) {
    return;
  }

  draft.step = STEPS[index - 1];
  await editPrompt(ctx, question(draft.step, lang), stepKeyboard(draft.step, lang));
}

export async function cancelHandler(ctx) {
  const lang = langFor(ctx.from?.id);
  const hadDraft = Boolean(getDraft(ctx.from.id));
  const hadEdit = Boolean(getAdminEdit(ctx.from.id));

  deleteDraft(ctx.from.id);
  clearAdminEdit(ctx.from.id);

  await ctx.reply(hadDraft || hadEdit ? t(lang, 'lead.cancelled') : t(lang, 'lead.nothingToCancel'), {
    reply_markup: buildMainMenu(lang),
  });
}

export async function leadOtherMessageHandler(ctx) {
  if (ctx.chat?.type !== 'private') {
    return;
  }

  const lang = langFor(ctx.from?.id);

  if (!getDraft(ctx.from?.id)) {
    await ctx.reply(t(lang, 'lead.startHint'));
    return;
  }

  await ctx.reply(t(lang, 'lead.needText'));
}
