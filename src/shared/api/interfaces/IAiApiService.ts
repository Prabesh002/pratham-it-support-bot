import { StreamChatRequest } from '../models/chat.dto';

export const IAiApiService = Symbol('IAiApiService');

export interface IAiApiService {
  get<T>(url: string): Promise<T>;
  post<T>(url: string, data: unknown): Promise<T>;
  streamPost(url: string, data: StreamChatRequest): Promise<ReadableStream<Uint8Array>>;
}