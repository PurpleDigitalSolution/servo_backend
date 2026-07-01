import helmet from "helmet";

const isProduction = process.env.NODE_ENV === "production";

const helmetMiddleware = helmet({
  // 1. Cross-Origin Resource Policy: Restrict who can embed your API's responses
  crossOriginEmbedderPolicy: false,

  // 2. Content Security Policy (CSP):
  // Disable completely for pure APIs to avoid breaking client-side fetches or documentation tools (like Swagger).
  // If your API returns HTML views/dashboards, keep this enabled but configured.
  contentSecurityPolicy: false,

  // 3. DNS Prefetch Control: Disallow browsers from pre-resolving links in your API payloads
  dnsPrefetchControl: { allow: false },

  // 4. Framebuffer: Prevents your API responses from being loaded inside an <iframe> (Anti-Clickjacking)
  frameguard: { action: "deny" },

  // 5. Hide the X-Powered-By header (though helmet handles this by default)
  hidePoweredBy: true,

  // 6. Strict Transport Security (HSTS): Forces HTTPS.
  // CRITICAL: MaxAge should be a year, and include subdomains. Only enforce strongly in production.
  hsts: {
    maxAge: isProduction ? 31536000 : 0, // 1 year in seconds
    includeSubDomains: isProduction,
    preload: isProduction,
  },

  // 7. IE No Open: Stops IE from executing downloads in your site's context
  ieNoOpen: true,

  // 8. MIME-Type Sniffing: Forces browsers to respect the declared Content-Type header
  noSniff: true,

  // 9. Origin Agent Cluster: Gives the origin its own separate execution process if supported
  originAgentCluster: true,

  // 10. Permitted Cross-Domain Policies: Restrict Adobe Flash/Acrobat data leaks
  permittedCrossDomainPolicies: { permittedPolicies: "none" },

  // 11. Referrer Policy: Do not leak API routes or tokens in the Referer header to external sites
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },

  // 12. XSS Filter: Legacy protection for older browsers (sanitizes pages reflecting inputs)
  xssFilter: true,
});

export default helmetMiddleware;
