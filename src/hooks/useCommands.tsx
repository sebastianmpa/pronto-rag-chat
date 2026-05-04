import { useState, useEffect } from 'react';
import { Command } from '../types/Command';
import { getAllCommands } from '../libs/CommandService';

/**
 * Hook para obtener y gestionar comandos del chat
 */
export const useCommands = () => {
  const [commands, setCommands] = useState<Command[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchCommands = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getAllCommands();
        setCommands(result);
      } catch (err: any) {
        setError(err?.message || 'Error fetching commands');
      } finally {
        setLoading(false);
      }
    };

    fetchCommands();
  }, []);

  /**
   * Filtrar comandos por término de búsqueda
   */
  const filterCommands = (searchTerm: string): Command[] => {
    if (!searchTerm) return commands;
    
    const term = searchTerm.toLowerCase();
    return commands.filter((cmd) => 
      cmd.command.toLowerCase().includes(term)
    );
  };

  return { commands, loading, error, filterCommands };
};
