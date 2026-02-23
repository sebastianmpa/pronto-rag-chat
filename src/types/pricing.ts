export interface PricingRequest {
  mfrId: string;
  partNumber: string;
  customerId?: string;
}

export interface PricingResponse {
  mfr_id: string;
  part_number: string;
  customer_type: string;
  customer_price_level: string;
  list_price: number;
  net_price: number;
}

export interface PricingQueryParams {
  mfrId: string;
  partNumber: string;
  customerId?: string;
}