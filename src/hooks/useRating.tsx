import { useState } from 'react';
import { Rating } from '../types/Rating';
import { createRating } from '../libs/RatingService';

export function useRating() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<any>(null);

  const submitRating = async (rating: Rating) => {
    setLoading(true);
    setError(null);
    try {
      const res = await createRating(rating);
      setResult(res);
    } catch (err: any) {
      setError(err?.message || 'Error submitting rating');
    } finally {
      setLoading(false);
    }
  };

  return { submitRating, loading, error, result };
}
