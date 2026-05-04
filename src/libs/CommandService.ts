import axiosInstance from '../interceptor/axiosInstance';
import { CommandsResponse } from '../types/Command';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

/**
 * Get all available chat commands
 * GET /commands/v0
 */
export const getAllCommands = async (): Promise<CommandsResponse> => {
  const response = await axiosInstance.get(`/commands/${API_VERSION_V0}`);
  return response.data;
};
