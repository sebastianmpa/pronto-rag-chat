export type Rating = {
  conversation_id: string;
  rating: 'good' | 'bad' | 'neutral';
  comment?: string;
};