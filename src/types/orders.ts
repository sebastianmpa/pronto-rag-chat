export interface OrderPart {
  MfrID: string;
  PartNumber: string;
  Description: string;
  Quantity: string;
  Amount: string;
}

export interface SalesOrder {
  PONumber?: string;
  CustomerID?: string;
  EmailAddress?: string;
  FirstName?: string;
  LastName?: string;
  CustomerName?: string;
  BillToAddressLine1?: string;
  BillToCity?: string;
  BillToState?: string;
  BillToZipcode?: string;
  BillToCountry?: string;
  SalesRep?: string;
  Notes?: string;
  Parts: OrderPart[];
}

export interface CreateOrderRequest {
  System?: string;
  SalesOrders: SalesOrder[];
}

export interface OrderErrorItem {
  Reference: string;
  ErrorID: number;
}

export interface CreateOrderResponse {
  Response: string;
  SuccessCount: number;
  ErrorCount: number;
  ErrorList: OrderErrorItem[];
}
