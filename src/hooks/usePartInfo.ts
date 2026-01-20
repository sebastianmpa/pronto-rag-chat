import { useState, useCallback } from 'react';
import { PartInfo, PartInfoResponse } from '../types/partInfo';
import { ManufacturerService } from '../libs/ManufacturerService';

export function usePartInfo(partNumber: string) {
  const [partInfoList, setPartInfoList] = useState<PartInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPartInfo = useCallback(async () => {
    if (!partNumber.trim()) {
      setError('Part number is required');
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const res: PartInfoResponse = await ManufacturerService.fetchPartInfo(partNumber);
      setPartInfoList(res.partInfo || []);
    } catch (err: any) {
      setError(err.message || 'Error fetching part info');
      setPartInfoList([]);
    } finally {
      setLoading(false);
    }
  }, [partNumber]);

  return { partInfoList, loading, error, fetchPartInfo };
}
