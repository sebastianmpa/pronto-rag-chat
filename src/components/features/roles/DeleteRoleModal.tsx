import React, { useEffect, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Role } from '../../../types/Role';
import { useRoles } from '../../../hooks/useRole';

interface DeleteRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  trigger?: React.RefObject<HTMLButtonElement>;
  role: Role;
}

const DeleteRoleModal: React.FC<DeleteRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trigger,
  role,
}) => {
  const modal = useRef<HTMLDivElement>(null);
  const { remove } = useRoles();
  const [loading, setLoading] = useState(false);
  const { t } = useTranslation();

  // close if the esc key is pressed
  useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!isOpen || keyCode !== 27) return;
      onClose();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  }, [isOpen, onClose]);

  // focus management (optional)
  useEffect(() => {
    if (isOpen && trigger?.current) {
      trigger.current.focus();
    }
  }, [isOpen, trigger]);

  // close on click outside
  useEffect(() => {
    // Add a small delay to avoid closing on initial click
    const timer = setTimeout(() => {
      const clickHandler = ({ target }: MouseEvent) => {
        if (!modal.current) return;
        if (
          !isOpen ||
          modal.current.contains(target as Node) ||
          trigger?.current?.contains(target as Node)
        )
          return;
        onClose();
      };
      document.addEventListener('click', clickHandler);
      return () => {
        document.removeEventListener('click', clickHandler);
      };
    }, 100);
    return () => {
      clearTimeout(timer);
    };
  }, [isOpen, trigger, onClose]);

  const handleDelete = async () => {
    setLoading(true);
    try {
      const success = await remove(role.id);
      if (success) {
        if (onSuccess) await onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error deleting role:', err);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
      <div
        ref={modal}
        className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 text-center dark:bg-boxdark md:px-17.5 md:py-15"
      >
        {/* Warning Icon */}
        <span className="mx-auto inline-block">
          <svg
            width="60"
            height="60"
            viewBox="0 0 60 60"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <rect
              opacity="0.1"
              width="60"
              height="60"
              rx="30"
              fill="#DC2626"
            />
            <path
              d="M30 27.2498V29.9998V27.2498ZM30 35.4999H30.0134H30ZM20.6914 41H39.3086C41.3778 41 42.6704 38.7078 41.6358 36.8749L32.3272 20.3747C31.2926 18.5418 28.7074 18.5418 27.6728 20.3747L18.3642 36.8749C17.3296 38.7078 18.6222 41 20.6914 41Z"
              stroke="#DC2626"
              strokeWidth="2.2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        {/* Title */}
        <h3 className="mt-5.5 pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
          {t('roles.modal.delete_title')}
        </h3>

        {/* Message */}
        <p className="mb-10 px-4">
          {t('roles.modal.delete_confirm', { name: role.name })}
          <br />
          <span className="mt-2 block text-sm text-bodydark">
            {t('roles.modal.delete_warning')}
          </span>
        </p>

        {/* Buttons */}
        <div className="-mx-3 flex flex-wrap gap-y-4">
          <div className="w-full px-3 2xsm:w-1/2">
            <button
              onClick={onClose}
              disabled={loading}
              className="block w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-meta-1 hover:bg-meta-1 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-meta-1 dark:hover:bg-meta-1"
            >
              {t('roles.modal.cancel')}
            </button>
          </div>
          <div className="w-full px-3 2xsm:w-1/2">
            <button
              onClick={handleDelete}
              disabled={loading}
              className="block w-full rounded border border-danger bg-danger p-3 text-center font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {loading ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                  {t('roles.modal.deleting')}
                </div>
              ) : (
                t('roles.modal.delete')
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteRoleModal;
