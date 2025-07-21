import { Bot, session } from "grammy";
import { DependencyContainer } from "tsyringe";
import { IBotConfig } from "./interfaces/IBotConfig";
import { IFeatureModule } from "./interfaces/IFeatureModule";
import { BotContext } from "./models/context.model";
import { createInitialSessionData } from "./models/session.model";
import { LoggerService } from "@/utils/logger";
import { toError } from "@/utils/ErrorUtils";
import { Express } from "express";
import { BotHandlerService } from "./implementations/BotHandlerService";

export class BotInstance {
  public readonly id: string;
  public readonly bot: Bot<BotContext>;
  public readonly container: DependencyContainer;

  private readonly logger: LoggerService;

  constructor(
    private readonly config: IBotConfig,
    parentContainer: DependencyContainer,
    private readonly featureRegistry: Map<string, IFeatureModule>,
    private readonly app: Express
  ) {
    this.id = config.id;
    this.container = parentContainer.createChildContainer();
    this.logger = this.container.resolve(LoggerService);

    this.logger.info(`[${this.id}] Creating bot instance...`);

    parentContainer.register<DependencyContainer>(this.id, {
      useValue: this.container,
    });

    this.bot = new Bot<BotContext>(this.config.token);
    this.container.register<Bot<BotContext>>(Bot, { useValue: this.bot });
    this.container.register<DependencyContainer>('DependencyContainer', { useValue: this.container });

    this.container.registerSingleton(BotHandlerService);

    this.initializeMiddleware();
    this.registerAndInitializeFeatures();
  }

  private initializeMiddleware(): void {
    this.bot.use(session({ initial: createInitialSessionData }));

    this.bot.catch((err) => {
      const ctx = err.ctx;
      const error = toError(err.error);
      this.logger.error(
        `[${this.id}] Error for update ${ctx.update.update_id}: ${error.message}`,
        error
      );
      ctx
        .reply("I couldn't process your request. Please try again later.")
        .catch((e) => {
          this.logger.error(
            `[${this.id}] Failed to send error message to user.`,
            toError(e)
          );
        });
    });
  }

  private registerAndInitializeFeatures(): void {
    this.logger.info(
      `[${this.id}] Registering features: ${this.config.enabledFeatures.join(", ")}`
    );

    this.config.enabledFeatures.forEach((featureName) => {
      const featureModule = this.featureRegistry.get(featureName);
      if (featureModule) {
        this.logger.info(
          `[${this.id}] Registering dependencies for feature: ${featureName}`
        );
        featureModule.register(this.container);
      } else {
        this.logger.warn(
          `[${this.id}] Feature "${featureName}" not found in registry.`
        );
      }
    });

    const handlerService = this.container.resolve(BotHandlerService);
    handlerService.registerHandlers(this.id);

    this.config.enabledFeatures.forEach((featureName) => {
      const featureModule = this.featureRegistry.get(featureName);
      if (featureModule) {
        this.logger.info(`[${this.id}] Initializing feature: ${featureName}`);
        featureModule.initialize(this.id, this.bot, this.container, this.app);
      }
    });
  }

  public async start(): Promise<void> {
    this.logger.info(`[${this.id}] Starting bot...`);
    await this.bot.start({
      onStart: (botInfo) => {
        this.logger.info(
          `Bot @${botInfo.username} (${this.id}) started successfully.`
        );
      },
    });
  }

  public async stop(): Promise<void> {
    this.logger.warn(`[${this.id}] Shutting down bot gracefully...`);
    if (this.bot.isInited()) {
      await this.bot.stop();
    }
    this.logger.info(`[${this.id}] Bot has been stopped.`);
  }
}
