import { InlineKeyboard } from 'grammy';

import { LEAD_STATUSES } from '../storage/leadStore.js';

const STATUS = {
  [LEAD_STATUSES.NEW]: { icon: '🆕', label: 'нова' },
  [LEAD_STATUSES.IN_PROGRESS]: { icon: '🟡', label: 'в роботі' },
  [LEAD_STATUSES.CLOSED]: { icon: '✅', label: 'закрита' },
};

const KYIV_TIME = new Intl.DateTimeFormat('uk-UA', {
  timeZone: 'UTC',
  day: '2-digit',
  month: '2-digit',
  year: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;');
}

export function formatDateTime(iso) {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? '—' : KYIV_TIME.format(date);
}

// Телефон та інше — <code>, щоб легко скопіювати; username і пошту — посиланням.
function formatContact(contact) {
  const value = contact.trim();

  if (/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(value)) {
    return `<a href="https://t.me/${value.slice(1)}">${escapeHtml(value)}</a>`;
  }

  if (/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(value)) {
    return `<a href="mailto:${escapeHtml(value)}">${escapeHtml(value)}</a>`;
  }

  return `<code>${escapeHtml(value)}</code>`;
}

function contactUrl(lead) {
  return lead.username ? `https://t.me/${lead.username}` : `tg://user?id=${lead.userId}`;
}

export function formatLeadCard(lead) {
  const status = STATUS[lead.status] ?? STATUS[LEAD_STATUSES.NEW];
  const clientLang = lead.lang === 'en' ? 'EN' : 'UK';
  const author = lead.username
    ? `@${escapeHtml(lead.username)} · id ${lead.userId}`
    : `id ${lead.userId}`;

  return [
    `${status.icon} <b>Заявка №${lead.id}</b> · ${status.label} · ${formatDateTime(lead.createdAt)}`,
    `👤 ${escapeHtml(lead.name)} · ${formatContact(lead.contact)}`,
    `📝 ${escapeHtml(lead.description)}`,
    '',
    `🌐 Мова: ${clientLang}`,
    author,
  ].join('\n');
}

export function formatLeadSummary(lead) {
  const status = STATUS[lead.status] ?? STATUS[LEAD_STATUSES.NEW];
  const description = lead.description.replace(/\s+/g, ' ').trim();
  const short = description.length > 90 ? `${description.slice(0, 87).trimEnd()}...` : description;

  return [
    `#${lead.id} · ${status.label} · ${formatDateTime(lead.createdAt)}`,
    `${escapeHtml(lead.name)} · ${formatContact(lead.contact)}`,
    escapeHtml(short),
  ].join('\n');
}

export function buildStatusKeyboard(lead) {
  const keyboard = new InlineKeyboard();

  if (lead.status === LEAD_STATUSES.NEW) {
    keyboard.text('✅ Взяти в роботу', `admin:status:${lead.id}:${LEAD_STATUSES.IN_PROGRESS}`);
  }

  if (lead.status !== LEAD_STATUSES.CLOSED) {
    keyboard.text('❌ Закрити', `admin:status:${lead.id}:${LEAD_STATUSES.CLOSED}`);
    keyboard.row();
  }

  keyboard.url('💬 Написати', contactUrl(lead));

  return keyboard;
}
