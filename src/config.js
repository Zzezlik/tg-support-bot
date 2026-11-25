import path from 'node:path';

import dotenv from 'dotenv';

import { DEFAULT_TEXTS } from './defaults.js';
import { logger } from './utils/logger.js';

// Змінні оточення беремо лише з .env (у Docker вони приходять із compose).
dotenv.config({ quiet: true });

export class ConfigError extends Error {
  constructor(message) {
    super(message);
    this.name = 'ConfigError';
  }
}

const LOG_LEVELS = new Set(['error', 'warn', 'info', 'debug']);

function requireEnv(name) {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new ConfigError(
      `Не задано змінну ${name}. Скопіюйте .env.example у .env і заповніть значення.`,
    );
  }

  return value;
}

function parseBotToken(raw) {
  if (!/^\d+:[A-Za-z0-9_-]{30,}$/.test(raw)) {
    throw new ConfigError('BOT_TOKEN виглядає неправильно. Потрібен токен із @BotFather.');
  }

  return raw;
}

function parseAdminIds(rawValue) {
  const raw = rawValue?.trim();
  if (!raw) {
    logger.warn('ADMIN_IDS порожній: адмін-команди та кнопки статусів нікому не видно.');
    return new Set();
  }

  const parts = raw.split(/[\s,]+/).filter(Boolean);
  const invalid = parts.filter((part) => !/^-?\d+$/.test(part));

  if (invalid.length > 0) {
    throw new ConfigError(
      `В ADMIN_IDS потрапили не числа: ${invalid.join(', ')}. Потрібні Telegram user ID через кому.`,
    );
  }

  return new Set(parts.map(Number));
}

function parseAdminChatId(rawValue) {
  const raw = rawValue?.trim();

  if (!raw) {
    throw new ConfigError(
      'Не задано ADMIN_CHAT_ID — чат, куди приходять заявки. ' +
        'Додайте бота в канал або групу й виконайте "npm run chatid". ' +
        'Для публічного каналу підійде @username.',
    );
  }

  if (/^-?\d+$/.test(raw)) {
    return Number(raw);
  }

  if (/^@[A-Za-z][A-Za-z0-9_]{4,31}$/.test(raw)) {
    return raw;
  }

  throw new ConfigError(
    `ADMIN_CHAT_ID має бути числом на кшталт -1001234567890 або @username, а не "${raw}".`,
  );
}

function parseAdminTopicId(rawValue) {
  const raw = rawValue?.trim();
  if (!raw) {
    return null;
  }

  if (!/^\d+$/.test(raw) || Number(raw) <= 0) {
    throw new ConfigError(`ADMIN_TOPIC_ID має бути додатним числом, а не "${raw}".`);
  }

  return Number(raw);
}

function parseLogLevel(rawValue) {
  const raw = rawValue?.trim().toLowerCase();

  if (!raw) {
    return 'info';
  }

  if (!LOG_LEVELS.has(raw)) {
    throw new ConfigError(
      `LOG_LEVEL: ${[...LOG_LEVELS].join(', ')} — допустимі значення, отримано "${raw}".`,
    );
  }

  return raw;
}

function parseDataFile(rawValue, fallback) {
  return path.resolve(rawValue?.trim() || fallback);
}

// У .env переноси рядків можна писати як \n — тут вони стають справжніми.
function parseText(rawValue, fallback) {
  const value = rawValue?.trim();
  return value ? value.replaceAll('\\n', '\n') : fallback;
}

const adminIds = parseAdminIds(process.env.ADMIN_IDS);

export const config = Object.freeze({
  botToken: parseBotToken(requireEnv('BOT_TOKEN')),
  adminChatId: parseAdminChatId(process.env.ADMIN_CHAT_ID),
  adminTopicId: parseAdminTopicId(process.env.ADMIN_TOPIC_ID),
  adminIds: Object.freeze([...adminIds]),
  dataFile: parseDataFile(process.env.DATA_FILE, 'data/leads.json'),
  settingsFile: parseDataFile(process.env.SETTINGS_FILE, 'data/settings.json'),
  logLevel: parseLogLevel(process.env.LOG_LEVEL),
  defaults: Object.freeze({
    contacts: Object.freeze({
      uk: parseText(process.env.CONTACTS_UK, DEFAULT_TEXTS.contacts.uk),
      en: parseText(process.env.CONTACTS_EN, DEFAULT_TEXTS.contacts.en),
    }),
    services: Object.freeze({
      uk: parseText(process.env.SERVICES_UK, DEFAULT_TEXTS.services.uk),
      en: parseText(process.env.SERVICES_EN, DEFAULT_TEXTS.services.en),
    }),
  }),
});

export function isAdmin(userId) {
  return Number.isInteger(userId) && adminIds.has(userId);
}
