import { useState, useCallback } from 'react';

/**
 * Hook genérico para operaciones CRUD
 * @template T - Tipo de dato que se va a manejar
 */
export interface UseCrudOptions<T> {
  fetchAll?: () => Promise<T[]>;
  fetchById?: (id: string) => Promise<T>;
  create?: (data: Partial<T>) => Promise<T>;
  update?: (id: string, data: Partial<T>) => Promise<T>;
  remove?: (id: string) => Promise<void>;
}

export const useCrud = <T extends { id?: string }>(
  options: UseCrudOptions<T>
) => {
  const [data, setData] = useState<T[]>([]);
  const [currentItem, setCurrentItem] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Obtener todos los registros
   */
  const getAll = useCallback(async () => {
    if (!options.fetchAll) return;
    
    setLoading(true);
    setError(null);
    try {
      const result = await options.fetchAll();
      setData(result);
      return result;
    } catch (err: any) {
      const errorMessage = err.message || 'Error al obtener los datos';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  }, [options.fetchAll]);

  /**
   * Obtener un registro por ID
   */
  const getById = useCallback(
    async (id: string) => {
      if (!options.fetchById) return null;
      
      setLoading(true);
      setError(null);
      try {
        const result = await options.fetchById(id);
        setCurrentItem(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al obtener el registro';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options.fetchById]
  );

  /**
   * Crear un nuevo registro
   */
  const create = useCallback(
    async (newData: Partial<T>) => {
      if (!options.create) return null;
      
      setLoading(true);
      setError(null);
      try {
        const result = await options.create(newData);
        setData((prev) => [...prev, result]);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al crear el registro';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options.create]
  );

  /**
   * Actualizar un registro existente
   */
  const update = useCallback(
    async (id: string, updatedData: Partial<T>) => {
      if (!options.update) return null;
      
      setLoading(true);
      setError(null);
      try {
        const result = await options.update(id, updatedData);
        setData((prev) =>
          prev.map((item) => (item.id === id ? result : item))
        );
        setCurrentItem(result);
        return result;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al actualizar el registro';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options.update]
  );

  /**
   * Eliminar un registro
   */
  const remove = useCallback(
    async (id: string) => {
      if (!options.remove) return false;
      
      setLoading(true);
      setError(null);
      try {
        await options.remove(id);
        setData((prev) => prev.filter((item) => item.id !== id));
        return true;
      } catch (err: any) {
        const errorMessage = err.message || 'Error al eliminar el registro';
        setError(errorMessage);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [options.remove]
  );

  /**
   * Limpiar errores
   */
  const clearError = useCallback(() => {
    setError(null);
  }, []);

  /**
   * Resetear el estado
   */
  const reset = useCallback(() => {
    setData([]);
    setCurrentItem(null);
    setError(null);
    setLoading(false);
  }, []);

  return {
    data,
    currentItem,
    loading,
    error,
    getAll,
    getById,
    create,
    update,
    remove,
    clearError,
    reset,
  };
};