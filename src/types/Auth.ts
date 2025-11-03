export interface AuthResponse {
    token: string;
    expiresAt: string;
    role?: string;
}