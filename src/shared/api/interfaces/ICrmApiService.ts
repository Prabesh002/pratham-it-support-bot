export const ICrmApiService = Symbol('ICrmApiService');

export interface ICrmApiService {
  post<T>(url: string, data: unknown): Promise<T>;
}