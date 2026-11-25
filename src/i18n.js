import { settingsStore } from './storage/settingsStore.js';

export const LANGUAGES = Object.freeze(['uk', 'en']);
export const DEFAULT_LANG = 'uk';

export const LANGUAGE_LABELS = Object.freeze({
  uk: '🇺🇦 Українська',
  en: '🇬🇧 English',
});

export const LANGUAGE_SHORT = Object.freeze({ uk: 'UK', en: 'EN' });

// Плоскі ключі навмисно: легко знайти переклад і неможливо загубити вкладеність.
const uk = {
  'lang.chooseFirst': 'Привіт! 👋\nОберіть мову / Choose your language:',
  'lang.choose': 'Оберіть мову, щоб я відповідав зручною 👇',
  'lang.saved.uk': 'Готово! Тепер спілкуємося українською 🇺🇦',
  'lang.saved.en': 'Done! We will speak English from now on 🇬🇧',

  'menu.lead': '📝 Залишити заявку',
  'menu.services': '💼 Послуги та ціни',
  'menu.contacts': '📞 Контакти',
  'menu.language': '🌐 Мова / Language',
  'menu.unknown': 'Не знайшов таку кнопку. Відкрийте меню заново: /start',

  'start.welcome': 'Привіт! Допоможу із заявкою або питанням.\n\nОберіть, що потрібно 👇',

  'section.contacts': '📞 <b>Контакти</b>',
  'section.services': '💼 <b>Послуги та ціни</b>',

  'lead.name.question': 'Як до вас звертатися?',
  'lead.name.short': 'Занадто коротко. Напишіть ім’я повністю.',
  'lead.contact.question': 'Як з вами зв’язатися? Підійде телефон, @username або пошта.',
  'lead.contact.short': 'Перевірте контакт — схоже, він неповний.',
  'lead.description.question': 'Що потрібно зробити? Достатньо пари речень.',
  'lead.description.short': 'Додайте пару деталей — так буде простіше допомогти.',
  'lead.empty': 'Порожнє повідомлення не підійде — напишіть текстом.',
  'lead.tooLong': 'Занадто довго — максимум {max} символів.',
  'lead.privateOnly': 'Заявки приймаю в особистих повідомленнях.',
  'lead.privateOnlyLink': 'Заявки приймаю в особистих повідомленнях: {link}',
  'lead.notUnderstood': 'Поки розумію лише кнопки та команди. Натисніть /start — покажу меню.',
  'lead.needText': 'Потрібен текст — стікери та фото тут не допоможуть.',
  'lead.startHint': 'Щоб залишити заявку, натисніть /start.',
  'lead.accepted': 'Готово! Заявку №{id} прийнято.\nЗв’яжемося з вами за вказаним контактом.',
  'lead.savedNotDelivered':
    'Заявку №{id} збережено, але передати її менеджеру одразу не вдалося. ' +
    'Спробуйте написати ще раз трохи пізніше.',
  'lead.cancelled': 'Гаразд, скасував. Повернутися в меню — /start.',
  'lead.nothingToCancel': 'Нема чого скасовувати — ви в меню.',
  'lead.expired': 'Ця заявка вже неактуальна. Почніть заново: /start.',
  'lead.back': '← Назад',
  'lead.cancel': 'Скасувати',

  'error.callback': 'Щось зламалося. Спробуйте ще раз.',
  'error.message': 'Щось пішло не так. Спробуйте ще раз або натисніть /start.',
};

const en = {
  'lang.chooseFirst': 'Hi! 👋\nChoose your language / Оберіть мову:',
  'lang.choose': 'Pick a language and I will reply in it 👇',
  'lang.saved.uk': 'Done! We will speak Ukrainian from now on 🇺🇦',
  'lang.saved.en': 'Done! We will speak English from now on 🇬🇧',

  'menu.lead': '📝 Leave a request',
  'menu.services': '💼 Services & pricing',
  'menu.contacts': '📞 Contacts',
  'menu.language': '🌐 Мова / Language',
  'menu.unknown': 'I could not find that button. Open the menu again: /start',

  'start.welcome': 'Hi! I can help with a request or a question.\n\nWhat do you need? 👇',

  'section.contacts': '📞 <b>Contacts</b>',
  'section.services': '💼 <b>Services & pricing</b>',

  'lead.name.question': 'What should I call you?',
  'lead.name.short': 'That looks too short — please type your full name.',
  'lead.contact.question': 'How can I reach you? A phone number, @username or email works.',
  'lead.contact.short': 'Please check the contact — it looks incomplete.',
  'lead.description.question': 'What do you need help with? A couple of sentences is enough.',
  'lead.description.short': 'Add a little more detail — it will help me understand.',
  'lead.empty': 'An empty message will not work — please send text.',
  'lead.tooLong': 'Too long — {max} characters max.',
  'lead.privateOnly': 'I take requests in private messages.',
  'lead.privateOnlyLink': 'I take requests in private messages: {link}',
  'lead.notUnderstood': 'I only understand buttons and commands for now. Tap /start to see the menu.',
  'lead.needText': 'I need text here — stickers and photos will not help.',
  'lead.startHint': 'To leave a request, tap /start.',
  'lead.accepted': 'Done! Request #{id} is in.\nI will get back to you using the contact you shared.',
  'lead.savedNotDelivered':
    'Request #{id} is saved, but I could not pass it to the manager right away. ' +
    'Please try again a little later.',
  'lead.cancelled': 'Okay, cancelled. Back to the menu — /start.',
  'lead.nothingToCancel': 'Nothing to cancel — you are in the menu.',
  'lead.expired': 'This request is no longer active. Start again: /start.',
  'lead.back': '← Back',
  'lead.cancel': 'Cancel',

  'error.callback': 'Something broke. Please try again.',
  'error.message': 'Something went wrong. Please try again or tap /start.',
};

const dictionaries = { uk, en };

export function normalizeLang(value) {
  return value === 'en' ? 'en' : DEFAULT_LANG;
}

export function isKnownLang(value) {
  return LANGUAGES.includes(value);
}

export function t(lang, key, vars = {}) {
  const dictionary = dictionaries[normalizeLang(lang)];
  const template = dictionary[key] ?? dictionaries[DEFAULT_LANG][key] ?? key;

  return template.replace(/\{(\w+)\}/g, (match, name) =>
    vars[name] === undefined ? match : String(vars[name]),
  );
}

export function langFor(userId) {
  return normalizeLang(settingsStore.getLang(userId));
}
