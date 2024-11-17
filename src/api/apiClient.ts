// src/api/apiClient.ts
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL ;

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  // Important for CORS with credentials
  withCredentials: true, 
});

export const promptsApi = {
  getPrompts: async () => {
    const { data } = await apiClient.get('/prompts');
    return data;
  },

  getPrompt: async (id: string, version: string) => {
    const { data } = await apiClient.get(`/prompts/${id}/${version}`);
    return data;
  },

  createPrompt: async (promptData: any) => {
    const { data } = await apiClient.post('/prompts', promptData);
    return data;
  },

  updatePrompt: async (id: string, version: string, promptData: any) => {
    const { data } = await apiClient.put(`/prompts/${id}/${version}`, promptData);
    return data;
  },

  deletePrompt: async (id: string, version: string) => {
    await apiClient.delete(`/prompts/${id}/${version}`);
  },

  executePrompt: async (promptData: any) => {
    const { data } = await apiClient.post('/prompts/execute', promptData);
    return data;
  }
};