import axios, { AxiosInstance, AxiosResponse, InternalAxiosRequestConfig, AxiosError } from 'axios';
import { singleton, inject, injectable, DependencyContainer } from 'tsyringe';
import { Config } from '@/config';
import { LoggerService } from '@/utils/logger';
import { IAuthService } from '../interfaces/IAuthService';
import { ApiResponse } from '../models/api.dto';
import { LOGIN_USER_ENDPOINT } from '../constants/chat.auth.endpoints';
import { StreamChatRequest } from '../models/chat.dto';
import { toError } from '@/utils/ErrorUtils';
import { IAiApiService } from '../interfaces/IAiApiService';

@injectable()
@singleton()
export class AiApiService implements IAiApiService  {
  private readonly client: AxiosInstance;

  constructor(
    @inject(Config) private readonly config: Config,
    @inject(LoggerService) private readonly logger: LoggerService,
    @inject('MainContainer') private readonly container: DependencyContainer,
  ) {
    this.client = axios.create({
      baseURL: this.config.aiApiBaseUrl,
      headers: { 'Content-Type': 'application/json' },
    });

    this.client.interceptors.request.use(this.requestInterceptor.bind(this));
    this.client.interceptors.response.use(
      this.responseSuccessInterceptor,
      this.responseErrorInterceptor.bind(this),
    );
  }

  private requestInterceptor(config: InternalAxiosRequestConfig): InternalAxiosRequestConfig {
    if (config.url === LOGIN_USER_ENDPOINT) {
      return config;
    }

    const authService = this.container.resolve<IAuthService>(IAuthService);
    const token = authService.getAccessToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  }

  private responseSuccessInterceptor<T>(response: AxiosResponse<ApiResponse<T>>): T {
    const apiResponse = response.data;
    if (apiResponse.success && apiResponse.data !== undefined) {
      return apiResponse.data;
    }
    throw new Error(apiResponse.message || 'API returned success:false without a message.');
  }

  private responseErrorInterceptor(error: unknown) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<ApiResponse<unknown>>;
      const errorMessage = axiosError.response?.data?.message || axiosError.message;
      this.logger.error(`Axios error on ${axiosError.config?.method?.toUpperCase()} ${axiosError.config?.url}: ${errorMessage}`);
    } else {
      const standardError = toError(error);
      this.logger.error(`A non-axios error occurred in API call: ${standardError.message}`, standardError);
    }
    return Promise.reject(toError(error));
  }

  public get<T>(url: string): Promise<T> {
    return this.client.get<ApiResponse<T>>(url) as unknown as Promise<T>;
  }

  public post<T>(url: string, data: unknown): Promise<T> {
    return this.client.post<ApiResponse<T>>(url, data) as unknown as Promise<T>;
  }

  public async streamPost(url: string, data: StreamChatRequest): Promise<ReadableStream<Uint8Array>> {
    const fullUrl = `${this.config.aiApiBaseUrl}${url}`;
    
    const authService = this.container.resolve<IAuthService>(IAuthService);
    const token = authService.getAccessToken();

    if (!token) {
      throw new Error('Authentication token not available for streaming request.');
    }

    const response = await fetch(fullUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API stream error! Status: ${response.status}. Body: ${errorBody}`);
    }
    if (!response.body) {
      throw new Error('No response body from stream.');
    }
    return response.body;
  }
}