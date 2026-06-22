const rawApiBaseUrl = import.meta.env.VITE_API_URL?.trim();

export const apiBaseUrl = rawApiBaseUrl
  ? rawApiBaseUrl.replace(/\/+$/, "")
  : "";

export function withApiBase(path: string): string {
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return apiBaseUrl ? `${apiBaseUrl}${normalizedPath}` : normalizedPath;
}
