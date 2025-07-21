import { inject, injectable, DependencyContainer } from 'tsyringe';
import { Bot, Filter } from 'grammy';
import { BotContext } from '../models/context.model';
import {
  ICommand,
  ICallbackQueryHandler,
  IMessageHandler,
} from '../interfaces/IHandler';
import { LoggerService } from '@/utils/logger';

@injectable()
export class BotHandlerService {
  constructor(
    @inject(Bot) private readonly bot: Bot<BotContext>,
    @inject('DependencyContainer') private readonly container: DependencyContainer,
    @inject(LoggerService) private readonly logger: LoggerService,
  ) {}

   public registerHandlers(botId: string): void {
    this.logger.info(`[${botId}] Registering all event handlers...`);
    
    this.registerCommands(botId);
    this.registerCallbackQueryHandlers(botId);
    this.registerMessageHandlers(botId);
  }

  private registerCommands(botId: string): void {
    if (!this.container.isRegistered(ICommand)) return;

    const handlers = this.container.resolveAll<ICommand>(ICommand);
    if (handlers.length > 0) {
      this.logger.info(`[${botId}] Registering ${handlers.length} command handler(s)...`);
      handlers.forEach((handler) => {
        this.bot.command(handler.command, (ctx) => handler.handle(ctx));
      });
    }
  }

  private registerCallbackQueryHandlers(botId: string): void {
    if (!this.container.isRegistered(ICallbackQueryHandler)) return;

    const handlers = this.container.resolveAll<ICallbackQueryHandler>(ICallbackQueryHandler);
    if (handlers.length > 0) {
      this.logger.info(`[${botId}] Registering ${handlers.length} callback query handler(s)...`);
      handlers.forEach((handler) => {
        this.bot.callbackQuery(handler.trigger, (ctx) => handler.handle(ctx));
      });
    }
  }

  private registerMessageHandlers(botId: string): void {
    if (!this.container.isRegistered(IMessageHandler)) {
      return;
    }

    const handlers = this.container.resolveAll<IMessageHandler>(IMessageHandler);
    if (handlers.length === 0) return;

    this.logger.info(`[${botId}] Registering ${handlers.length} message handler(s)...`);

    this.bot.on('message:text', async (ctx: Filter<BotContext, 'message:text'>) => {
      if (ctx.message.text.startsWith('/')) return;

      for (const handler of handlers) {
        if (handler.canHandle(ctx)) {
          await handler.handle(ctx);
          return;
        }
      }
    });
  }
}