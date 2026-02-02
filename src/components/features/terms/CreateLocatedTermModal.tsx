import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useCreateLocatedTerm } from '../../../hooks/useTermLocated';

interface CreateLocatedTermModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const CreateLocatedTermModal = ({ isOpen, onClose, onSuccess }: CreateLocatedTermModalProps) => {
  const { t } = useTranslation();
  const { create, loading, error } = useCreateLocatedTerm();
  const [formData, setFormData] = useState({ term: '', definition: '', term_type: 'PARTNUMBER' });
  const [localError, setLocalError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLocalError(null);
    setFieldErrors({});
    try {
      await create(formData as any);
      setFormData({ term: '', definition: '', term_type: 'PARTNUMBER' });
      onSuccess();
    } catch (err: any) {
      let errorMessage = 'Error al crear el término ubicado';

      const errors = err?.response?.data?.errors;
      if (Array.isArray(errors)) {
        const map: Record<string, string> = {};
        errors.forEach((it: any) => {
          if (it?.campo && it?.mensaje) map[it.campo] = it.mensaje;
        });
        setFieldErrors(map);
        errorMessage = err?.response?.data?.message || 'Datos inválidos. Verifica los campos.';
      } else if (err?.response?.data?.message) {
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
        <h3 className="mb-4 text-xl font-semibold text-black dark:text-white">{t('terms.create_modal.title')}</h3>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">{t('terms.table.term')} *</label>
            <input type="text" value={formData.term} onChange={(e) => setFormData({ ...formData, term: e.target.value })} required placeholder={t('terms.create_modal.term_placeholder')} className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white" />
            {fieldErrors.term && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.term}</p>
            )}
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">{t('terms.table.definition')} *</label>
            <textarea value={formData.definition} onChange={(e) => setFormData({ ...formData, definition: e.target.value })} required placeholder={t('terms.create_modal.definition_placeholder')} rows={4} className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white" />
            {fieldErrors.definition && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.definition}</p>
            )}
          </div>

          {/* Term Type Field */}
          <div>
            <label className="mb-2 block text-sm font-medium text-black dark:text-white">{t('terms.table.term_type') || 'Term type'} *</label>
            <select value={formData.term_type} onChange={(e) => setFormData({ ...formData, term_type: e.target.value })} className="w-full rounded border border-stroke bg-gray-2 px-4 py-2 text-black outline-none focus:border-primary dark:border-strokedark dark:bg-boxdark-2 dark:text-white">
              <option value="PARTNUMBER">PARTNUMBER</option>
              <option value="OTHER">OTHER</option>
            </select>
            {fieldErrors.term_type && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-300">{fieldErrors.term_type}</p>
            )}
          </div>

          {displayError && (
            <div className="rounded-sm border border-red-500 bg-red-50 p-3 text-sm text-red-700 dark:bg-red-900 dark:text-red-200">{displayError}</div>
          )}

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} disabled={loading} className="rounded border border-stroke px-4 py-2 text-sm font-medium text-black hover:bg-gray-2 dark:border-strokedark dark:text-white dark:hover:bg-meta-4">{t('common.cancel')}</button>
            <button type="submit" disabled={loading} className="rounded bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-opacity-90 disabled:opacity-50">{loading ? t('common.loading') : t('common.create')}</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateLocatedTermModal;
