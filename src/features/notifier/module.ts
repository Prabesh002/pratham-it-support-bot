import { Bot } from 'grammy';
import { DependencyContainer } from 'tsyringe';
import { Express, Request, Response } from 'express';
import { BotContext } from '@/core/models/context.model';
import { IFeatureModule } from '@/core/interfaces/IFeatureModule';
import { INotificationService } from './interfaces/INotificationService';
import { NotificationService } from './implementations/NotificationService';
import { NotificationController } from './controllers/NotificationController';
import { RegisterGroupCommand } from './commands/RegisterGroupCommand';
import { ICommand } from '@/core/interfaces/IHandler';


export default class NotifierFeature implements IFeatureModule {
  public readonly name = 'notifier';

  public register(container: DependencyContainer): void {
    container.registerSingleton<INotificationService>(INotificationService, NotificationService);
    container.register(NotificationController, { useClass: NotificationController });
    container.register(ICommand, { useClass: RegisterGroupCommand });
  }

  public initialize(botId: string, _bot: Bot<BotContext>, container: DependencyContainer, app: Express): void {
    const controller = container.resolve(NotificationController);
    
    const route = `/api/v1/notify/${botId}`;
    
    app.post(route, (req: Request, res: Response) => {
        req.container = container; 
        controller.handle(req, res);
    });
  }
}