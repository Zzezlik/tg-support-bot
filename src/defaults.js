// Початкові тексти розділів. Використовуються лише при першому запуску,
// далі адмін змінює їх через /contacts — код чіпати не потрібно.
export const DEFAULT_TEXTS = Object.freeze({
  contacts: Object.freeze({
    uk: [
      'Telegram: @your_telegram',
      'Пошта: hello@your-domain.com',
      'Графік: Пн–пт, 10:00–19:00',
    ].join('\n'),
    en: [
      'Telegram: @your_telegram',
      'Email: hello@your-domain.com',
      'Hours: Mon–Fri, 10:00–19:00',
    ].join('\n'),
  }),
  services: Object.freeze({
    uk: [
      '• Консультація',
      '• Розробка',
      '• Підтримка',
      '',
      'Вартість залежить від задачі. Залиште заявку — обговоримо деталі та назвемо ціну.',
    ].join('\n'),
    en: [
      '• Consulting',
      '• Development',
      '• Support',
      '',
      'Pricing depends on the task. Send a request and we will discuss the details.',
    ].join('\n'),
  }),
});
