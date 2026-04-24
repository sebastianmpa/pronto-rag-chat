import axiosInstance from '../interceptor/axiosInstance';

export interface QuestionAnswerIngestRequest {
  question: string;
  answer: string;
  lang: string;
}

export const ingestQuestionAnswer = async (
  data: QuestionAnswerIngestRequest
): Promise<void> => {
  await axiosInstance.post('/questions/v0/ingest/question-answer', data);
};
