import { injectable, inject } from 'tsyringe';
import { BotContext } from '@/core/models/context.model';
import { LoggerService } from '@/utils/logger';
import { IChatService } from '../interfaces/IChatService';
import { IAiApiService } from '@/shared/api/interfaces/IAiApiService';
import { CreateChatRequest, CreateChatSessionResponse, StreamChatRequest } from '@/shared/api/models/chat.dto';
import { CREATE_CHAT_ENDPOINT, STREAM_CHAT_ENDPOINT } from '@/shared/api/constants/chat.auth.endpoints';
import { CallbackQueryContext, CommandContext, Filter } from 'grammy';
import { toError } from '@/utils/ErrorUtils';

@injectable()
export class ChatService implements IChatService {
  constructor(
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(IAiApiService) private readonly apiService: IAiApiService,
  ) {}

  public async initiateChat(ctx: CallbackQueryContext<BotContext>): Promise<void> {
    if (!ctx.from) return;
    await ctx.answerCallbackQuery();

    try {
      this.logger.info(`Attempting to start a new chat session for user ${ctx.from.id}`);
      const createPayload: CreateChatRequest = { query: 'Start a new conversation' };
      const session = await this.apiService.post<CreateChatSessionResponse>(CREATE_CHAT_ENDPOINT, createPayload);
      
      ctx.session.activeChatId = session.id;

      this.logger.info(`Started new chat session ${session.id} for user ${ctx.from.id}`);
      await ctx.reply("Hello! What can I help you with? You can end our chat at any time by sending /end.");
    } catch (e) {
      const error = toError(e);
      this.logger.error(`Failed to initiate chat for user ${ctx.from.id}: ${error.message}`, error);
      await ctx.reply('Sorry, I couldn\'t start a new chat session right now. Please try again later.');
    }
  }

  public async handleConversation(ctx: Filter<BotContext, 'message:text'>): Promise<void> {
    if (!ctx.from || !ctx.message?.text) return;

    await ctx.replyWithChatAction('typing');

    try {
      const payload: StreamChatRequest = { query: ctx.message.text, chat_id: ctx.session.activeChatId! };
      const stream = await this.apiService.streamPost(STREAM_CHAT_ENDPOINT, payload);
      const fullResponse = await this.consumeStream(stream);
      await ctx.reply(fullResponse || "I don't have a response for that right now.");
    } catch (e) {
      const error = toError(e);
      this.logger.error(`Error during conversation for user ${ctx.from.id}: ${error.message}`, error);
      await ctx.reply('An error occurred while getting a response. Please try again.');
    }
  }
  
  public async endChat(ctx: CommandContext<BotContext>): Promise<void> {
      if (ctx.session.activeChatId) {
          ctx.session.activeChatId = undefined;
          this.logger.info(`Ended session for user ${ctx.from?.id}`);
          await ctx.reply('Chat session ended. Use /start to see the menu again.');
      } else {
          await ctx.reply('No active chat session to end.');
      }
  }

  private async consumeStream(stream: ReadableStream<Uint8Array>): Promise<string> {
    const reader = stream.getReader();
    const decoder = new TextDecoder();
    let fullText = '';
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      fullText += decoder.decode(value);
    }
    return fullText;
  }
}