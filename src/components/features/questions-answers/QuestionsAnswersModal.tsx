import QuestionsAnswersForm from './QuestionsAnswersForm';

interface QuestionsAnswersModalProps {
  isOpen: boolean;
  initialQuestion: string;
  initialAnswer: string;
  onClose: () => void;
}

const QuestionsAnswersModal = ({
  isOpen,
  initialQuestion,
  initialAnswer,
  onClose,
}: QuestionsAnswersModalProps) => {
  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-99999 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-4xl rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <QuestionsAnswersForm
          initialQuestion={initialQuestion}
          initialAnswer={initialAnswer}
          showCard={false}
          onCancel={onClose}
        />
      </div>
    </div>
  );
};

export default QuestionsAnswersModal;
