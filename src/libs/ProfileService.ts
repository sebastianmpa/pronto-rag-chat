import axiosInstance from '../interceptor/axiosInstance';
import { ChangePasswordDto, ChangePasswordResponse } from '../types/Profile';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';


export const changePassword = async (
  data: ChangePasswordDto
): Promise<ChangePasswordResponse> => {
  const response = await axiosInstance.patch<ChangePasswordResponse>(
    `/profile/${API_VERSION_V0}/me/password`,
    data
  );
  return response.data;
};
