import React, { useState } from 'react';

export type RatingType = 'good' | 'neutral' | 'bad';

interface RatingBubbleProps {
  onSubmit: (rating: RatingType, comment?: string) => void;
  loading?: boolean;
  error?: string | null;
}

const ratingOptions: { value: RatingType; emoji: string; label: string }[] = [
  { value: 'good', emoji: '😊', label: 'Good' },
  { value: 'neutral', emoji: '😐', label: 'Neutral' },
  { value: 'bad', emoji: '😞', label: 'Bad' },
];

export const RatingBubble: React.FC<RatingBubbleProps> = ({ onSubmit, loading, error }) => {
  const [selectedRating, setSelectedRating] = useState<RatingType | null>(null);
  const [comment, setComment] = useState('');

  const handleSubmit = () => {
    if (selectedRating) {
      onSubmit(selectedRating, comment.trim() || undefined);
    }
  };

  return (
    <div className="flex justify-center my-4">
      <div className="rounded-2xl border border-blue-300 bg-white dark:bg-boxdark text-black dark:text-white py-5 px-7 shadow-xl w-full max-w-xs relative">
        <div className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white rounded-full px-4 py-1 text-xs font-semibold shadow-md">Feedback</div>
        <p className="mb-4 text-base font-semibold text-blue-700 dark:text-blue-300 text-center">Rate this conversation</p>
        <div className="flex justify-between gap-2 mb-4">
          {ratingOptions.map(opt => (
            <button
              key={opt.value}
              className={`flex flex-col items-center px-4 py-3 rounded-xl border-2 focus:outline-none transition-all duration-150 shadow-sm text-lg font-bold
                ${selectedRating === opt.value
                  ? 'bg-blue-600 text-white border-blue-700 scale-105'
                  : 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800 dark:text-white dark:border-gray-700 hover:bg-blue-100 dark:hover:bg-blue-900 hover:border-blue-400'}
              `}
              onClick={() => setSelectedRating(opt.value)}
              type="button"
              tabIndex={0}
            >
              <span className="text-2xl mb-1">{opt.emoji}</span>
              <span className="text-xs font-medium">{opt.label}</span>
            </button>
          ))}
        </div>
        <textarea
          className="w-full rounded-lg border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-3 py-2 text-sm mb-3 resize-none focus:ring-2 focus:ring-blue-400 focus:outline-none transition-all"
          placeholder="Add a comment (optional)"
          value={comment}
          onChange={e => setComment(e.target.value)}
          rows={2}
        />
        <button
          className={`w-full py-2 rounded-lg bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold shadow-md transition-all duration-150 ${!selectedRating ? 'opacity-50 cursor-not-allowed' : ''}`}
          onClick={handleSubmit}
          disabled={!selectedRating || loading}
        >
          {loading ? 'Submitting...' : 'Submit'}
        </button>
        {error && <p className="text-red-500 text-xs mt-2 text-center">{error}</p>}
      </div>
    </div>
  );
};
