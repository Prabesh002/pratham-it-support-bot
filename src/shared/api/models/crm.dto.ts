export interface CrmApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  statusCode: number;
}

export interface UpdateClientChannelRequest {
  telegramGroupId: number;
  telegramGroupName: string;
}

export interface CrmClientResponse {
  clientName: string;
}