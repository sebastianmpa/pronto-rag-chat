import React, { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { resetPasswordApi } from '../../libs/AuthService';

const ResetPassword: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const token = searchParams.get('token') || '';

  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!token) {
      setMessage({ type: 'error', text: t('auth.resetTokenMissing') });
    }
  }, [token, t]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (newPassword.length < 6) {
      setMessage({ type: 'error', text: t('profile.password_min_length') });
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage({ type: 'error', text: t('profile.password_mismatch') });
      return;
    }

    setLoading(true);
    try {
      const response = await resetPasswordApi({ token, newPassword, confirmPassword });
      setMessage({ type: 'success', text: response.message });
      setTimeout(() => navigate('/auth/signin'), 3000);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || t('auth.errorGeneric') });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="rounded-sm border border-stroke bg-white shadow-default dark:border-strokedark dark:bg-boxdark">
        <div className="flex flex-wrap items-center">
          <div className="hidden w-full xl:block xl:w-1/2">
            <div className="py-17.5 px-26 text-center">
              <Link className="mb-5.5 inline-block" to="/">
                <img src="/images/PRONTO-PRODESK-ORIGIN.png" alt="Pronto ProDesk" className="max-w-xs w-auto h-auto" />
              </Link>
            </div>
          </div>

          <div className="w-full xl:w-1/2 p-10 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200 dark:bg-boxdark dark:border-strokedark">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold dark:text-white">
                    {t('auth.resetPasswordTitle')}
                  </h2>
                  <p className="text-sm text-body dark:text-bodydark mt-2">
                    {t('auth.resetPasswordSubtitle')}
                  </p>
                </div>

                {message && (
                  <div className={`flex w-full border-l-6 px-4 py-4 shadow-md rounded-lg ${message.type === 'success' ? 'border-[#34D399] bg-[#34D399] bg-opacity-[15%] dark:bg-[#1B1B24] dark:bg-opacity-30' : 'border-[#F87171] bg-[#F87171] bg-opacity-[15%] dark:bg-[#1B1B24] dark:bg-opacity-30'}`}>
                    <div className={`mr-4 flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${message.type === 'success' ? 'bg-[#34D399]' : 'bg-[#F87171]'}`}>
                      {message.type === 'success' ? (
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none"><path d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L0.752701 6.59541L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z" fill="white" stroke="white"/></svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none"><path d="M6.4917 7.65579L11.106 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114L7.64539 6.50351L12.2589 1.91221C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418L6.49234 5.34931L1.89459 0.740581C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.42005 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579ZM6.4917 7.65579L1.89459 12.2639C0.437984 11.9445 0.437708 11.4319 0.757539 11.1116L5.33864 6.50287L6.4917 7.65579Z" fill="#ffffff" stroke="#ffffff"/></svg>
                      )}
                    </div>
                    <div className="w-full">
                      <h5 className={`mb-1 font-semibold ${message.type === 'success' ? 'text-black dark:text-[#34D399]' : 'text-[#B45454]'}`}>
                        {message.type === 'success' ? t('auth.successTitle') : t('auth.errorTitle')}
                      </h5>
                      <p className={`text-sm leading-relaxed ${message.type === 'success' ? 'text-body' : 'text-[#CD5D5D]'}`}>
                        {message.text}
                      </p>
                      {message.type === 'success' && (
                        <p className="text-xs mt-1 text-body">{t('auth.redirectingToLogin')}</p>
                      )}
                    </div>
                  </div>
                )}

                {token && message?.type !== 'success' && (
                  <>
                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                        {t('profile.new_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showNewPassword ? 'text' : 'password'}
                          value={newPassword}
                          onChange={(e) => { setNewPassword(e.target.value); setMessage(null); }}
                          className="w-full border border-stroke px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition"
                          placeholder={t('profile.new_password_placeholder')}
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowNewPassword(!showNewPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none transition">
                          {showNewPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                        {t('profile.confirm_password')}
                      </label>
                      <div className="relative">
                        <input
                          type={showConfirmPassword ? 'text' : 'password'}
                          value={confirmPassword}
                          onChange={(e) => { setConfirmPassword(e.target.value); setMessage(null); }}
                          className="w-full border border-stroke px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition"
                          placeholder={t('profile.confirm_password_placeholder')}
                          required
                          minLength={6}
                        />
                        <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary focus:outline-none transition">
                          {showConfirmPassword ? (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                          ) : (
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                          )}
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={loading || !newPassword || !confirmPassword}
                      className="w-full bg-primary text-black py-3 rounded-lg hover:bg-opacity-90 transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? t('common.submitting') : t('auth.resetPasswordButton')}
                    </button>
                  </>
                )}

                <div className="mt-4 text-center">
                  <Link to="/auth/signin" className="text-primary hover:underline text-sm font-medium">
                    {t('auth.backToLogin')}
                  </Link>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ResetPassword;
