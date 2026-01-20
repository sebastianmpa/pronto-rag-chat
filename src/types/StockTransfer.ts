export interface StockTransferRequest {
  mfr: string;
  sku: string;
  quantity: number;
  order: string;
}

export interface StockTransferResponse {
  success: boolean;
  message?: string;
  data?: any;
}
