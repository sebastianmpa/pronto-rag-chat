import { useState, useCallback } from 'react';
import { StockTransferRequest, StockTransferResponse } from '../types/StockTransfer';
import { StockTransferService } from '../libs/StockTransferService';

export function useStockTransfer() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const requestTransfer = useCallback(async (payload: StockTransferRequest) => {
    setLoading(true);
    setError(null);
    setSuccess(false);
    
    try {
      const response: StockTransferResponse = await StockTransferService.requestTransfer(payload);
      
      if (response.success) {
        setSuccess(true);
        return response;
      } else {
        setError(response.message || 'Transfer request failed');
        return null;
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Error requesting stock transfer';
      setError(errorMessage);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  return { requestTransfer, loading, error, success };
}
