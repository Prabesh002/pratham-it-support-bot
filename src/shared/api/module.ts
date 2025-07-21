import { DependencyContainer } from 'tsyringe';
import { AiApiService } from './implementations/AiApiService';
import { AuthService } from './implementations/AuthService';
import { IAiApiService } from './interfaces/IAiApiService';
import { IAuthService } from './interfaces/IAuthService';
import { CrmApiService } from './implementations/CrmApiService';
import { ICrmApiService } from './interfaces/ICrmApiService';

export function registerApiModule(container: DependencyContainer): void {
  container.registerSingleton<IAuthService>(IAuthService, AuthService);
  container.registerSingleton<IAiApiService>(IAiApiService, AiApiService);
  container.registerSingleton<ICrmApiService>(ICrmApiService, CrmApiService);
}