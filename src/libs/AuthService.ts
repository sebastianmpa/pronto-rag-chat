import { AuthResponse } from "../types/Auth";
import { ForgotPasswordDto, ForgotPasswordResponse, ResetPasswordDto, ResetPasswordResponse } from "../types/Profile";

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
    const error = new Error('Login failed');
    (error as any).status = res.status;
    throw error;
  }

  return res.json();
}

export async function forgotPasswordApi(data: ForgotPasswordDto): Promise<ForgotPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/${API_VERSION_V0}/forgot-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if (!res.ok) {
    const error = new Error(json?.message || 'Request failed');
    (error as any).status = res.status;
    (error as any).data = json;
    throw error;
  }

  return json;
}

export async function resetPasswordApi(data: ResetPasswordDto): Promise<ResetPasswordResponse> {
  const res = await fetch(`${BASE_URL}/api/auth/${API_VERSION_V0}/reset-password`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(data)
  });

  const json = await res.json();

  if (!res.ok) {
    const error = new Error(json?.message || 'Request failed');
    (error as any).status = res.status;
    (error as any).data = json;
    throw error;
  }

  return json;
}