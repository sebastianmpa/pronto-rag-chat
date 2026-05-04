import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useDeleteTermCategory } from '../../../hooks/useTermCategory';
import { TermCategory } from '../../../types/TermCategory';

interface DeleteTermCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: TermCategory | null;
}

const DeleteTermCategoryModal = ({ isOpen, onClose, onSuccess, category }: DeleteTermCategoryModalProps) => {
  const { t } = useTranslation();
  const { remove, loading, error } = useDeleteTermCategory();
  const [localError, setLocalError] = useState<string | null>(null);

  const handleDelete = async () => {
    setLocalError(null);

    if (!category) return;

    try {
      const success = await remove(category.id);
      if (success) {
        onSuccess();
      }
    } catch (err: any) {
      let errorMessage = 'Error al eliminar la categoría';

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor, intenta nuevamente más tarde';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setLocalError(errorMessage);
    }
  };

  if (!isOpen || !category) return null;

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-6 dark:bg-boxdark shadow-lg">
        <h3 className="mb-2 text-lg font-bold text-danger dark:text-red-400">
          {t('term_categories.delete_modal.title') || 'Eliminar Categoría'}
        </h3>
        
        <p className="mb-3 text-xs text-gray-600 dark:text-gray-300">
          Esta acción no se puede deshacer
        </p>

        <p className="mb-3 text-sm text-black dark:text-white">
          {t('term_categories.delete_modal.message') || '¿Estás seguro de que deseas eliminar esta categoría?'}
        </p>

        <div className="mb-4 rounded-sm border border-stroke bg-gray-2 p-3 dark:border-strokedark dark:bg-boxdark-2">
          <p className="text-sm font-medium text-black dark:text-white">{category.category_name}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400">{category.internal_category_name}</p>
        </div>

        {displayError && (
          <div className="mb-4 rounded-sm border border-red-500 bg-red-50 p-3 text-xs text-red-700 dark:bg-red-900 dark:text-red-200">
            {displayError}
          </div>
        )}

        <div className="mt-6 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded border border-stroke px-4 py-2 text-xs font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4 transition-colors"
          >
            {t('common.cancel') || 'Cancelar'}
          </button>
          <button 
            type="button"
            onClick={handleDelete} 
            disabled={loading} 
            className="rounded bg-danger px-4 py-2 text-xs font-medium text-white hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
          >
            {loading ? (t('common.loading') || 'Cargando...') : (t('common.delete') || 'Eliminar')}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteTermCategoryModal;
