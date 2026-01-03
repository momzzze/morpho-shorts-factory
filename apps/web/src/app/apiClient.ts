import { useAppStore } from './store';

export async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const token = useAppStore.getState().token;

  // --------------------------- fetch call -----------------------------------
  const res = await fetch(`${import.meta.env.VITE_API_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(init?.headers || {}),
    },
  });
  //--------------------------- return error handler -----------------------------------
  if (res.status === 401) {
    useAppStore.getState().logout();
    throw new Error('Unauthorized');
  }

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(
      text || `API Error: ${res.status} ${res.statusText} - ${text}`
    );
  }
  //--------------------------------------------------------------------------------

  // --------------------------- return response -----------------------------------
  const json = (await res.json()) as any;

  // API often wraps payload under { success, data }
  if (json && typeof json === 'object' && 'data' in json) {
    return json.data as T;
  }

  return json as T;
}
