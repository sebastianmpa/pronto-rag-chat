import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { useTranslation } from 'react-i18next';

const SignIn: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [emailError, setEmailError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  // Validar email
  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    setEmailError('');
    setError('');
    setSuccess('');
    
    if (newEmail && !validateEmail(newEmail)) {
      setEmailError(t('auth.invalidEmail'));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setEmailError('');

    // Validar email antes de enviar
    if (!validateEmail(email)) {
      setEmailError(t('auth.invalidEmail'));
      return;
    }

    if (!password || password.length < 6) {
      setError(t('auth.passwordMinLength'));
      return;
    }

    try {
      await login(email, password);
      setSuccess(t('auth.loginSuccess'));
      // Esperar un momento para que el usuario vea el mensaje de éxito
      setTimeout(() => {
        navigate('/', { replace: true });
      }, 1500);
    } catch (err: any) {
      console.error('Error en login:', err);
      // Manejar diferentes códigos de estado HTTP
      const status = err?.status;
      if (status === 400) {
        setError(t('auth.error400'));
      } else if (status === 401) {
        setError(t('auth.error401'));
      } else if (status === 500) {
        setError(t('auth.error500'));
      } else if (status === 404) {
        setError(t('auth.error404'));
      } else if (err.message === 'Failed to fetch' || err.name === 'TypeError') {
        setError(t('auth.errorNetwork'));
      } else {
        setError(t('auth.errorGeneric'));
      }
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
                <h2 className="text-2xl font-bold mb-4 text-center dark:text-white">{t('auth.title')}</h2>
                
                {/* Alerta de Error */}
                {error && (
                  <div className="flex w-full border-l-6 border-[#F87171] bg-[#F87171] bg-opacity-[15%] px-4 py-4 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 rounded-lg">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#F87171] flex-shrink-0">
                      <svg
                        width="13"
                        height="13"
                        viewBox="0 0 13 13"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M6.4917 7.65579L11.106 12.2645C11.2545 12.4128 11.4715 12.5 11.6738 12.5C11.8762 12.5 12.0931 12.4128 12.2416 12.2645C12.5621 11.9445 12.5623 11.4317 12.2423 11.1114C12.2422 11.1113 12.2422 11.1113 12.2422 11.1113C12.242 11.1111 12.2418 11.1109 12.2416 11.1107L7.64539 6.50351L12.2589 1.91221L12.2595 1.91158C12.5802 1.59132 12.5802 1.07805 12.2595 0.757793C11.9393 0.437994 11.4268 0.437869 11.1064 0.757418C11.1063 0.757543 11.1062 0.757668 11.106 0.757793L6.49234 5.34931L1.89459 0.740581L1.89396 0.739942C1.57364 0.420019 1.0608 0.420019 0.740487 0.739944C0.42005 1.05999 0.419837 1.57279 0.73985 1.89309L6.4917 7.65579ZM6.4917 7.65579L1.89459 12.2639L1.89395 12.2645C1.74546 12.4128 1.52854 12.5 1.32616 12.5C1.12377 12.5 0.906853 12.4128 0.758361 12.2645L1.1117 11.9108L0.758358 12.2645C0.437984 11.9445 0.437708 11.4319 0.757539 11.1116C0.757812 11.1113 0.758086 11.111 0.75836 11.1107L5.33864 6.50287L0.740487 1.89373L6.4917 7.65579Z"
                          fill="#ffffff"
                          stroke="#ffffff"
                        />
                      </svg>
                    </div>
                    <div className="w-full">
                      <h5 className="mb-1 font-semibold text-[#B45454]">
                        {t('auth.errorTitle')}
                      </h5>
                      <p className="text-sm leading-relaxed text-[#CD5D5D]">
                        {error}
                      </p>
                    </div>
                  </div>
                )}

                {/* Alerta de Éxito */}
                {success && (
                  <div className="flex w-full border-l-6 border-[#34D399] bg-[#34D399] bg-opacity-[15%] px-4 py-4 shadow-md dark:bg-[#1B1B24] dark:bg-opacity-30 rounded-lg">
                    <div className="mr-4 flex h-9 w-9 items-center justify-center rounded-lg bg-[#34D399] flex-shrink-0">
                      <svg
                        width="16"
                        height="12"
                        viewBox="0 0 16 12"
                        fill="none"
                        xmlns="http://www.w3.org/2000/svg"
                      >
                        <path
                          d="M15.2984 0.826822L15.2868 0.811827L15.2741 0.797751C14.9173 0.401867 14.3238 0.400754 13.9657 0.794406L5.91888 9.45376L2.05667 5.2868C1.69856 4.89287 1.10487 4.89389 0.747996 5.28987C0.417335 5.65675 0.417335 6.22337 0.747996 6.59026L0.747959 6.59029L0.752701 6.59541L4.86742 11.0348C5.14445 11.3405 5.52858 11.5 5.89581 11.5C6.29242 11.5 6.65178 11.3355 6.92401 11.035L15.2162 2.11161C15.5833 1.74452 15.576 1.18615 15.2984 0.826822Z"
                          fill="white"
                          stroke="white"
                        />
                      </svg>
                    </div>
                    <div className="w-full">
                      <h5 className="mb-1 font-semibold text-black dark:text-[#34D399]">
                        {t('auth.successTitle')}
                      </h5>
                      <p className="text-sm leading-relaxed text-body">
                        {success}
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
                
                <div>
                  <label className="block mb-2 text-sm font-medium text-black dark:text-white">
                    {t('auth.password')}
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        setError('');
                        setSuccess('');
                      }}
                      className="w-full border border-stroke px-4 py-3 pr-12 rounded-lg focus:outline-none focus:border-primary dark:border-strokedark dark:bg-meta-4 dark:text-white transition"
                      placeholder={t('auth.passwordPlaceholder')}
                      required
                      minLength={6}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-500 hover:text-primary dark:text-gray-400 dark:hover:text-primary focus:outline-none transition"
                      aria-label={showPassword ? t('auth.hidePassword') : t('auth.showPassword')}
                    >
                      {showPassword ? (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21"
                          />
                        </svg>
                      ) : (
                        <svg
                          className="w-5 h-5"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                          />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                <button 
                  type="submit" 
                  className="w-full bg-primary text-black py-3 rounded-lg hover:bg-opacity-90 transition duration-300 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={!!emailError || !email || !password}
                >
                  {t('auth.signIn')}
                </button>
                
                <div className="mt-6 text-center">
                  <p className="text-sm text-body dark:text-bodydark">
                    {t('auth.noAccount')}{' '}
                    <Link to="/auth/signup" className="text-primary hover:underline font-medium">
                      {t('auth.signUp')}
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

export default SignIn;