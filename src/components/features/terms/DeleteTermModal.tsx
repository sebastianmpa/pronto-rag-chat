import { useTranslation } from 'react-i18next';
import { useDeleteTerm } from '../../../hooks/useTerm';

interface DeleteTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  termId: string;
}

const DeleteTermModal = ({ isOpen, onClose, onSuccess, termId }: DeleteTermModalProps) => {
  const { t } = useTranslation();
  const { removeTerm, loading, error } = useDeleteTerm();

  const handleConfirmDelete = async () => {
    try {
      await removeTerm(termId);
      onSuccess();
    } catch (err) {
      // Error is handled by the hook
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          {t('terms.delete_modal.title')}
        </h3>

        <p className="mb-6 text-gray-600 dark:text-gray-400">
          {t('terms.delete_modal.message')}
        </p>

        {/* Error Message */}
        {error && (
          <div className="mb-4 rounded-sm border border-red-500 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={loading}
            className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleConfirmDelete}
            disabled={loading}
            className="rounded bg-danger px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
          >
            {loading ? t('common.loading') : t('common.delete')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTermModal;
