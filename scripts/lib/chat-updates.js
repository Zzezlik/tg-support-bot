/**
 * Розбір відповіді getUpdates: які чати й теми бот уже бачив.
 * Винесено окремо, щоб можна було тестувати без мережі.
 */
export function extractChats(updates) {
  const chats = new Map();
  const topics = new Map();

  const addTopic = (chatId, threadId, name) => {
    if (!topics.has(chatId)) {
      topics.set(chatId, new Map());
    }
    if (!topics.get(chatId).has(threadId)) {
      topics.get(chatId).set(threadId, name ?? null);
    }
  };

  for (const update of updates) {
    const message =
      update.message ??
      update.edited_message ??
      update.channel_post ??
      update.edited_channel_post ??
      update.callback_query?.message;

    // my_chat_member приходить, коли бота додали в чат або канал.
    const actor = message ?? update.my_chat_member ?? update.chat_member;
    const chat = actor?.chat;

    if (!chat) {
      continue;
    }

    chats.set(chat.id, chat);

    if (message?.is_topic_message && message.message_thread_id) {
      addTopic(chat.id, message.message_thread_id, message.forum_topic_created?.name);
    }

    // Переслане в особисті повідомлення з каналу/групи: ID джерела лежить у forward_origin.
    const forwarded = message?.forward_origin?.chat ?? message?.forward_from_chat;
    if (forwarded) {
      chats.set(forwarded.id, { ...forwarded, viaForward: true });
    }
  }

  return { chats, topics };
}
