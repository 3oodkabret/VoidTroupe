import type { AuthUser } from "@/store/use-auth-store";
import { withApiBase } from "@/lib/api-base";

type AuthResponse = {
  token: string;
  user: AuthUser;
};

type ApiErrorPayload = {
  error?: string;
  message?: string;
};

async function parseError(response: Response): Promise<string> {
  try {
    const payload = (await response.json()) as ApiErrorPayload;
    return payload.error || payload.message || `Request failed (${response.status})`;
  } catch {
    return `Request failed (${response.status})`;
  }
}

async function postJson<T>(url: string, body: unknown): Promise<T> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

async function patchJson<T>(url: string, body: unknown, token?: string): Promise<T> {
  const response = await fetch(url, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await parseError(response));
  }

  return (await response.json()) as T;
}

export function loginRequest(email: string, password: string) {
  return postJson<AuthResponse>(withApiBase("/api/auth/login"), { email, password });
}

export function registerRequest(name: string, email: string, password: string) {
  return postJson<AuthResponse>(withApiBase("/api/auth/register"), { name, email, password });
}

export function forgotPasswordRequest(email: string) {
  return postJson<{ message?: string }>(withApiBase("/api/auth/forgot-password"), { email });
}

export function resetPasswordRequest(token: string, password: string) {
  return postJson<{ message?: string }>(withApiBase("/api/auth/reset-password"), { token, password });
}

export function updateProfileRequest(token: string, name: string) {
  return patchJson<{ user: AuthUser }>(withApiBase("/api/auth/profile"), { name }, token);
}
