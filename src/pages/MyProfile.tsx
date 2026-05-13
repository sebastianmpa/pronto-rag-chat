import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import Breadcrumb from '../components/Breadcrumbs/Breadcrumb';
import DefaultLayout from '../layout/DefaultLayout';
import Loader from '../common/Loader';
import { useUserProfile } from '../hooks/useUser';
import { changePassword } from '../libs/ProfileService';
import UserOne from '../images/user/user-01.png';

const MyProfile = () => {
  const { profile, loading, error, fetchProfile } = useUserProfile();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // States for password form
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validaciones
    if (!currentPassword || !newPassword || !confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: t('common.required_fields') || 'All fields are required',
      });
      return;
    }

    if (newPassword !== confirmPassword) {
      setPasswordMessage({
        type: 'error',
        text: t('profile.password_mismatch') || 'New passwords do not match',
      });
      return;
    }

    if (newPassword.length < 6) {
      setPasswordMessage({
        type: 'error',
        text: t('profile.password_min_length') || 'Password must be at least 6 characters',
      });
      return;
    }

    setPasswordLoading(true);
    setPasswordMessage(null);

    try {
      const response = await changePassword({
        currentPassword,
        newPassword,
        confirmPassword,
      });

      setPasswordMessage({
        type: 'success',
        text: response.message || t('profile.password_changed') || 'Password changed successfully',
      });

      // Limpiar formulario
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err: any) {
      setPasswordMessage({
        type: 'error',
        text: err.response?.data?.message || err.message || t('profile.password_error') || 'Error changing password',
      });
    } finally {
      setPasswordLoading(false);
    }
  };

  if (loading) {
    return <Loader />;
  }

  if (error || !profile) {
    return (
      <DefaultLayout>
        <Breadcrumb pageName={t('sidebar.profile') || 'My Profile'} />
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark p-6">
          <p className="text-red-600">{error || t('common.no_results')}</p>
        </div>
      </DefaultLayout>
    );
  }

  const user = profile?.userProfile;

  return (
    <DefaultLayout>
      <Breadcrumb pageName={t('sidebar.profile') || 'My Profile'} />

      <div className="grid grid-cols-1 gap-9">
        {/* Profile Card */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-4 py-4 dark:border-strokedark sm:px-6">
            <h3 className="font-medium text-black dark:text-white">
              {t('sidebar.profile') || 'Profile Information'}
            </h3>
          </div>

          <div className="p-6">
            {/* Profile Header */}
            <div className="mb-5.5 flex flex-col items-center justify-center gap-3.5 sm:flex-row sm:justify-start">
              <div className="h-20 w-20 rounded-full">
                <img src={UserOne} alt="User Profile" className="w-full h-full object-cover" />
              </div>
              <div className="text-center sm:text-left">
                <h4 className="font-semibold text-black dark:text-white">
                  {user?.firstName} {user?.lastName}
                </h4>
                <span className="text-sm">
                  {user?.Role?.name}
                </span>
              </div>
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t('common.email') || 'Email'}
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:disabled:bg-gray-700"
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t('common.first_name') || 'First Name'}
              </label>
              <input
                type="text"
                value={user?.firstName || ''}
                disabled
                className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:disabled:bg-gray-700"
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t('common.last_name') || 'Last Name'}
              </label>
              <input
                type="text"
                value={user?.lastName || ''}
                disabled
                className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:disabled:bg-gray-700"
              />
            </div>

            <div className="mb-4.5">
              <label className="mb-2.5 block font-medium text-black dark:text-white">
                {t('common.role') || 'Role'}
              </label>
              <input
                type="text"
                value={user?.Role?.name || ''}
                disabled
                className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:disabled:bg-gray-700"
              />
            </div>

            {user?.createdAt && (
              <div className="mb-4.5">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('common.created_at') || 'Created At'}
                </label>
                <input
                  type="text"
                  value={new Date(user.createdAt).toLocaleDateString()}
                  disabled
                  className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:disabled:bg-gray-700"
                />
              </div>
            )}

            {user?.updatedAt && (
              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('common.updated_at') || 'Updated At'}
                </label>
                <input
                  type="text"
                  value={new Date(user.updatedAt).toLocaleDateString()}
                  disabled
                  className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary disabled:cursor-default disabled:bg-gray-100 dark:disabled:bg-gray-700"
                />
              </div>
            )}

            <button
              onClick={() => navigate('/')}
              className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray-100 hover:bg-opacity-90"
            >
              {t('common.back') || 'Back to Dashboard'}
            </button>
          </div>
        </div>

        {/* Change Password Card */}
        <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
          <div className="border-b border-stroke px-4 py-4 dark:border-strokedark sm:px-6">
            <h3 className="font-medium text-black dark:text-white">
              {t('profile.change_password') || 'Change Password'}
            </h3>
          </div>

          <div className="p-6">
            {/* Message Display */}
            {passwordMessage && (
              <div
                className={`mb-5 rounded border px-4 py-3 ${
                  passwordMessage.type === 'success'
                    ? 'border-green-300 bg-green-50 text-green-800 dark:border-green-600 dark:bg-green-900/20 dark:text-green-300'
                    : 'border-red-300 bg-red-50 text-red-800 dark:border-red-600 dark:bg-red-900/20 dark:text-red-300'
                }`}
              >
                {passwordMessage.text}
              </div>
            )}

            <form onSubmit={handleChangePassword}>
              <div className="mb-4.5">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('profile.current_password') || 'Current Password'}
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  placeholder={t('profile.current_password_placeholder') || 'Enter your current password'}
                  className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-4.5">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('profile.new_password') || 'New Password'}
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder={t('profile.new_password_placeholder') || 'Enter your new password'}
                  className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <div className="mb-6">
                <label className="mb-2.5 block font-medium text-black dark:text-white">
                  {t('profile.confirm_password') || 'Confirm Password'}
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder={t('profile.confirm_password_placeholder') || 'Confirm your new password'}
                  className="relative z-20 inline-flex w-full appearance-none rounded border border-stroke bg-transparent px-5 py-3 outline-none transition focus:border-primary active:border-primary dark:border-form-strokedark dark:bg-form-input dark:text-white dark:focus:border-primary"
                />
              </div>

              <button
                type="submit"
                disabled={passwordLoading}
                className="flex w-full justify-center rounded bg-primary p-3 font-medium text-gray-100 hover:bg-opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {passwordLoading ? t('common.submitting') || 'Submitting...' : t('profile.update_password') || 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DefaultLayout>
  );
};

export default MyProfile;
