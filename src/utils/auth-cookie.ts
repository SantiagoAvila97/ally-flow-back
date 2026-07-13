import type { CookieOptions, Response } from 'express';
import { env } from '../config/env';

export const AUTH_COOKIE = 'ally_flow_token';

/** 8h por defecto — alineado con JWT_EXPIRES_IN. */
function cookieMaxAgeMs(): number {
  const raw = env.jwtExpiresIn.trim();
  const m = /^(\d+)([smhd])$/i.exec(raw);
  if (!m) return 8 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const u = m[2].toLowerCase();
  if (u === 's') return n * 1000;
  if (u === 'm') return n * 60 * 1000;
  if (u === 'h') return n * 60 * 60 * 1000;
  if (u === 'd') return n * 24 * 60 * 60 * 1000;
  return 8 * 60 * 60 * 1000;
}

/**
 * Cross-site (Vercel ↔ Railway): SameSite=None + Secure.
 * Local (localhost:4200 ↔ :3000): SameSite=Lax, Secure off.
 */
export function authCookieOptions(): CookieOptions {
  // LOCAL (dev): Lax. QA/PROD (Vercel↔Railway): None+Secure.
  const crossSite = env.isDeployed;
  return {
    httpOnly: true,
    secure: crossSite,
    sameSite: crossSite ? 'none' : 'lax',
    path: '/',
    maxAge: cookieMaxAgeMs(),
  };
}

export function setAuthCookie(res: Response, token: string): void {
  res.cookie(AUTH_COOKIE, token, authCookieOptions());
}

export function clearAuthCookie(res: Response): void {
  res.clearCookie(AUTH_COOKIE, {
    ...authCookieOptions(),
    maxAge: 0,
  });
}
