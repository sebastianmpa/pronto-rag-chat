import { useState, useEffect } from 'react';
import { 
  createConversation, 
  getConversationsPaginated, 
  getConversationById, 
  getMyConversationsPaginated, 
  getMyConversationById,
  deleteConversationById,
  deleteMyConversationById
} from '../libs/ConversationService';
import { 
  CreateConversationDto, 
  ConversationResponse, 
  ConversationPaginatedResponse, 
  ConversationDetailResponse 
} from '../types/Conversation';

export const useConversation = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [conversation, setConversation] = useState<ConversationResponse | null>(null);

  const handleCreateConversation = async (data: CreateConversationDto) => {
    setLoading(true);
    setError(null);
    try {
      const result = await createConversation(data);
      setConversation(result);
      return result;
    } catch (err: any) {
      setError(err.message || 'Error creating conversation');
      setConversation(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { conversation, loading, error, handleCreateConversation };
};

export const useConversationsPaginated = ({ page = 1, limit = 10 } = {}) => {
  const [data, setData] = useState<ConversationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getConversationsPaginated(page, limit)
      .then(setData)
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [page, limit]);

  return { data, loading, error };
};

export const useConversationById = (id: string) => {
  const [data, setData] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getConversationById(id)
      .then(setData)
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
};

export const useMyConversationsPaginated = ({ page = 1, limit = 10 } = {}) => {
  const [data, setData] = useState<ConversationPaginatedResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    getMyConversationsPaginated(page, limit)
      .then(setData)
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [page, limit]);

  return { data, loading, error };
};

export const useMyConversationById = (id: string) => {
  const [data, setData] = useState<ConversationDetailResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getMyConversationById(id)
      .then(setData)
      .catch((err) => setError(err.message || 'Error'))
      .finally(() => setLoading(false));
  }, [id]);

  return { data, loading, error };
};

export const useDeleteConversationById = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteConversationById(id);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Error deleting conversation');
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, handleDelete };
};

export const useDeleteMyConversationById = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const handleDelete = async (id: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await deleteMyConversationById(id);
      setResult(res);
      return res;
    } catch (err: any) {
      setError(err.message || 'Error deleting my conversation');
      setResult(null);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { result, loading, error, handleDelete };
};
