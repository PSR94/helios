const DEFAULT_API_BASE_URL = "http://localhost:8000";

export function apiUrl(path: string): string {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || DEFAULT_API_BASE_URL;
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  return `${baseUrl}${normalizedPath}`;
}
