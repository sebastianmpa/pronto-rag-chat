import { useState, useCallback } from 'react';
import { PartInfo, PartInfoResponse } from '../types/partInfo';
import { ManufacturerService } from '../libs/ManufacturerService';

export function usePartInfo(partNumber: string, mfrId: string, location: '1' | '4') {
  const [partInfo, setPartInfo] = useState<PartInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartInfo = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: PartInfoResponse = await ManufacturerService.fetchPartInfo(partNumber, mfrId, location);
      setPartInfo(res.partInfo);
    } catch (err: any) {
      setError(err.message || 'Error fetching part info');
    } finally {
      setLoading(false);
    }
  }, [partNumber, mfrId, location]);

  return { partInfo, loading, error, fetchPartInfo };
}
