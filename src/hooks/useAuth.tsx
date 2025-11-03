import React, { createContext, useContext, useState, useEffect } from 'react';
import { loginApi } from '../libs/AuthService';
import { getMyProfile } from '../libs/UserService';
import { AuthResponse } from '../types/Auth';

interface AuthState {
  token: string | null;
  expiresAt: string | null;
  email: string | null;
  role: string | null;
}

interface AuthContextType extends AuthState {
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const LOCAL_KEY = 'auth';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [auth, setAuth] = useState<AuthState>(() => {
    const stored = localStorage.getItem(LOCAL_KEY);
    return stored ? JSON.parse(stored) : { token: null, expiresAt: null, email: null, role: null };
  });

  useEffect(() => {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(auth));
    
    // ⬅️ NUEVO: También guardar el token por separado para compatibilidad
    if (auth.token) {
      localStorage.setItem('token', auth.token);
    } else {
      localStorage.removeItem('token');
    }
  }, [auth]);

  const login = async (email: string, password: string) => {
    try {
      const data = await loginApi(email, password);
      if (!data) return false;
      setAuth({ token: data.token, expiresAt: data.expiresAt, email, role: data.role || null });
      return true;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  };

  // Cuando el token esté disponible, obtener el perfil y guardar el customer_id
  useEffect(() => {
    const fetchProfileAndSaveId = async () => {
      const token = localStorage.getItem('token');
      // Si no hay token, limpia el customer_id y no hagas petición
      if (!auth.token || !token) {
        localStorage.removeItem('customer_id');
        return;
      }
      try {
        const profile = await getMyProfile();
        if (profile?.id) {
          localStorage.setItem('customer_id', profile.id);
        } else if (profile?.userProfile?.id) {
          localStorage.setItem('customer_id', profile.userProfile.id);
        }
      } catch (profileError) {
        console.error('Error obteniendo perfil tras login:', profileError);
      }
    };
    fetchProfileAndSaveId();
  }, [auth.token]);

  const logout = () => {
    setAuth({ token: null, expiresAt: null, email: null, role: null });
    localStorage.removeItem(LOCAL_KEY);
    localStorage.removeItem('token'); // ⬅️ NUEVO: También remover 'token'
    localStorage.removeItem('customer_id'); // ⬅️ Limpiar el customer_id al cerrar sesión
  };

  const isAuthenticated = !!auth.token;

  return (
    <AuthContext.Provider value={{ ...auth, login, logout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};