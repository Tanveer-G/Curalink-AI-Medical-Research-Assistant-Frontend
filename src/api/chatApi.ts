import { useMutation } from '@tanstack/react-query';
import axios, { AxiosError } from 'axios';
import type { ApiResponse, QueryRequest } from '@/types';
import { API_URL } from '@/lib/constants';

const apiClient = axios.create({
  baseURL: API_URL,
  timeout: 60_000, // LLM calls can be slow
  headers: { 'Content-Type': 'application/json' },
});

export async function postQuery(payload: QueryRequest): Promise<ApiResponse> {
  const { data } = await apiClient.post<ApiResponse>('/api/query', payload);
  if (!data.success) {
    throw new Error((data as { error?: string }).error ?? 'Query failed');
  }
  return data;
}

export function useChatMutation() {
  return useMutation<ApiResponse, AxiosError<{ error: string }>, QueryRequest>({
    mutationFn: postQuery,
    retry: false,
  });
}
