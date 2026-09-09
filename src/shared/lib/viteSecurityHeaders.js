/** Security headers for Vite dev + preview (Cloudflare still terminates HTTPS). */
export const APOYO_SECURITY_HEADERS = {
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "strict-origin-when-cross-origin",
  "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=()",
  "Cross-Origin-Opener-Policy": "same-origin",
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  "Content-Security-Policy": [
    "default-src 'self'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "img-src 'self' data: blob: https://api.apoyo-dasma.online https://*.tile.openstreetmap.org",
    "media-src 'self' blob: https://api.apoyo-dasma.online",
    "font-src 'self' data:",
    "style-src 'self' 'unsafe-inline'",
    "style-src-attr 'unsafe-inline'",
    "script-src 'self'",
    "connect-src 'self' https://api.apoyo-dasma.online wss://api.apoyo-dasma.online http://127.0.0.1:54321 http://localhost:54321 ws://127.0.0.1:54321 ws://localhost:54321",
    "frame-src https://www.openstreetmap.org",
  ].join("; "),
};

export function apoyoSecurityHeadersPlugin() {
  return {
    name: "apoyo-security-headers",
    configureServer(server) {
      server.middlewares.use((_req, res, next) => {
        for (const [key, value] of Object.entries(APOYO_SECURITY_HEADERS)) {
          res.setHeader(key, value);
        }
        next();
      });
    },
    configurePreviewServer(server) {
      server.middlewares.use((_req, res, next) => {
        for (const [key, value] of Object.entries(APOYO_SECURITY_HEADERS)) {
          res.setHeader(key, value);
        }
        next();
      });
    },
  };
}
