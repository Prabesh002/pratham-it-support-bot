import { injectable, inject, singleton } from 'tsyringe';
import { Config } from '@/config';
import { LoggerService } from '@/utils/logger';
import { LoginRequest, LoginResponse } from '../models/auth.dto';
import { LOGIN_USER_ENDPOINT } from '../constants/chat.auth.endpoints';
import { IAuthService } from '../interfaces/IAuthService';
import { IAiApiService } from '../interfaces/IAiApiService';
import { toError } from '@/utils/ErrorUtils';

@injectable()
@singleton()
export class AuthService implements IAuthService {
  private accessToken: string | null = null;

  constructor(
    @inject(Config) private readonly config: Config,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject(IAiApiService) private readonly apiService: IAiApiService,
  ) {}

  public getAccessToken(): string | null {
    return this.accessToken;
  }

  public async login(): Promise<void> {
    this.logger.info('Attempting to log in to the AI API...');
    try {
      const payload: LoginRequest = {
        name: this.config.aiApiUsername,
        password: this.config.aiApiPassword,
      };

      const response = await this.apiService.post<LoginResponse>(LOGIN_USER_ENDPOINT, payload);
      this.accessToken = response.access_token;
      this.logger.info('Successfully logged in to the AI API.');
    } catch (e) {
      const error = toError(e);
      this.logger.error(`Failed to log in to the AI API: ${error.message}`);
      throw new Error('Could not authenticate with the backend service.');
    }
  }
}