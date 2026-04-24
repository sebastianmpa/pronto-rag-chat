import { FormEvent, useEffect, useRef, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ingestQuestionAnswer } from '../../../libs/QuestionsAnswersService';

const MAX_LENGTH = 2000;
const FALLBACK_LANG = 'en-US';
const OPEN_TAG = "<b class='pronto-sku'>";
const CLOSE_TAG = '</b>';

interface QuestionsAnswersFormProps {
  initialQuestion?: string;
  initialAnswer?: string;
  showCard?: boolean;
  onCancel?: () => void;
  onSaved?: () => void;
}

const QuestionsAnswersForm = ({
  initialQuestion = '',
  initialAnswer = '',
  showCard = true,
  onCancel,
  onSaved,
}: QuestionsAnswersFormProps) => {
  const { t } = useTranslation();
  const [question, setQuestion] = useState(initialQuestion);
  const [answer, setAnswer] = useState(initialAnswer);
  const [questionError, setQuestionError] = useState<string | null>(null);
  const [answerError, setAnswerError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hasSelection, setHasSelection] = useState(false);
  const answerRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setQuestion(initialQuestion);
    setAnswer(initialAnswer);
    setQuestionError(null);
    setAnswerError(null);
    setSaveMessage(null);
    setHasSelection(false);
  }, [initialQuestion, initialAnswer]);

  const handleAnswerSelect = () => {
    const el = answerRef.current;
    if (!el) return;
    setHasSelection(el.selectionStart !== el.selectionEnd);
  };

  const wrapWithSkuTag = () => {
    const el = answerRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    if (start === end) return;

    const selected = answer.slice(start, end);
    const wrapped = `${OPEN_TAG}${selected}${CLOSE_TAG}`;
    const next = answer.slice(0, start) + wrapped + answer.slice(end);

    setAnswer(next);
    setHasSelection(false);

    // Restore cursor after wrapped content
    requestAnimationFrame(() => {
      el.focus();
      const cursor = start + wrapped.length;
      el.setSelectionRange(cursor, cursor);
    });
  };

  const isDisabled = useMemo(
    () =>
      !question.trim() ||
      !answer.trim() ||
      question.length > MAX_LENGTH ||
      answer.length > MAX_LENGTH,
    [question, answer]
  );

  const validate = () => {
    let valid = true;

    if (!question.trim()) {
      setQuestionError(t('questionsAnswers.form.errors.required'));
      valid = false;
    } else if (question.length > MAX_LENGTH) {
      setQuestionError(
        t('questionsAnswers.form.errors.maxLength', { max: MAX_LENGTH })
      );
      valid = false;
    } else {
      setQuestionError(null);
    }

    if (!answer.trim()) {
      setAnswerError(t('questionsAnswers.form.errors.required'));
      valid = false;
    } else if (answer.length > MAX_LENGTH) {
      setAnswerError(
        t('questionsAnswers.form.errors.maxLength', { max: MAX_LENGTH })
      );
      valid = false;
    } else {
      setAnswerError(null);
    }

    return valid;
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSaveMessage(null);

    if (!validate()) {
      return;
    }

    setSaving(true);
    try {
      const browserLang = navigator.language?.trim() || FALLBACK_LANG;

      await ingestQuestionAnswer({
        question: question.trim(),
        answer: answer.trim(),
        lang: browserLang,
      });
      setQuestion('');
      setAnswer('');
      setQuestionError(null);
      setAnswerError(null);
      setSaveMessage(t('questionsAnswers.form.success'));
      if (onSaved) {
        onSaved();
      }
    } catch {
      setSaveMessage(t('questionsAnswers.form.error'));
    } finally {
      setSaving(false);
    }
  };

  const content = (
    <>
      <div className="border-b border-stroke px-4 py-6 dark:border-strokedark md:px-6 xl:px-7.5">
        <h2 className="text-lg font-semibold text-black dark:text-white">
          {t('questionsAnswers.form.title')}
        </h2>
      </div>

      <form
        onSubmit={handleSubmit}
        className="space-y-5 px-4 py-6 md:px-6 xl:px-7.5"
      >
        <div>
          <label className="mb-2.5 block font-medium text-black dark:text-white">
            {t('questionsAnswers.form.questionLabel')} *
          </label>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            maxLength={MAX_LENGTH}
            rows={5}
            className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            placeholder={t('questionsAnswers.form.questionPlaceholder')}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-danger">{questionError}</span>
            <span className="text-xs text-bodydark2">
              {question.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        <div>
          <div className="mb-2.5 flex items-center justify-between">
            <label className="block font-medium text-black dark:text-white">
              {t('questionsAnswers.form.answerLabel')} *
            </label>
            <button
              type="button"
              onClick={wrapWithSkuTag}
              disabled={!hasSelection}
              title="Envolver selección con etiqueta SKU"
              className="inline-flex items-center gap-1.5 rounded border border-stroke bg-gray-2 px-3 py-1 text-xs font-medium text-black transition hover:border-primary hover:text-primary disabled:cursor-not-allowed disabled:opacity-40 dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
            >
              <svg
                width="12"
                height="12"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <polyline points="4 7 4 4 20 4 20 7" />
                <line x1="9" y1="20" x2="15" y2="20" />
                <line x1="12" y1="4" x2="12" y2="20" />
              </svg>
              pronto-sku
            </button>
          </div>
          <textarea
            ref={answerRef}
            value={answer}
            onChange={(e) => setAnswer(e.target.value)}
            onSelect={handleAnswerSelect}
            onMouseUp={handleAnswerSelect}
            onKeyUp={handleAnswerSelect}
            maxLength={MAX_LENGTH}
            rows={7}
            className="w-full rounded-lg border border-stroke bg-transparent px-5 py-3 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
            placeholder={t('questionsAnswers.form.answerPlaceholder')}
          />
          <div className="mt-1 flex items-center justify-between">
            <span className="text-sm text-danger">{answerError}</span>
            <span className="text-xs text-bodydark2">
              {answer.length}/{MAX_LENGTH}
            </span>
          </div>
        </div>

        {saveMessage && (
          <div className="rounded-sm border border-stroke bg-gray-2 px-4 py-3 text-sm text-black dark:border-strokedark dark:bg-boxdark-2 dark:text-white">
            {saveMessage}
          </div>
        )}

        <div className="flex justify-end gap-3">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="inline-flex rounded-md border border-stroke px-6 py-2.5 text-center font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-boxdark-2"
            >
              {t('common.cancel')}
            </button>
          )}
          <button
            type="submit"
            disabled={isDisabled || saving}
            className="inline-flex rounded-md bg-primary px-6 py-2.5 text-center font-medium text-white hover:bg-opacity-90 disabled:cursor-not-allowed disabled:bg-opacity-60"
          >
            {saving
              ? t('common.loading')
              : t('questionsAnswers.form.saveButton')}
          </button>
        </div>
      </form>
    </>
  );

  if (!showCard) {
    return content;
  }

  return (
    <section className="rounded-sm border border-stroke bg-white py-4 shadow-default dark:border-strokedark dark:bg-boxdark">
      {content}
    </section>
  );
};

export default QuestionsAnswersForm;
