import axios from '../interceptor/axiosInstance';
import { StockTransferRequest, StockTransferResponse } from '../types/StockTransfer';

const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';

export const StockTransferService = {
  async requestTransfer(payload: StockTransferRequest): Promise<StockTransferResponse> {
    const { data } = await axios.post(`/stock-transfer/${API_VERSION_V0}/request`, payload);
    return data;
  },
};
