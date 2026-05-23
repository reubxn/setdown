import { convexAuthNextjsMiddleware } from "@convex-dev/auth/nextjs/server";
import { NextResponse } from "next/server";

export default convexAuthNextjsMiddleware((request) => {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const csp = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' 'unsafe-eval'`,
    `style-src 'self' 'unsafe-inline'`,
    `img-src 'self' https://lh3.googleusercontent.com data: blob:`,
    `font-src 'self' data:`,
    `connect-src 'self' https://*.convex.cloud https://*.convex.site wss://*.convex.cloud wss://*.convex.site https://accounts.google.com`,
    `frame-src 'self' https://accounts.google.com`,
    `frame-ancestors 'none'`,
    `base-uri 'self'`,
    `form-action 'self' https://accounts.google.com`,
    `object-src 'none'`,
    `worker-src 'self' blob:`,
    `manifest-src 'self'`,
  ].join("; ");

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("Content-Security-Policy", csp);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", csp);
  return response;
});

export const config = {
  matcher: ["/((?!.*\\..*|_next).*)", "/", "/(api|trpc)(.*)"],
};
