import { InlineKeyboard } from 'grammy';

import { LANGUAGE_LABELS, t } from './i18n.js';

export function buildMainMenu(lang) {
  return new InlineKeyboard()
    .text(t(lang, 'menu.lead'), 'menu:lead')
    .row()
    .text(t(lang, 'menu.services'), 'menu:services')
    .text(t(lang, 'menu.contacts'), 'menu:contacts')
    .row()
    .text(t(lang, 'menu.language'), 'menu:lang');
}

export function buildLanguageMenu() {
  return new InlineKeyboard()
    .text(LANGUAGE_LABELS.uk, 'lang:set:uk')
    .text(LANGUAGE_LABELS.en, 'lang:set:en');
}
