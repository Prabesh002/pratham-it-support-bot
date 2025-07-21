# Pratham IT Support Bot

This is my take on building a modern Telegram bot from scratch using Node.js, TypeScript, `grammy`, and an Express.js backend. The main idea was to create something more powerful than a simple command-response bot by integrating a real AI chat, interactive menus, and a full-blown **Telegram Web App** for complex tasks.

I've put a lot of effort into the architecture, which has recently been refactored into a **multi-bot orchestrator**. It uses Dependency Injection (`tsyringe`) and a modular, feature-based system to keep things clean, scalable, and easy to extend. It's a learning project, so some parts might not be perfect, but the foundation is solid. If you see something that could be better or have an idea, feel free to give feedback!

---

### Features

- **Multi-Bot Orchestrator** – Run multiple, independent bot instances from a single configuration file.
- **Feature-Driven Architecture** – Enable or disable features for each bot via simple config changes.
- **Conversational AI** – Connects to a backend AI service for smart chat support (custom API).
- **Interactive Menus** – Clean inline keyboard menus to navigate options without clutter.
- **Telegram Web App Integration** – Open full-screen web forms directly inside Telegram.
- **Direct Webhook Support** – Web App events are routed cleanly per bot.
- **Fully Dockerized** – With a multi-stage `Dockerfile` and `docker-compose.yml` setup.
- **Dependency Injection** – Uses `tsyringe` with scoped containers for each bot instance.
- **Type-Safe** – Built 100% in TypeScript for reliability and maintainability.
- **Configuration Validation** – All configs and envs are validated on boot using `zod`.

---

###  Project Goals

This bot was built for an upcoming demo at **Pratham IT System** to showcase how bots can boost efficiency and client experience

- **Modular Code** – AI chat, FAQs, Web Apps, etc. are cleanly separated.
- **Scalability-Ready** – Add more bots or scale to Redis-backed sessions easily.
- **User Experience First** – Combine commands, menus, and Web Apps for powerful UX.
- **Learning & Fun** – Explore real-world Telegram bot architecture and practices.

---

### Setup

1. **Clone the Repository**

```bash
git clone https://github.com/Nellow-Pat/pratham-it-support-bot
cd pratham-it-support-bot
````

2. **Install Dependencies**

```bash
npm install
```


Edit `bots.config.json` and define your bots and their enabled features.

3. **Configure Environment Variables**

```bash
cp .env.example .env
```

Make sure your variable names (like `SUPPORT_BOT_TOKEN`) match those in the bot config file.

---

### Running the Bot

#### Development (with hot reload)

```bash
npm run dev
```

#### Production

```bash
npm run start
```

#### With Docker (recommended)

```bash
docker-compose up --build -d
```

##### View Logs

```bash
docker-compose logs -f
```

##### Stop the Container

```bash
docker-compose down
```

---

### Sample Usage

* `/start` – Entry point, shows a welcome menu.
* **Chat with AI** – Opens a 1-on-1 AI session.
* **Raise an issue** – Launches Telegram Web App for submitting a support ticket.
* **View FAQs** – Opens a browsable FAQ menu.
* `/end` – Ends AI session.

---

### Adding a New Feature

Let’s say you want to add a new `/status` command.

1. **Create the Feature Folder**

Create: `src/features/system-status/`

2. **Add the Command**

```ts
// src/features/system-status/commands/StatusCommand.ts
import { injectable } from 'tsyringe';
import { CommandContext } from 'grammy';
import { BotContext } from '@/core/models/context.model';
import { ICommand } from '@/core/interfaces/IHandler';

@injectable()
export class StatusCommand implements ICommand {
  public readonly command = 'status';

  public async handle(ctx: CommandContext<BotContext>): Promise<void> {
    await ctx.reply('Everything is running smoothly!');
  }
}
```

3. **Create the Module**

```ts
// src/features/system-status/module.ts
import { Bot } from 'grammy';
import { DependencyContainer } from 'tsyringe';
import { BotContext } from '@/core/models/context.model';
import { IFeatureModule } from '@/core/interfaces/IFeatureModule';
import { ICommand } from '@/core/interfaces/IHandler';
import { StatusCommand } from './commands/StatusCommand';

export default class SystemStatusFeature implements IFeatureModule {
  public readonly name = 'system-status';

  public register(container: DependencyContainer): void {
    container.register(ICommand, { useClass: StatusCommand });
  }
}
```

4. **Enable It in Config**

Update `config/bots.config.json`:

```json
{
  "id": "prathamSupportBot",
  "tokenEnvVar": "SUPPORT_BOT_TOKEN",
  "description": "The main Pratham IT support bot.",
  "enabledFeatures": [
    "core-commands",
    "ai-chat",
    "web-app",
    "system-status"
  ]
}
```

It's easy.

---

###  Thanks!

Thanks for checking out this project. I hope it inspires you to build your own powerful Telegram bots. Contributions, ideas, and suggestions are always welcome!


