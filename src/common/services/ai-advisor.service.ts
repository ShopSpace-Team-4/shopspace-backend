import axios, { AxiosError, AxiosInstance } from 'axios';
import { aiAdvisor } from '../../config/config';
import { ServiceUnavailableException } from '../exceptions';

export interface AiAdvisorSource {
  document_id: string;
  title: string;
  category: string;
  business_type: string;
}

export interface AiAdvisorChatRequest {
  message: string;
  session_id?: string | null;
  user_id?: string | null;
}

export interface AiAdvisorChatResponse {
  session_id: string;
  answer: string;
  sources: AiAdvisorSource[];
  disclaimer: string;
}

class AiAdvisorService {
  private readonly client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: aiAdvisor.baseUrl,
      timeout: 30_000,
      headers: {
        'x-api-key': aiAdvisor.apiKey,
      },
    });
  }

  async chat(payload: AiAdvisorChatRequest): Promise<AiAdvisorChatResponse> {
    try {
      const { data } = await this.client.post<AiAdvisorChatResponse>('/chat', payload);
      return data;
    } catch (error) {
      throw this.toExternalServiceError(error, 'AI Advisor chat request failed');
    }
  }

  async getSessionMessages(sessionId: string): Promise<unknown> {
    try {
      const { data } = await this.client.get(`/sessions/${encodeURIComponent(sessionId)}/messages`);
      return data;
    } catch (error) {
      throw this.toExternalServiceError(error, 'AI Advisor session history request failed');
    }
  }

  private toExternalServiceError(error: unknown, message: string) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError;
      console.error(message, {
        status: axiosError.response?.status,
        data: axiosError.response?.data,
        code: axiosError.code,
        message: axiosError.message,
      });
    } else {
      console.error(message, error);
    }

    return new ServiceUnavailableException('AI Advisor is currently unavailable. Please try again later.', error);
  }
}

export const aiAdvisorService = new AiAdvisorService();
