import { InlineKeyboard } from 'grammy';

import { isAdmin } from '../config.js';
import { clearAdminEdit, getAdminEdit, setAdminEdit } from '../state/adminEdit.js';
import { settingsStore } from '../storage/settingsStore.js';
import { escapeHtml } from '../utils/leadView.js';

const SECTIONS = {
  contacts: { icon: '📞', title: { uk: 'Контакти', en: 'Contacts' } },
  services: { icon: '💼', title: { uk: 'Послуги та ціни', en: 'Services & pricing' } },
};

const LANG_LABEL = { uk: '🇺🇦 UK', en: '🇬🇧 EN' };
const ADMIN_ONLY = 'Це лише для адмінів.';
const MAX_TEXT_LENGTH = 2000;
const EDIT_CALLBACK_RE = /^admin:text:(contacts|services):(uk|en)$/;

const PANEL_TEXT = [
  '🗂 <b>Тексти для користувачів</b>',
  '',
  'Оберіть розділ і мову. Зміни одразу побачать користувачі — перезапуск не потрібен.',
].join('\n');

const EXAMPLES = {
  contacts: {
    uk: ['Telegram: @username', 'Пошта: hello@example.com', 'Графік: Пн–пт, 10:00–19:00'].join('\n'),
    en: ['Telegram: @username', 'Email: hello@example.com', 'Hours: Mon–Fri, 10:00–19:00'].join('\n'),
  },
  services: {
    uk: ['• Консультація — від 1500 ₴', '• Розробка — від 5000 ₴', '• Підтримка — від 1000 ₴/міс'].join(
      '\n',
    ),
    en: ['• Consulting — from $50', '• Development — from $150', '• Support — from $30/mo'].join('\n'),
  },
};

function sectionTitle(section, lang) {
  return SECTIONS[section].title[lang];
}

function panelKeyboard() {
  return new InlineKeyboard()
    .text('📞 Контакти · UK', 'admin:text:contacts:uk')
    .text('📞 Контакти · EN', 'admin:text:contacts:en')
    .row()
    .text('💼 Послуги · UK', 'admin:text:services:uk')
    .text('💼 Послуги · EN', 'admin:text:services:en');
}

function editIntro(section, lang) {
  return [
    `<b>${SECTIONS[section].icon} ${escapeHtml(sectionTitle(section, lang))} · ${LANG_LABEL[lang]}</b>`,
    '',
    'Надішліть новий текст одним повідомленням. Можна вставляти HTML: <b>жирний</b>, <i>курсив</i>, <a href="https://example.com">посилання</a>.',
    '',
    'Орієнтовний формат:',
    `<pre>${escapeHtml(EXAMPLES[section][lang])}</pre>`,
    '',
    'Зараз показується так:',
    `<pre>${escapeHtml(settingsStore.getText(section, lang))}</pre>`,
  ].join('\n');
}

async function show(ctx, text, keyboard) {
  try {
    await ctx.editMessageText(text, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch {
    await ctx.reply(text, { parse_mode: 'HTML', reply_markup: keyboard });
  }
}

async function showPanel(ctx) {
  await show(ctx, PANEL_TEXT, panelKeyboard());
}

async function previewSection(ctx, section, lang, text, keyboard) {
  const title = `${SECTIONS[section].icon} <b>${escapeHtml(sectionTitle(section, lang))}</b>`;
  const body = `${title}\n\n${text}`;

  try {
    await ctx.reply(body, { parse_mode: 'HTML', reply_markup: keyboard });
  } catch {
    await ctx.reply(
      `${SECTIONS[section].icon} ${sectionTitle(section, lang)}\n\n${text}`,
      { reply_markup: keyboard },
    );
  }
}

export async function contactsHandler(ctx) {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.reply(ADMIN_ONLY);
    return;
  }

  if (ctx.chat?.type !== 'private') {
    const username = ctx.me?.username;
    await ctx.reply(
      username
        ? `Редагувати тексти зручніше в особистих повідомленнях: https://t.me/${username}`
        : 'Редагувати тексти можна лише в особистих повідомленнях.',
    );
    return;
  }

  clearAdminEdit(ctx.from.id);
  await ctx.reply(PANEL_TEXT, { parse_mode: 'HTML', reply_markup: panelKeyboard() });
}

export async function adminEditCallbackHandler(ctx) {
  if (!isAdmin(ctx.from?.id)) {
    await ctx.answerCallbackQuery({ text: 'Недостатньо прав.', show_alert: true });
    return;
  }

  const data = ctx.callbackQuery?.data ?? '';

  if (data === 'admin:text:panel') {
    clearAdminEdit(ctx.from.id);
    await ctx.answerCallbackQuery();
    await showPanel(ctx);
    return;
  }

  if (data === 'admin:text:cancel') {
    clearAdminEdit(ctx.from.id);
    await ctx.answerCallbackQuery({ text: 'Скасовано.' });
    await showPanel(ctx);
    return;
  }

  const match = EDIT_CALLBACK_RE.exec(data);
  if (!match) {
    await ctx.answerCallbackQuery();
    return;
  }

  const [, section, lang] = match;
  setAdminEdit(ctx.from.id, { section, lang });
  await ctx.answerCallbackQuery();

  const keyboard = new InlineKeyboard()
    .text('← Назад', 'admin:text:panel')
    .text('Скасувати', 'admin:text:cancel');

  await show(ctx, editIntro(section, lang), keyboard);
}

export async function adminEditTextHandler(ctx, next) {
  const edit = ctx.from?.id ? getAdminEdit(ctx.from.id) : undefined;

  if (!edit) {
    return next();
  }

  if (!isAdmin(ctx.from?.id)) {
    clearAdminEdit(ctx.from.id);
    return next();
  }

  if (ctx.chat?.type !== 'private') {
    await ctx.reply('Напишіть мені в особисті, щоб зберегти текст.');
    return;
  }

  const text = ctx.message.text.replace(/\r\n/g, '\n').trim();

  if (!text) {
    await ctx.reply('Порожній текст не збережу. Надішліть хоча б один рядок.');
    return;
  }

  if (text.length > MAX_TEXT_LENGTH) {
    await ctx.reply(`Задовго — максимум ${MAX_TEXT_LENGTH} символів.`);
    return;
  }

  await settingsStore.setText(edit.section, edit.lang, text);
  clearAdminEdit(ctx.from.id);

  await ctx.reply('✅ Збережено. Ось як це побачать користувачі 👇');
  await previewSection(ctx, edit.section, edit.lang, text, panelKeyboard());
}
