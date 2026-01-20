import axios from '../interceptor/axiosInstance';
import { ManufacturersResponse, ManufacturerDetailResponse } from '../types/Manufacturer';
import { PartInfoResponse } from '../types/partInfo';


const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0 || 'v0';
const API_VERSION_V1 = import.meta.env.VITE_API_VERSION_V1 || 'v1';

export const ManufacturerService = {
  async fetchManufacturers(): Promise<ManufacturersResponse> {
    const { data } = await axios.get(`/ideal-query/${API_VERSION_V0}/manufacturers`);
    return data;
  },
  async fetchManufacturersBySearch(text: string): Promise<ManufacturersResponse> {
    const { data } = await axios.get(`/ideal-query/${API_VERSION_V0}/manufacturers/search`, { params: { text } });
    return data;
  },
  async fetchManufacturerById(mfrid: string): Promise<ManufacturerDetailResponse> {
    const { data } = await axios.get(`/ideal-query/${API_VERSION_V0}/manufacturers/${mfrid}`);
    return data;
  },
  async fetchPartInfo(partNumber: string): Promise<PartInfoResponse> {
    const { data } = await axios.get(`/ideal-query/${API_VERSION_V0}/related-part-info`, {
      params: { 
        partNumber,
        storeUrl: 'https://www.smallenginesprodealer.com'
      }
    });
    return data;
  },
};
