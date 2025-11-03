import axiosInstance from '../interceptor/axiosInstance';
import { Rating } from '../types/Rating';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export async function createRating(rating: Rating) {
  const response = await axiosInstance.post(`/ratings/${API_VERSION_V0}`, rating);
  return response.data;
}
