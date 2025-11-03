/**
 * Realiza una petición fetch con autenticación automática
 * Si el token expira (401), limpia el localStorage y redirige al login
 * @param url - URL del endpoint
 * @param options - Opciones de la petición fetch
 * @returns Promise con la respuesta
 */
export const fetchWithAuth = async (
  url: string,
  options: RequestInit = {}
): Promise<Response> => {
  const token = localStorage.getItem('token');

  const headers = {
    ...options.headers,
    Authorization: token ? `Bearer ${token}` : '',
    'Content-Type': 'application/json',
  };

  try {
    const res = await fetch(url, { ...options, headers });

    // Si el token expiró o no es válido
    if (res.status === 401) {
      // Limpiar el localStorage
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      
      // Redirigir al login
      window.location.href = '/auth/signin';
      
      throw new Error('Sesión expirada. Por favor, inicia sesión nuevamente.');
    }

    return res;
  } catch (error) {
    // Si hay error de red o cualquier otro error
    if (error instanceof TypeError && error.message === 'Failed to fetch') {
      throw new Error('No se pudo conectar con el servidor. Verifica tu conexión a internet.');
    }
    throw error;
  }
};

/**
 * Helper para hacer peticiones GET con autenticación
 * @param url - URL del endpoint
 * @returns Promise con los datos parseados
 */
export const getWithAuth = async <T = any>(url: string): Promise<T> => {
  const response = await fetchWithAuth(url, {
    method: 'GET',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw { status: response.status, message: error.message || 'Error en la petición' };
  }

  return response.json();
};

/**
 * Helper para hacer peticiones POST con autenticación
 * @param url - URL del endpoint
 * @param data - Datos a enviar en el body
 * @returns Promise con los datos parseados
 */
export const postWithAuth = async <T = any>(url: string, data: any): Promise<T> => {
  const response = await fetchWithAuth(url, {
    method: 'POST',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw { status: response.status, message: error.message || 'Error en la petición' };
  }

  return response.json();
};

/**
 * Helper para hacer peticiones PUT con autenticación
 * @param url - URL del endpoint
 * @param data - Datos a enviar en el body
 * @returns Promise con los datos parseados
 */
export const putWithAuth = async <T = any>(url: string, data: any): Promise<T> => {
  const response = await fetchWithAuth(url, {
    method: 'PUT',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw { status: response.status, message: error.message || 'Error en la petición' };
  }

  return response.json();
};

/**
 * Helper para hacer peticiones DELETE con autenticación
 * @param url - URL del endpoint
 * @returns Promise con los datos parseados
 */
export const deleteWithAuth = async <T = any>(url: string): Promise<T> => {
  const response = await fetchWithAuth(url, {
    method: 'DELETE',
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw { status: response.status, message: error.message || 'Error en la petición' };
  }

  return response.json();
};

/**
 * Helper para hacer peticiones PATCH con autenticación
 * @param url - URL del endpoint
 * @param data - Datos a enviar en el body
 * @returns Promise con los datos parseados
 */
export const patchWithAuth = async <T = any>(url: string, data: any): Promise<T> => {
  const response = await fetchWithAuth(url, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Error desconocido' }));
    throw { status: response.status, message: error.message || 'Error en la petición' };
  }

  return response.json();
};