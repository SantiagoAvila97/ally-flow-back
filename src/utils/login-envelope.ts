import { createDecipheriv } from 'node:crypto';
import { AppError } from '../middlewares/error.middleware';
import { decryptAesKeyEk } from './auth-crypto';

export interface LoginCredentials {
  email: string;
  password: string;
}

/**
 * Envelope híbrido: ek (RSA) + iv + ct (AES-GCM) con JSON {email,password,ts}.
 */
export function decryptLoginEnvelope(input: {
  ek: string;
  iv: string;
  ct: string;
}): LoginCredentials {
  try {
    const aesKey = decryptAesKeyEk(input.ek);
    if (aesKey.length !== 32) {
      throw new Error('AES key length');
    }
    const iv = Buffer.from(input.iv, 'base64');
    const ctBuf = Buffer.from(input.ct, 'base64');
    if (iv.length !== 12 || ctBuf.length < 17) {
      throw new Error('iv/ct');
    }
    const tag = ctBuf.subarray(ctBuf.length - 16);
    const data = ctBuf.subarray(0, ctBuf.length - 16);
    const decipher = createDecipheriv('aes-256-gcm', aesKey, iv);
    decipher.setAuthTag(tag);
    const plain = Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8');
    const parsed = JSON.parse(plain) as { email?: string; password?: string; ts?: number };
    if (!parsed.email || !parsed.password) {
      throw new Error('fields');
    }
    // Anti-replay suave: máx 5 minutos
    if (typeof parsed.ts === 'number' && Math.abs(Date.now() - parsed.ts) > 5 * 60 * 1000) {
      throw new AppError(401, 'Credenciales expiradas. Intenta de nuevo.');
    }
    return { email: String(parsed.email), password: String(parsed.password) };
  } catch (err) {
    if (err instanceof AppError) throw err;
    throw new AppError(400, 'No se pudieron descifrar las credenciales');
  }
}
