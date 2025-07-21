import axios, { AxiosInstance, AxiosError } from 'axios';
import { singleton, inject, injectable } from 'tsyringe';
import { Config } from '@/config';
import { LoggerService } from '@/utils/logger';
import { toError } from '@/utils/ErrorUtils';
import { ICrmApiService } from '../interfaces/ICrmApiService';
import { CrmApiResponse } from '../models/crm.dto';

@injectable()
@singleton()
export class CrmApiService implements ICrmApiService {
    private readonly client: AxiosInstance;

    constructor(
        @inject(Config) private readonly config: Config,
        @inject(LoggerService) private readonly logger: LoggerService,
    ) {
        this.client = axios.create({
            baseURL: this.config.crmApiBaseUrl,
            headers: { 'Content-Type': 'application/json' },
        });

        this.client.interceptors.response.use(
            (response) => {
                const apiResponse = response.data as CrmApiResponse<unknown>;
                if (!apiResponse.success) {
                    throw new Error(apiResponse.message || 'CRM API returned success:false without a message.');
                }
                return response;
            },
            (error: AxiosError<CrmApiResponse<unknown>>) => {
                const errorMessage = error.response?.data?.message || error.message;
                this.logger.error(`CRM API Error: ${errorMessage}`);
                return Promise.reject(new Error(errorMessage));
            },
        );
    }
    public async post<T>(url: string, data: unknown): Promise<T> {
        const response = await this.client.post<CrmApiResponse<T>>(url, data);
        return (response.data as CrmApiResponse<T>).data as T;
    }
}
