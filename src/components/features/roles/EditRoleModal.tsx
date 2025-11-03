import React, { useState, useEffect, useRef } from 'react';
import { useRoles } from '../../../hooks/useRole';
import { getAllPermissions } from '../../../libs/PermissionService';
import { UpdateRoleDto } from '../../../types/Role';
import { Permission } from '../../../types/Permission';

interface EditRoleModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  trigger: React.RefObject<HTMLButtonElement>;
  roleId: string | null;
}

const EditRoleModal: React.FC<EditRoleModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  trigger,
  roleId,
}) => {
  console.log('🟣 EditRoleModal renderizado, isOpen:', isOpen, 'roleId:', roleId);
  const { getById, update, assignPermissions, fetchPermissions, loading, error } = useRoles();
  const modal = useRef<HTMLDivElement>(null);
  const [loadingRole, setLoadingRole] = useState(false);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<string[]>([]);
  const [loadingPermissions, setLoadingPermissions] = useState(false);

  const [formData, setFormData] = useState<UpdateRoleDto>({
    name: '',
    internalName: '',
    description: '',
  });

  const [formErrors, setFormErrors] = useState<{
    name?: string;
    internalName?: string;
    description?: string;
  }>({});

  // Load role data when modal opens
  useEffect(() => {
    const loadRole = async () => {
      if (isOpen && roleId) {
        setLoadingRole(true);
        try {
          const role = await getById(roleId);
          if (role) {
            setFormData({
              name: role.name,
              internalName: role.internalName,
              description: role.description,
            });
          }
        } catch (err) {
          console.error('Error loading role:', err);
        } finally {
          setLoadingRole(false);
        }
      }
    };

    loadRole();
  }, [isOpen, roleId, getById]);

  // Fetch permissions and role's permissions when modal opens
  useEffect(() => {
    const fetchAll = async () => {
      if (isOpen && roleId) {
        setLoadingPermissions(true);
        try {
          const allPerms = await getAllPermissions();
          setPermissions(allPerms || []);
          const rolePerms = await fetchPermissions(roleId);
          setSelectedPermissionIds(rolePerms.map((p: any) => p.id));
        } catch (err) {
          setPermissions([]);
          setSelectedPermissionIds([]);
        } finally {
          setLoadingPermissions(false);
        }
      }
    };
    fetchAll();
  }, [isOpen, roleId, fetchPermissions]);

  // close on click outside
  useEffect(() => {
    // Agregar un pequeño delay para evitar que el click inicial cierre el modal
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
      
      return () => {
        document.removeEventListener('click', clickHandler);
      };
    }, 100);

    return () => {
      clearTimeout(timer);
    };
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

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
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
    // Clear error when user types
    if (formErrors[name as keyof typeof formErrors]) {
      setFormErrors((prev) => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const validateForm = (): boolean => {
    const errors: typeof formErrors = {};

    if (!formData.name?.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.length < 3) {
      errors.name = 'Name must be at least 3 characters';
    }

    if (!formData.internalName?.trim()) {
      errors.internalName = 'Internal name is required';
    } else if (formData.internalName.length < 3) {
      errors.internalName = 'Internal name must be at least 3 characters';
    } else if (!/^[a-z0-9_-]+$/.test(formData.internalName)) {
      errors.internalName =
        'Only lowercase letters, numbers, hyphens, and underscores are allowed';
    }

    if (!formData.description?.trim()) {
      errors.description = 'Description is required';
    } else if (formData.description.length < 10) {
      errors.description = 'Description must be at least 10 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleTogglePermission = (permId: string) => {
    setSelectedPermissionIds((prev) =>
      prev.includes(permId)
        ? prev.filter((id) => id !== permId)
        : [...prev, permId]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm() || !roleId) return;
    try {
      const success = await update(roleId, formData);
      if (success) {
        await assignPermissions(roleId, { permissionIds: selectedPermissionIds });
        onSuccess();
        onClose();
      }
    } catch (err) {
      console.error('Error updating role:', err);
    }
  };

  console.log('🟣 EditRoleModal rendering with isOpen:', isOpen, 'roleId:', roleId);

  return (
    <div className="fixed left-0 top-0 z-999999 flex h-full min-h-screen w-full items-center justify-center bg-black/90 px-4 py-5">
      <div
        ref={modal}
        className="w-full max-w-4xl rounded-lg bg-white px-0 py-0 dark:bg-boxdark flex flex-row md:max-w-5xl"
        style={{ minHeight: '600px' }}
      >
        {/* Left: Role Info */}
        <div className="flex-1 px-12 py-12 flex flex-col justify-between">
          {/* Header */}
          <div className="mb-8">
            <h3 className="pb-2 text-xl font-bold text-black dark:text-white sm:text-2xl">
              Edit Role
            </h3>
            <span className="mx-auto inline-block h-1 w-22.5 rounded bg-primary"></span>
          </div>
          {/* Error Alert */}
          {error && (
            <div className="mb-6 flex items-center gap-3 rounded-md border border-danger bg-danger bg-opacity-10 p-4">
              <svg className="fill-current text-danger" width="22" height="22" viewBox="0 0 22 22" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11 0C4.92487 0 0 4.92487 0 11C0 17.0751 4.92487 22 11 22C17.0751 22 22 17.0751 22 11C22 4.92487 17.0751 0 11 0ZM11 16.5C10.4477 16.5 10 16.0523 10 15.5C10 14.9477 10.4477 14.5 11 14.5C11.5523 14.5 12 14.9477 12 15.5C12 16.0523 11.5523 16.5 11 16.5ZM12 12.5C12 13.0523 11.5523 13.5 11 13.5C10.4477 13.5 10 13.0523 10 12.5V6.5C10 5.94772 10.4477 5.5 11 5.5C11.5523 5.5 12 5.94772 12 6.5V12.5Z" fill=""/></svg>
              <p className="text-sm font-medium text-danger">{error}</p>
            </div>
          )}
          {/* Form */}
          <form onSubmit={handleSubmit} className="flex flex-col h-full justify-between">
            <div className="mb-6 flex flex-col gap-5.5">
              {/* Role Name */}
              <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Role Name <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name || ''}
                  onChange={handleChange}
                  placeholder="E.g.: Administrator, Editor, Viewer"
                  className={`w-full rounded-lg border-[1.5px] ${formErrors.name ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                  disabled={loading}
                />
                {formErrors.name && (
                  <p className="mt-1 text-xs text-danger">{formErrors.name}</p>
                )}
              </div>
              {/* Internal Name */}
              <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Internal Name <span className="text-meta-1">*</span>
                </label>
                <input
                  type="text"
                  name="internalName"
                  value={formData.internalName || ''}
                  onChange={handleChange}
                  placeholder="E.g.: admin, editor, viewer"
                  className={`w-full rounded-lg border-[1.5px] ${formErrors.internalName ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                  disabled={loading}
                />
                {formErrors.internalName && (
                  <p className="mt-1 text-xs text-danger">{formErrors.internalName}</p>
                )}
                <p className="mt-1 text-xs text-bodydark">Only lowercase letters, numbers, hyphens, and underscores are allowed</p>
              </div>
              {/* Description */}
              <div>
                <label className="mb-3 block text-sm font-medium text-black dark:text-white">
                  Description <span className="text-meta-1">*</span>
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows={4}
                  placeholder="Describe the responsibilities and permissions of this role"
                  className={`w-full rounded-lg border-[1.5px] ${formErrors.description ? 'border-danger' : 'border-stroke'} bg-transparent py-3 px-5 text-black outline-none transition focus:border-primary active:border-primary disabled:cursor-default disabled:bg-whiter dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary`}
                  disabled={loading}
                ></textarea>
                {formErrors.description && (
                  <p className="mt-1 text-xs text-danger">{formErrors.description}</p>
                )}
              </div>
            </div>
            {/* Buttons */}
            <div className="-mx-3 flex flex-wrap gap-y-4 mt-8">
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
                      Updating...
                    </div>
                  ) : (
                    'Update Role'
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>
        {/* Right: Permissions */}
        <div className="w-96 px-8 py-12 border-l border-stroke dark:border-strokedark overflow-y-auto" style={{ maxHeight: '600px' }}>
          <label className="mb-3 block text-lg font-bold text-black dark:text-white">
            Role Permissions
          </label>
          {loadingPermissions ? (
            <div className="flex items-center justify-center py-4">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-t-transparent"></div>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {permissions.map((perm) => (
                <label key={perm.id} className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={selectedPermissionIds.includes(perm.id)}
                    onChange={() => handleTogglePermission(perm.id)}
                  />
                  <span>{perm.name}</span>
                </label>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EditRoleModal;
