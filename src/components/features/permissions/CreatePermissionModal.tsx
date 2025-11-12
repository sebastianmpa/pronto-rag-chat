import React, { useState, useEffect, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { usePermissions } from '../../../hooks/usePermission';
import { CreatePermissionDto } from '../../../types/Permission';

interface CreatePermissionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger: React.RefObject<HTMLButtonElement>;
}

const CreatePermissionModal: React.FC<CreatePermissionModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trigger,
}) => {
  const { t } = useTranslation();
  const { create, loading, error } = usePermissions();
  const modal = useRef<HTMLDivElement>(null);

  const [formData, setFormData] = useState<CreatePermissionDto>({
    name: '',
    internalName: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    internalName?: string;
    description?: string;
  }>({});

  // close on click outside
  useEffect(() => {
    const timer = setTimeout(() => {
      const clickHandler = ({ target }: MouseEvent) => {
        if (!modal.current) return;
        if (
          !isOpen ||
          modal.current.contains(target as Node) ||
          trigger.current?.contains(target as Node)
        )
          return;
        onClose();
      };
      document.addEventListener('click', clickHandler);
      return () => document.removeEventListener('click', clickHandler);
    }, 100);
    return () => clearTimeout(timer);
  }, [isOpen, trigger, onClose]);

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!isOpen || keyCode !== 27) return;
      onClose();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  // Reset form when modal opens
  useEffect(() => {
    if (isOpen) {
      setFormData({
        name: '',
        internalName: '',
        description: '',
      });
      setFormErrors({});
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};
    if (!formData.name.trim()) {
      errors.name = t('permissions.modal.validation.name_required');
    } else if (formData.name.length < 3) {
      errors.name = t('permissions.modal.validation.name_min');
    }
    if (!formData.internalName.trim()) {
      errors.internalName = t('permissions.modal.validation.internal_name_required');
    } else if (formData.internalName.length < 3) {
      errors.internalName = t('permissions.modal.validation.internal_name_min');
    } else if (!/^[a-z0-9_-]+$/.test(formData.internalName)) {
      errors.internalName = t('permissions.modal.validation.internal_name_pattern');
    }
    if (!formData.description.trim()) {
      errors.description = t('permissions.modal.validation.description_required');
    } else if (formData.description.length < 10) {
      errors.description = t('permissions.modal.validation.description_min');
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const success = await create(formData);
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error creating permission:', err);
    }
  };

  return (
    <div className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
      <div
        ref={modal}
        className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 dark:bg-boxdark md:px-17.5 md:py-15"
      >
        {/* Header */}
        <div className="mb-8">
          <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
            {t('permissions.modal.create_title')}
          </h3>
          <span className="mx-auto inline-block h-1 w-22.5 rounded bg-primary"></span>
        </div>
        {/* Error Alert */}
        {error && (
          <div className="mb-6 flex items-center gap-3 rounded-md border border-danger bg-danger bg-opacity-10 p-4">
            <svg
              className="fill-current text-danger"
              width="22"
              height="22"
              viewBox="0 0 22 22"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0ZM11 16.5C10.4477 16.5 10 16.0523 10 15.5C10 14.9477 10.4477 14.5 11 14.5C11.5523 14.5 12 14.9477 12 15.5C12 16.0523 11.5523 16.5 11 16.5ZM12 12.5C12 13.0523 11.5523 13.5 11 13.5C10.4477 13.5 10 13.0523 10 12.5V6.5C10 5.94772 10.4477 5.5 11 5.5C11.5523 5.5 12 5.94772 12 6.5V12.5Z"
                fill=""
              />
            </svg>
            <p className="text-sm font-medium text-danger">{error}</p>
          </div>
        )}
        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="mb-6 flex flex-col gap-5.5">
            {/* Permission Name */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t('permissions.modal.permission_name')} <span className="text-meta-1">{t('permissions.modal.required')}</span>
                </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={t('permissions.modal.placeholder_name')}
                className={`w-full rounded-lg border-[1.5px] ${
                  formErrors.name ? 'border-danger' : 'border-stroke'
                } bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              />
              {formErrors.name && (
                <p className="mt-1 text-xs text-danger">{formErrors.name}</p>
              )}
            </div>
            {/* Internal Name */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t('permissions.modal.internal_name')} <span className="text-meta-1">{t('permissions.modal.required')}</span>
                </label>
              <input
                type="text"
                name="internalName"
                value={formData.internalName}
                onChange={handleChange}
                placeholder={t('permissions.modal.placeholder_name')}
                className={`w-full rounded-lg border-[1.5px] ${
                  formErrors.internalName ? 'border-danger' : 'border-stroke'
                } bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              />
              {formErrors.internalName && (
                <p className="mt-1 text-xs text-danger">
                  {formErrors.internalName}
                </p>
              )}
              <p className="mt-1 text-xs text-bodydark">
                {t('permissions.modal.validation.internal_name_pattern')}
              </p>
            </div>
            {/* Description */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  {t('permissions.modal.description')} <span className="text-meta-1">{t('permissions.modal.required')}</span>
                </label>
              <textarea
                name="description"
                value={formData.description}
                onChange={handleChange}
                rows={4}
                placeholder={t('permissions.modal.placeholder_description')}
                className={`w-full rounded-lg border-[1.5px] ${
                  formErrors.description ? 'border-danger' : 'border-stroke'
                } bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              ></textarea>
              {formErrors.description && (
                <p className="mt-1 text-xs text-danger">
                  {formErrors.description}
                </p>
              )}
            </div>
          </div>
          {/* Buttons */}
          <div className="-mx-3 flex flex-wrap gap-y-4">
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
              >
                {t('permissions.modal.cancel')}
              </button>
            </div>
            <div className="w-full px-3 2xsm:w-1/2">
              <button
                type="submit"
                disabled={loading}
                className="block w-full rounded border border-primary bg-primary p-3 text-center font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                    {t('permissions.modal.creating')}
                  </div>
                ) : (
                  t('permissions.modal.create')
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreatePermissionModal;
