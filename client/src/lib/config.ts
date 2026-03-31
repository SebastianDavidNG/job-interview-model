/**
 * URL del backend (WebSocket + API).
 * - Desarrollo: http://localhost:3001
 * - Producción mismo servidor (client en server/public): '' (mismo origen)
 * - Producción front y back separados: VITE_SERVER_URL al build, ej. https://api.tudominio.com
 */
export const SERVER_URL =
  (import.meta.env.VITE_SERVER_URL as string | undefined) !== undefined
    ? (import.meta.env.VITE_SERVER_URL as string)
    : import.meta.env.PROD
      ? ''
      : 'http://localhost:3001';
