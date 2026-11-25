# TG Support Bot

Telegram bot for collecting customer inquiries and forwarding them to an admin chat/group topic. Built with Node.js (ESM) and [grammY](https://grammy.dev/).

## Features

- **Lead intake flow**: step-by-step collection (name → contact → description) with validation, back/cancel buttons.
- **Admin notifications**: formatted lead cards sent to `ADMIN_CHAT_ID` (or forum topic via `ADMIN_TOPIC_ID`) with inline status buttons.
- **Status management**: `✅ Take`, `❌ Close`, `💬 Message` — updates directly in the message.
- **Bilingual UI**: Ukrainian (default) and English. Language selection on first `/start` or via menu button. Persisted per user in JSON.
- **Editable content**: admins (`ADMIN_IDS`) can edit "Contacts" and "Services" texts for both languages via `/contacts` command — no code changes, no restart.
- **Admin commands**: `/stats` (counts by status, 24h/7d), `/leads [N]` (recent leads), `/id` (chat/topic/user IDs).
- **Robustness**: global error handler, graceful shutdown, atomic JSON writes, structured logging.

## Tech Stack

- **Runtime**: Node.js ≥ 20 (ESM)
- **Framework**: grammY
- **Config**: dotenv (`.env` only)
- **Storage**: JSON files (atomic writes via tmp+rename)
- **Deployment**: Docker (multi-stage, non-root), docker-compose

## Project Structure

```
src/
  index.js              # entry point, graceful shutdown
  bot.js                # bot instance, error handler
  commands.js           # command menus (user + per-admin scopes)
  config.js             # env validation & parsing
  defaults.js           # initial texts for contacts/services
  i18n.js               # uk/en dictionaries, t(), langFor()
  keyboards.js          # inline keyboards (main menu, language picker)
  handlers/
    index.js            # handler registration
    start.js            # /start + first language choice
    language.js         # language switch callback
    menu.js             # main menu buttons (lead, services, contacts, language)
    lead.js             # step-by-step lead collection
    admin.js            # /stats, /leads, /id, status callbacks
    adminTexts.js       # /contacts + inline text editor
    errors.js           # global error handler
  storage/
    leadStore.js        # leads JSON storage
    settingsStore.js    # settings JSON (languages + texts)
  state/
    drafts.js           # in-memory lead drafts (TTL 2h)
    adminEdit.js        # in-memory admin edit state (TTL 15m)
  utils/
    logger.js           # leveled logger
    leadView.js         # lead card formatting, status keyboards
scripts/
  get-chat-id.js        # helper to discover chat IDs from getUpdates
  lib/chat-updates.js   # parser for getUpdates response
Dockerfile              # multi-stage, non-root
docker-compose.yml      # production compose with volume
.env.example            # all env vars with comments
```

## Quick Start (Docker Compose)

```bash
# 1. Clone and enter the project
git clone <repo-url>
cd tg-support-bot

# 2. Copy env template and fill required values
cp .env.example .env
# Edit .env: set BOT_TOKEN, ADMIN_CHAT_ID, ADMIN_IDS

# 3. Build and start
docker compose up -d --build

# 4. Follow logs
docker compose logs -f bot
```

The bot stores leads and settings in the named volume `bot-data` (`/app/data` inside container), so data survives container recreation.

## Local Development (Node.js)

```bash
# 1. Install dependencies
npm install

# 2. Copy env template and fill required values
cp .env.example .env
# Edit .env

# 3. Run
npm start           # production
npm run dev         # with --watch auto-reload
```

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `BOT_TOKEN` | yes | Bot token from @BotFather |
| `ADMIN_CHAT_ID` | yes | Numeric chat/channel ID or `@username` of public channel |
| `ADMIN_TOPIC_ID` | no | Forum topic ID (optional) |
| `ADMIN_IDS` | no | Comma-separated admin user IDs (enables `/stats`, `/leads`, `/contacts`, status buttons) |
| `DATA_FILE` | no | Leads JSON path (default: `data/leads.json`) |
| `SETTINGS_FILE` | no | Settings JSON path (default: `data/settings.json`) |
| `CONTACTS_UK` | no | Initial "Contacts" text UK (applied only on first run) |
| `CONTACTS_EN` | no | Initial "Contacts" text EN |
| `SERVICES_UK` | no | Initial "Services" text UK |
| `SERVICES_EN` | no | Initial "Services" text EN |
| `TZ` | no | Timezone for timestamps (default: `UTC`) |
| `LOG_LEVEL` | no | `error` \| `warn` \| `info` \| `debug` (default: `info`) |

## Admin Commands

| Command | Scope | Description |
|---------|-------|-------------|
| `/start` | all | Main menu / initial language selection |
| `/cancel` | all | Cancel current lead draft |
| `/id` | all | Show chat ID, topic ID, user ID |
| `/stats` | `ADMIN_IDS` | Total leads, by status, last 24h/7d |
| `/leads [N]` | `ADMIN_IDS` | Last N leads (default 5, max 20) |
| `/contacts` | `ADMIN_IDS` | Edit Contacts/Services for UK/EN via inline UI |

> After changing `ADMIN_IDS`, restart the bot — command scopes are registered at startup. Runtime permission checks remain in handlers.

## Editing Contacts & Services (Admin)

1. Message the bot in private chat: `/contacts`
2. Choose section & language: `📞 Contacts · UK`, `📞 Contacts · EN`, `💼 Services · UK`, `💼 Services · EN`
3. Bot shows example format + current content. Send new text as one message.
4. Changes apply immediately — users see updated text on next menu open.

Example format for Contacts:
```
Telegram: @support
Email: hello@example.com
Hours: Mon–Fri, 10:00–19:00
```
HTML is supported: `<b>bold</b>`, `<i>italic</i>`, `<a href="...">link</a>`.

## How to Get `ADMIN_CHAT_ID`

Run the helper script (requires only `BOT_TOKEN`, bot must NOT be running elsewhere):

```bash
npm run chatid
```

Steps:
1. Stop any running instance of the bot (avoid 409 Conflict).
2. Add bot to target channel/group.
3. Post a message in the channel, or forward a message from it to the bot in DM.
4. Run `npm run chatid` — it prints all visible chats with IDs and topic IDs.
5. Copy the needed ID to `ADMIN_CHAT_ID` in `.env`.

Alternative: use `/id` command in the target chat once the bot is running.

## Testing

```bash
npm run check    # syntax check all source files
npm test         # runs integration-style tests (requires env vars)
```

## License

MIT