import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useUpdateTermCategory } from '../../../hooks/useTermCategory';
import { TermCategory } from '../../../types/TermCategory';

interface EditTermCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  category: TermCategory | null;
}

const EditTermCategoryModal = ({ isOpen, onClose, onSuccess, category }: EditTermCategoryModalProps) => {
  const { t } = useTranslation();
  const { update, loading, error } = useUpdateTermCategory();
  const [formData, setFormData] = useState({ category_name: '' });
  const [localError, setLocalError] = useState<string | null>(null);

  useEffect(() => {
    if (category) {
      setFormData({ category_name: category.category_name });
    }
  }, [category]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    if (!category) return;

    try {
      const result = await update(category.id, formData);
      if (result) {
        onSuccess();
      }
    } catch (err: any) {
      let errorMessage = 'Error al actualizar la categoría';

      if (err?.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err?.response?.status === 500) {
        errorMessage = 'Error interno del servidor. Por favor, intenta nuevamente más tarde';
      } else if (err?.response?.status === 400) {
        errorMessage = 'Los datos ingresados no son válidos. Por favor, verifica los campos';
      } else if (err?.message) {
        errorMessage = err.message;
      }

      setLocalError(errorMessage);
    }
  };

  if (!isOpen || !category) return null;

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          {t('term_categories.edit_modal.title') || 'Editar Categoría'}
        </h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t('term_categories.table.category_name') || 'Nombre de Categoría'} *
            </label>
            <input
              type="text"
              value={formData.category_name}
              onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
              required
              placeholder={t('term_categories.edit_modal.placeholder') || 'Ingresa el nombre de la categoría'}
              className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
            />
          </div>

          {displayError && (
            <div className="rounded-sm border border-red-500 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">
              {displayError}
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4"
            >
              {t('common.cancel') || 'Cancelar'}
            </button>
            <button 
              type="submit" 
              disabled={loading} 
              className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50"
            >
              {loading ? (t('common.loading') || 'Cargando...') : (t('common.save') || 'Guardar')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTermCategoryModal;
