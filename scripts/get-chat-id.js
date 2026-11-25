/**
 * Helper script: prints chat IDs and topics from getUpdates.
 *
 * Usage:
 *   1. Stop any running bot instance (Telegram returns 409 Conflict).
 *   2. Add the bot to the target channel or group.
 *   3. Forward a message from the channel to the bot in a private chat,
 *      or simply add the bot to the channel.
 *   4. Run: npm run chatid
 */
import dotenv from 'dotenv';

import { extractChats } from './lib/chat-updates.js';

dotenv.config({ quiet: true });

const token = process.env.BOT_TOKEN?.trim();

if (!token) {
  console.error('BOT_TOKEN not set. Copy .env.example to .env and fill BOT_TOKEN.');
  process.exit(1);
}

const response = await fetch(`https://api.telegram.org/bot${token}/getUpdates`);
const payload = await response.json().catch(() => null);

if (!payload) {
  console.error('Could not parse Telegram API response.');
  process.exit(1);
}

if (!payload.ok) {
  if (payload.error_code === 409) {
    console.error(
      'Bot is already running and consuming updates (409 Conflict).\n' +
        'Stop it or use /id command in the target chat.',
    );
  } else {
    console.error(`Telegram API error ${payload.error_code}: ${payload.description}`);
  }
  process.exit(1);
}

const { chats, topics } = extractChats(payload.result);

if (chats.size === 0) {
  console.log(
    [
      'No chats detected yet.',
      '',
      'To discover a chat ID:',
      '1. If the bot is running — stop it.',
      '2. Add the bot to the target channel or group.',
      '3. Publish a post in the channel OR forward a message from the channel to the bot.',
      '4. Run: npm run chatid again.',
      '',
      'Or use the /id command in the chat to get the ID directly.',
    ].join('\n'),
  );
  process.exit(0);
}

console.log('Found chats:\n');

for (const chat of chats.values()) {
  const title =
    chat.title ?? [chat.first_name, chat.last_name].filter(Boolean).join(' ') ?? '(untitled)';

  console.log(`ID: ${chat.id}`);
  console.log(`  Type: ${chat.type}`);
  console.log(`  Title: ${title}`);
  console.log(`  Username: ${chat.username ? `@${chat.username}` : '—'}`);
  if (chat.viaForward) {
    console.log('  Source: forwarded message');
  }

  const chatTopics = topics.get(chat.id);
  if (chatTopics) {
    for (const [threadId, name] of chatTopics) {
      console.log(`  Topic: message_thread_id ${threadId}${name ? ` (${name})` : ''}`);
    }
  }

  console.log('');
}

console.log('Copy the needed ID to ADMIN_CHAT_ID (and topic ID to ADMIN_TOPIC_ID) in .env.');
console.log('For supergroups and channels the ID is negative, e.g. -1001234567890.');
console.log('For public channels you can use @username instead.');