import React, { useRef } from 'react';
import { useUsers } from '../../../hooks/useUser';
import { User } from '../../../types/User';
import { useTranslation } from 'react-i18next';

interface DeleteUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger: React.RefObject<HTMLButtonElement>;
  user: User | null;
}

const DeleteUserModal: React.FC<DeleteUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trigger,
  user,
}) => {
  const { t } = useTranslation();
  const { remove, loading, error } = useUsers();
  const modal = useRef<HTMLDivElement>(null);

  // close on click outside
  React.useEffect(() => {
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
  React.useEffect(() => {
    const keyHandler = ({ keyCode }: KeyboardEvent) => {
      if (!isOpen || keyCode !== 27) return;
      onClose();
    };
    document.addEventListener('keydown', keyHandler);
    return () => document.removeEventListener('keydown', keyHandler);
  });

  const handleDelete = async () => {
    if (!user) return;
    try {
      const success = await remove(user.id);
      if (success) {
        onSuccess();
        onClose();
      }
    } catch (err) {
      // error handled by hook
    }
  };

  if (!isOpen || !user) return null;

  return (
    <div className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
      <div
        ref={modal}
        className="w-full max-w-142.5 rounded-lg bg-white px-8 py-12 dark:bg-boxdark md:px-17.5 md:py-15"
      >
        <div className="mb-8 text-center">
          <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
            {t('users.modal.delete_confirm')}
          </h3>
          <span className="mx-auto inline-block h-1 w-22.5 rounded bg-danger"></span>
        </div>
        <div className="mb-6 text-center">
          <p className="text-base text-black dark:text-white">
            {user.firstName} {user.lastName} <br />
            <span className="text-sm text-bodydark">{user.email}</span>
          </p>
        </div>
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
            <p className="text-sm font-medium text-danger">{t('users.modal.error')}</p>
          </div>
        )}
        <div className="flex gap-4 mt-8">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="w-full rounded border border-stroke bg-gray p-3 text-center font-medium text-black transition hover:border-danger hover:bg-danger hover:text-white disabled:cursor-not-allowed disabled:opacity-50 dark:border-strokedark dark:bg-meta-4 dark:text-white dark:hover:border-danger dark:hover:bg-danger"
          >
            {t('users.modal.cancel')}
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={loading}
            className="w-full rounded border border-danger bg-danger p-3 text-center font-medium text-white transition hover:bg-opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? (
              <div className="flex items-center justify-center gap-2">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-solid border-white border-t-transparent"></div>
                {t('users.modal.deleting')}
              </div>
            ) : (
              t('users.modal.delete')
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeleteUserModal;
