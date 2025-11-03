import React, { useState, useEffect, useRef } from 'react';
import { useUsers } from '../../../hooks/useUser';
import { getAllRoles } from '../../../libs/RoleService';
import { CreateUserDto } from '../../../types/User';
import { Role } from '../../../types/Role';

interface CreateUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger: React.RefObject<HTMLButtonElement>;
}

const CreateUserModal: React.FC<CreateUserModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trigger,
}) => {
  const { create, loading, error } = useUsers();
  const modal = useRef<HTMLDivElement>(null);

  const [roles, setRoles] = useState<Role[]>([]);
  const [loadingRoles, setLoadingRoles] = useState(false);

  const [formData, setFormData] = useState<CreateUserDto>({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    roleId: '',
  });

  const [formErrors, setFormErrors] = useState<{
    firstName?: string;
    lastName?: string;
    email?: string;
    password?: string;
    roleId?: string;
  }>({});

  // Fetch roles when modal opens
  useEffect(() => {
    const fetchRoles = async () => {
      setLoadingRoles(true);
      try {
        const data = await getAllRoles();
        setRoles(data || []);
      } catch (err) {
        setRoles([]);
      } finally {
        setLoadingRoles(false);
      }
    };
    if (isOpen) {
      fetchRoles();
    }
  }, [isOpen]);

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
        firstName: '',
        lastName: '',
        email: '',
        password: '',
        roleId: '',
      });
      setFormErrors({});
    }
  }, [isOpen]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
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
    if (!formData.firstName.trim()) {
      errors.firstName = 'First name is required';
    } else if (formData.firstName.length < 2) {
      errors.firstName = 'First name must be at least 2 characters';
    }
    if (!formData.lastName.trim()) {
      errors.lastName = 'Last name is required';
    } else if (formData.lastName.length < 2) {
      errors.lastName = 'Last name must be at least 2 characters';
    }
    if (!formData.email.trim()) {
      errors.email = 'Email is required';
    } else if (!/^\S+@\S+\.\S+$/.test(formData.email)) {
      errors.email = 'Email is not valid';
    }
    if (!formData.password.trim()) {
      errors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      errors.password = 'Password must be at least 6 characters';
    }
    if (!formData.roleId) {
      errors.roleId = 'You must select a role';
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
      console.error('Error creating user:', err);
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
            Create New User
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
            {/* First Name */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                First Name <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="E.g.: John"
                className={`w-full rounded-lg border-[1.5px] ${formErrors.firstName ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              />
              {formErrors.firstName && (
                <p className="mt-1 text-xs text-danger">{formErrors.firstName}</p>
              )}
            </div>
            {/* Last Name */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Last Name <span className="text-meta-1">*</span>
              </label>
              <input
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="E.g.: Smith"
                className={`w-full rounded-lg border-[1.5px] ${formErrors.lastName ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              />
              {formErrors.lastName && (
                <p className="mt-1 text-xs text-danger">{formErrors.lastName}</p>
              )}
            </div>
            {/* Email */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Email <span className="text-meta-1">*</span>
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder="E.g.: john.smith@email.com"
                className={`w-full rounded-lg border-[1.5px] ${formErrors.email ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              />
              {formErrors.email && (
                <p className="mt-1 text-xs text-danger">{formErrors.email}</p>
              )}
            </div>
            {/* Password */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Password <span className="text-meta-1">*</span>
              </label>
              <input
                type="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                placeholder="Minimum 6 characters"
                className={`w-full rounded-lg border-[1.5px] ${formErrors.password ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading}
              />
              {formErrors.password && (
                <p className="mt-1 text-xs text-danger">{formErrors.password}</p>
              )}
            </div>
            {/* Role */}
            <div>
              <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                Role <span className="text-meta-1">*</span>
              </label>
              <select
                name="roleId"
                value={formData.roleId}
                onChange={handleChange}
                className={`w-full rounded-lg border-[1.5px] ${formErrors.roleId ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                disabled={loading || loadingRoles}
              >
                <option value="">Select a role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
                  </option>
                ))}
              </select>
              {formErrors.roleId && (
                <p className="mt-1 text-xs text-danger">{formErrors.roleId}</p>
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
                Cancel
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
                    Creating...
                  </div>
                ) : (
                  'Create User'
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
