export const SESSION_CONFIG_STORAGE_KEY = 'ip_config:v1';
const LEGACY_SESSION_CONFIG_STORAGE_KEY = 'ip_config';

export function readSessionConfigStorage(): string | null {
  try {
    return (
      localStorage.getItem(SESSION_CONFIG_STORAGE_KEY) ??
      localStorage.getItem(LEGACY_SESSION_CONFIG_STORAGE_KEY)
    );
  } catch {
    return null;
  }
}
