import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { config } from '../config.js';
import { logger } from '../utils/logger.js';

const LANGS = new Set(['uk', 'en']);
const SECTIONS = new Set(['contacts', 'services']);

function defaultTexts() {
  return {
    contacts: { ...config.defaults.contacts },
    services: { ...config.defaults.services },
  };
}

// Налаштування в JSON: мова кожного користувача і редаговані тексти розділів.
class SettingsStore {
  #filePath;
  #users = {};
  #texts = defaultTexts();
  #writeQueue = Promise.resolve();
  #initialized = false;

  constructor(filePath) {
    this.#filePath = filePath;
  }

  get filePath() {
    return this.#filePath;
  }

  async init() {
    if (this.#initialized) {
      return;
    }

    await mkdir(path.dirname(this.#filePath), { recursive: true });

    try {
      const raw = await readFile(this.#filePath, 'utf8');
      this.#load(raw);
      logger.info(`Налаштування завантажено: ${this.#filePath}.`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(
          `Не вдалося прочитати файл налаштувань "${this.#filePath}": ${error.message}`,
        );
      }

      logger.info(`Файл налаштувань не знайдено, створюємо новий: ${this.#filePath}.`);
      await this.#writeAtomic();
    }

    this.#initialized = true;
  }

  #load(raw) {
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Файл налаштувань містить некоректний JSON: ${error.message}`);
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('Очікувався об’єкт виду { "users": {...}, "texts": {...} }.');
    }

    const users = {};
    if (parsed.users && typeof parsed.users === 'object') {
      for (const [userId, lang] of Object.entries(parsed.users)) {
        if (/^-?\d+$/.test(userId) && LANGS.has(lang)) {
          users[userId] = lang;
        }
      }
    }
    this.#users = users;

    // Відсутні або пошкоджені тексти підставляємо з дефолтів, решта лишається.
    const texts = defaultTexts();
    if (parsed.texts && typeof parsed.texts === 'object') {
      for (const section of SECTIONS) {
        for (const lang of LANGS) {
          const value = parsed.texts[section]?.[lang];
          if (typeof value === 'string') {
            texts[section][lang] = value;
          }
        }
      }
    }
    this.#texts = texts;
  }

  getLang(userId) {
    const lang = this.#users[String(userId)];
    return LANGS.has(lang) ? lang : null;
  }

  async setLang(userId, lang) {
    if (!LANGS.has(lang)) {
      throw new Error(`Невідома мова: ${lang}`);
    }

    const key = String(userId);
    const previous = this.#users[key];

    if (previous === lang) {
      return lang;
    }

    this.#users[key] = lang;

    try {
      await this.#persist();
    } catch (error) {
      if (previous === undefined) {
        delete this.#users[key];
      } else {
        this.#users[key] = previous;
      }
      throw error;
    }

    return lang;
  }

  getText(section, lang) {
    const safeSection = SECTIONS.has(section) ? section : 'contacts';
    const safeLang = LANGS.has(lang) ? lang : 'uk';
    return this.#texts[safeSection][safeLang];
  }

  async setText(section, lang, value) {
    if (!SECTIONS.has(section)) {
      throw new Error(`Невідомий розділ: ${section}`);
    }
    if (!LANGS.has(lang)) {
      throw new Error(`Невідома мова: ${lang}`);
    }

    const text = String(value ?? '').trim();
    if (!text) {
      throw new Error('Текст не може бути порожнім.');
    }

    const previous = this.#texts[section][lang];
    if (previous === text) {
      return text;
    }

    this.#texts[section][lang] = text;

    try {
      await this.#persist();
    } catch (error) {
      this.#texts[section][lang] = previous;
      throw error;
    }

    return text;
  }

  #persist() {
    const run = this.#writeQueue.then(() => this.#writeAtomic());
    // Черга не повинна залипати після помилки запису.
    this.#writeQueue = run.catch(() => {});
    return run;
  }

  async flush() {
    await this.#writeQueue;
  }

  async #writeAtomic() {
    const tmpPath = `${this.#filePath}.${process.pid}.tmp`;
    const payload = `${JSON.stringify({ users: this.#users, texts: this.#texts }, null, 2)}\n`;

    await writeFile(tmpPath, payload, 'utf8');
    await rename(tmpPath, this.#filePath);
  }
}

export const settingsStore = new SettingsStore(config.settingsFile);
