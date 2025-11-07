import { useState, useEffect, useCallback } from 'react';
import { Manufacturer, ManufacturersResponse, ManufacturerDetailResponse } from '../types/Manufacturer';
import { ManufacturerService } from '../libs/ManufacturerService';

// Hook: Obtener todos los manufacturers
export function useManufacturers() {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManufacturers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await ManufacturerService.fetchManufacturers();
      setManufacturers(res.manufacturers);
    } catch (err: any) {
      setError(err.message || 'Error fetching manufacturers');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchManufacturers();
  }, [fetchManufacturers]);

  return { manufacturers, loading, error, fetchManufacturers };
}

// Hook: Buscar manufacturers por texto
export function useManufacturersSearch(text: string) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManufacturersBySearch = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: ManufacturersResponse = await ManufacturerService.fetchManufacturersBySearch(text);
      setManufacturers(res.manufacturers);
    } catch (err: any) {
      setError(err.message || 'Error searching manufacturers');
    } finally {
      setLoading(false);
    }
  }, [text]);

  useEffect(() => {
    if (text) fetchManufacturersBySearch();
  }, [fetchManufacturersBySearch, text]);

  return { manufacturers, loading, error, fetchManufacturersBySearch };
}

// Hook: Obtener detalle de manufacturer por ID
export function useManufacturerDetail(mfrid: string) {
  const [manufacturer, setManufacturer] = useState<Manufacturer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchManufacturer = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res: ManufacturerDetailResponse = await ManufacturerService.fetchManufacturerById(mfrid);
      setManufacturer(res.manufacturer);
    } catch (err: any) {
      setError(err.message || 'Error fetching manufacturer detail');
    } finally {
      setLoading(false);
    }
  }, [mfrid]);

  useEffect(() => {
    if (mfrid) fetchManufacturer();
  }, [fetchManufacturer, mfrid]);

  return { manufacturer, loading, error, fetchManufacturer };
}
