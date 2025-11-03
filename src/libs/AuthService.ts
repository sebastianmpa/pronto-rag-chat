import { AuthResponse } from "../types/Auth";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const API_VERSION_V0 = import.meta.env.VITE_API_VERSION_V0;

export async function loginApi(email: string, password: string): Promise<AuthResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/${API_VERSION_V0}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ email, password })
  });

  if (!res.ok) {
    // Lanzar error con el código de estado HTTP
    const error = new Error('Login failed');
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}