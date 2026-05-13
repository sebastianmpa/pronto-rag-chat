import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { forgotPasswordApi } from '../../libs/AuthService';

const ForgotPassword: React.FC = () => {
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const { t } = useTranslation();

  const validateEmail = (value: string): boolean => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setEmail(val);
    setEmailError('');
    setMessage(null);
    if (val && !validateEmail(val)) {
      setEmailError(t('auth.invalidEmail'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!validateEmail(email)) {
      setEmailError(t('auth.invalidEmail'));
      return;
    }

    setLoading(true);
    try {
      const response = await forgotPasswordApi({ email });
      setMessage({ type: 'success', text: response.message });
      setEmail('');
    } catch (err: any) {
      setMessage({
        type: 'error',
        text: err.message || t('auth.errorGeneric'),
      });
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
                <img
                  src="/images/PRONTO-PRODESK-ORIGIN.png"
                  alt="Pronto ProDesk"
                  className="max-w-xs w-auto h-auto"
                />
              </Link>
            </div>
          </div>

          <div className="w-full xl:w-1/2 p-10 flex items-center justify-center">
            <div className="w-full max-w-md bg-white rounded-lg shadow-lg p-8 border border-gray-200 dark:bg-boxdark dark:border-strokedark">
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="text-center mb-2">
                  <h2 className="text-2xl font-bold dark:text-white">
                    {t('auth.forgotPasswordTitle')}
                  </h2>
                  <p className="text-sm text-body dark:text-bodydark mt-2">
                    {t('auth.forgotPasswordSubtitle')}
                  </p>
                </div>

                {/* Mensaje de respuesta */}
                {message && (
                  <div
                    className={`flex w-full border-l-6 px-4 py-4 shadow-md rounded-lg ${
                      message.type === 'success'
                        ? 'border-[#34D399] bg-[#34D399] bg-opacity-[15%] dark:bg-[#1B1B24] dark:bg-opacity-30'
                        : 'border-[#F87171] bg-[#F87171] bg-opacity-[15%] dark:bg-[#1B1B24] dark:bg-opacity-30'
                    }`}
                  >
                    <div
                      className={`mr-4 flex h-9 w-9 items-center justify-center rounded-lg flex-shrink-0 ${
                        message.type === 'success' ? 'bg-[#34D399]' : 'bg-[#F87171]'
                      }`}
                    >
                      {message.type === 'success' ? (
                        <svg width="16" height="12" viewBox="0 0 16 12" fill="none">
                          <path
                            d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L0.747959 6.59029L0.752701 6.59541L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z"
                            fill="white"
                            stroke="white"
                          />
                        </svg>
                      ) : (
                        <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
                          <path
                            d="M6.4917 7.65579L11.106 12.2645C11.2545 12.4128 11.4715 12.5 11.6738 12.5C11.8762 12.5 12.0931 12.4128 12.2416 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114C12.242 11.1111 12.2418 11.1109 12.2416 11.1107L7.64539 6.50351L12.2589 1.91221L12.2595 1.91158C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418C11.1063 0.757543 11.1062 0.757668 11.106 0.757793L6.49234 5.34931L1.89459 0.740581L1.89396 0.739942C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.42005 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579ZM6.4917 7.65579L1.89459 12.2639L1.89395 12.2645C1.74546 12.4128 1.52854 12.5 1.32616 12.5C1.12377 12.5 0.906853 12.4128 0.758361 12.2645L1.1117 11.9108L0.758358 12.2645C0.437984 11.9445 0.437708 11.4319 0.757539 11.1116C0.757812 11.1113 0.758086 11.111 0.75836 11.1107L5.33864 6.50287L0.740487 1.89373L6.4917 7.65579Z"
                            fill="#ffffff"
                            stroke="#ffffff"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="w-full">
                      <h5
                        className={`mb-1 font-semibold ${
                          message.type === 'success'
                            ? 'text-black dark:text-[#34D399]'
                            : 'text-[#B45454]'
                        }`}
                      >
                        {message.type === 'success' ? t('auth.successTitle') : t('auth.errorTitle')}
                      </h5>
                      <p
                        className={`text-sm leading-relaxed ${
                          message.type === 'success' ? 'text-body' : 'text-[#CD5D5D]'
                        }`}
                      >
                        {message.text}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                    {t('auth.email')}
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={handleEmailChange}
                    className={`w-full border ${emailError ? 'border-red-500' : 'border-stroke'} px-4 py-3 rounded-lg focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition`}
                    placeholder={t('auth.emailPlaceholder')}
                    required
                  />
                  {emailError && (
                    <p className="mt-1 text-sm text-red-500">{emailError}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading || !!emailError || !email}
                  className="w-full bg-primary text-black py-3 rounded-lg hover:bg-opacity-90 transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? t('common.submitting') : t('auth.sendResetLink')}
                </button>

                <div className="mt-6 text-center">
                  <p className="text-sm text-body dark:text-bodydark">
                    <Link to="/auth/signin" className="text-primary hover:underline font-medium">
                      {t('auth.backToLogin')}
                    </Link>
                  </p>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default ForgotPassword;
