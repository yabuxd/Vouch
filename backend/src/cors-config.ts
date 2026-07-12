import cors from 'cors';

function normalizeOrigin(origin: string): string {
  return origin.trim().replace(/\/+$/, '');
}

function parseFrontendOrigins(): string[] {
  const raw = process.env.FRONTEND_URL || 'http://localhost:5173';
  return raw.split(',').map(normalizeOrigin).filter(Boolean);
}

function isPlaceholderOrigin(origin: string): boolean {
  return /YOUR-APP|your-app|example\.com|change-me|placeholder/i.test(origin);
}

export function createCorsMiddleware() {
  const allowedOrigins = parseFrontendOrigins();

  if (process.env.NODE_ENV === 'production') {
    const placeholders = allowedOrigins.filter(isPlaceholderOrigin);
    if (placeholders.length > 0) {
      console.warn(
        `[CORS] FRONTEND_URL contains placeholder value(s): ${placeholders.join(', ')}. ` +
          'Set FRONTEND_URL on Render to your exact Vercel site URL (no trailing slash).',
      );
    }
  }

  return cors({
    origin(origin, callback) {
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalized = normalizeOrigin(origin);
      if (allowedOrigins.includes(normalized)) {
        callback(null, true);
        return;
      }

      if (process.env.NODE_ENV === 'production') {
        console.warn(
          `[CORS] Blocked origin: ${origin} (allowed: ${allowedOrigins.join(', ')})`,
        );
      }

      callback(null, false);
    },
  });
}
