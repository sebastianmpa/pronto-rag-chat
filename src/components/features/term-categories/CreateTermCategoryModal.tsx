import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateTermCategory } from '../../../hooks/useTermCategory';

interface CreateTermCategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateTermCategoryModal = ({ isOpen, onClose, onSuccess }: CreateTermCategoryModalProps) => {
  const { t } = useTranslation();
  const { create, loading, error } = useCreateTermCategory();
  const [formData, setFormData] = useState({ category_name: '', internal_category_name: '' });
  const [localError, setLocalError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);

    // Si no hay internal_category_name, generar uno automáticamente
    const internalName = formData.internal_category_name.trim() || 
      formData.category_name.toLowerCase().replace(/\s+/g, '_');

    if (!formData.category_name.trim()) {
      setLocalError('El nombre de categoría es requerido');
      return;
    }

    try {
      const result = await create({
        category_name: formData.category_name,
        internal_category_name: internalName
      });
      if (result) {
        setFormData({ category_name: '', internal_category_name: '' });
        onSuccess();
      }
    } catch (err: any) {
      let errorMessage = 'Error al crear la categoría';

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

  if (!isOpen) return null;

  const displayError = localError || error;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-lg bg-white p-6 dark:bg-boxdark">
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">
          {t('term_categories.create_modal.title') || 'Crear Categoría'}
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
              placeholder={t('term_categories.create_modal.placeholder') || 'Ingresa el nombre de la categoría'}
              className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">
              {t('term_categories.create_modal.internal_name') || 'Nombre Interno (opcional)'}
            </label>
            <input
              type="text"
              value={formData.internal_category_name}
              onChange={(e) => setFormData({ ...formData, internal_category_name: e.target.value })}
              placeholder={t('term_categories.create_modal.internal_placeholder') || 'Se genera automáticamente si está vacío'}
              className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white"
            />
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              {t('term_categories.create_modal.internal_hint') || 'Se genera automáticamente a partir del nombre si no lo proporcionas'}
            </p>
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
              {loading ? (t('common.loading') || 'Cargando...') : (t('common.create') || 'Crear')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateTermCategoryModal;
