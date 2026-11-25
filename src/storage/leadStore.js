import { mkdir, readFile, rename, writeFile } from 'node:fs/promises';
import path from 'node:path';

import { config } from '../config.js';
import { logger } from '../utils/logger.js';

export const LEAD_STATUSES = Object.freeze({
  NEW: 'new',
  IN_PROGRESS: 'in_progress',
  CLOSED: 'closed',
});

const VALID_STATUSES = new Set(Object.values(LEAD_STATUSES));

function assertValidLead(lead, index) {
  const fail = (reason) => {
    throw new Error(`Заявка №${index + 1} у файлі пошкоджена: ${reason}`);
  };

  if (!lead || typeof lead !== 'object') {
    fail('очікувався об’єкт');
  }
  if (!Number.isInteger(lead.id) || lead.id <= 0) {
    fail('некоректний id');
  }
  if (!VALID_STATUSES.has(lead.status)) {
    fail(`невідомий статус "${lead.status}"`);
  }
  for (const field of ['name', 'contact', 'description', 'createdAt', 'updatedAt']) {
    if (typeof lead[field] !== 'string' || lead[field].length === 0) {
      fail(`поле "${field}" має бути непорожнім рядком`);
    }
  }
  // Старі заявки могли бути без мови — це нормально, для них показуємо UK.
  if (lead.lang !== undefined && lead.lang !== 'uk' && lead.lang !== 'en') {
    fail(`невідома мова "${lead.lang}"`);
  }
}

// Заявки в JSON. Записи йдуть через чергу, файл пишеться атомарно: tmp + rename.
class LeadStore {
  #filePath;
  #leads = [];
  #nextId = 1;
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
      logger.info(`Завантажено заявок: ${this.#leads.length} (${this.#filePath}).`);
    } catch (error) {
      if (error.code !== 'ENOENT') {
        throw new Error(`Не вдалося прочитати файл заявок "${this.#filePath}": ${error.message}`);
      }

      logger.info(`Файл заявок не знайдено, створюємо новий: ${this.#filePath}.`);
      await this.#writeAtomic();
    }

    this.#initialized = true;
  }

  #load(raw) {
    let parsed;

    try {
      parsed = JSON.parse(raw);
    } catch (error) {
      throw new Error(`Файл заявок містить некоректний JSON: ${error.message}`);
    }

    if (!parsed || !Array.isArray(parsed.leads)) {
      throw new Error('Очікувався об’єкт виду { "nextId": 1, "leads": [...] }.');
    }

    parsed.leads.forEach(assertValidLead);

    this.#leads = parsed.leads.map((lead) => ({ ...lead }));
    const maxId = this.#leads.reduce((max, lead) => Math.max(max, lead.id), 0);
    this.#nextId = Math.max(Number(parsed.nextId) || 1, maxId + 1);
  }

  async create(input) {
    const now = new Date().toISOString();
    const lead = {
      id: this.#nextId,
      status: LEAD_STATUSES.NEW,
      name: input.name,
      contact: input.contact,
      description: input.description,
      userId: input.userId,
      username: input.username ?? null,
      lang: input.lang === 'en' ? 'en' : 'uk',
      createdAt: now,
      updatedAt: now,
    };

    this.#leads.push(lead);
    this.#nextId += 1;

    try {
      await this.#persist();
    } catch (error) {
      this.#leads.pop();
      this.#nextId -= 1;
      throw error;
    }

    return { ...lead };
  }

  async setStatus(id, status) {
    if (!VALID_STATUSES.has(status)) {
      throw new Error(`Невідомий статус: ${status}`);
    }

    const lead = this.#leads.find((item) => item.id === id);
    if (!lead) {
      return null;
    }

    if (lead.status === status) {
      return { ...lead };
    }

    const previous = { status: lead.status, updatedAt: lead.updatedAt };
    lead.status = status;
    lead.updatedAt = new Date().toISOString();

    try {
      await this.#persist();
    } catch (error) {
      Object.assign(lead, previous);
      throw error;
    }

    return { ...lead };
  }

  getById(id) {
    const lead = this.#leads.find((item) => item.id === id);
    return lead ? { ...lead } : null;
  }

  recent(limit = 5) {
    return this.#leads.slice(-limit).reverse().map((lead) => ({ ...lead }));
  }

  stats(now = new Date()) {
    const dayAgo = now.getTime() - 24 * 60 * 60 * 1000;
    const weekAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    const byStatus = {
      [LEAD_STATUSES.NEW]: 0,
      [LEAD_STATUSES.IN_PROGRESS]: 0,
      [LEAD_STATUSES.CLOSED]: 0,
    };
    let last24h = 0;
    let last7d = 0;

    for (const lead of this.#leads) {
      byStatus[lead.status] += 1;

      const created = Date.parse(lead.createdAt);
      if (!Number.isNaN(created)) {
        if (created >= dayAgo) last24h += 1;
        if (created >= weekAgo) last7d += 1;
      }
    }

    return { total: this.#leads.length, ...byStatus, last24h, last7d };
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
    const payload = `${JSON.stringify({ nextId: this.#nextId, leads: this.#leads }, null, 2)}\n`;

    await writeFile(tmpPath, payload, 'utf8');
    await rename(tmpPath, this.#filePath);
  }
}

export const leadStore = new LeadStore(config.dataFile);
