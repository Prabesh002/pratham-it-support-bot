import { Bot } from 'grammy';
import { DependencyContainer } from 'tsyringe';
import { BotContext } from '@/core/models/context.model';
import { IFeatureModule } from '@/core/interfaces/IFeatureModule';
import { ICommand, ICallbackQueryHandler } from '@/core/interfaces/IHandler';
import { StartCommand } from './commands/StartCommand';
import { NavigationViewCallbackHandler } from './events/NavigationViewCallbackHandler';
import { IMenuViewService } from './interfaces/IMenuViewService';
import { MenuViewService } from './implementations/MenuViewService';
import { NavigationalViewFactory } from './factories/NavigationalViewFactory';
import { MenuView } from './views/MenuView';
import { Express } from 'express';

export default class CoreCommandsFeature implements IFeatureModule {
  public readonly name = 'core-commands';

  public register(container: DependencyContainer): void {
    container.register(ICommand, { useClass: StartCommand });
    container.register(ICallbackQueryHandler, { useClass: NavigationViewCallbackHandler });

    container.registerSingleton<IMenuViewService>(IMenuViewService, MenuViewService);
    container.register(NavigationalViewFactory, { useClass: NavigationalViewFactory });
    container.register(MenuView, { useClass: MenuView });
  }

  public initialize(_botId: string, _bot: Bot<BotContext>, _container: DependencyContainer, _app: Express): void {}
}