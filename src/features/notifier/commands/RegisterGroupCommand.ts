import { injectable, inject } from 'tsyringe';
import { CommandContext } from 'grammy';
import { BotContext } from '@/core/models/context.model';
import { ICommand } from '@/core/interfaces/IHandler';
import { ICrmApiService } from '@/shared/api/interfaces/ICrmApiService';
import { CrmClientResponse, UpdateClientChannelRequest } from '@/shared/api/models/crm.dto';
import { toError } from '@/utils/ErrorUtils';
import { LoggerService } from '@/utils/logger';

@injectable()
export class RegisterGroupCommand implements ICommand {
  public readonly command = 'register_group';

  constructor(
    @inject(ICrmApiService) private readonly crmService: ICrmApiService,
    @inject(LoggerService) private readonly logger: LoggerService,
  ) {}

  public async handle(ctx: CommandContext<BotContext>): Promise<void> {
    const chatType = ctx.chat.type;
    if (chatType !== 'group' && chatType !== 'supergroup') {
      await ctx.reply('This command can only be used in a group chat.');
      return;
    }

    const chatId = ctx.chat.id;
    const chatTitle = ctx.chat.title;

    await ctx.reply(`Attempting to register group "${chatTitle}" with the CRM...`);

    try {
      const payload: UpdateClientChannelRequest = {
        telegramGroupId: chatId,
        telegramGroupName: chatTitle,
      };

      const response = await this.crmService.post<CrmClientResponse>(
        '/api/TelegramUserIssueAdd/UpdateClientTelegramChannel',
        payload,
      );

      const successMessage = `✅ Success! The group for client *${response.clientName}* has been registered for notifications.`;
      await ctx.reply(successMessage, { parse_mode: 'Markdown' });

    } catch (e) {
      const error = toError(e);
      this.logger.error(`Failed to register group ${chatId} (${chatTitle})`, error);
      
      const failureMessage = `⚠️ Registration Failed: ${error.message}`;
      await ctx.reply(failureMessage);
    }
  }
}