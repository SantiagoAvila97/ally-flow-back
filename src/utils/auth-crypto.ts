import { generateKeyPairSync, privateDecrypt, constants, createPrivateKey, createPublicKey } from 'node:crypto';
import { env } from '../config/env';

/**
 * RSA key for login envelope (client cifra AES key con la pública).
 * Preferir AUTH_RSA_PRIVATE_KEY (PEM PKCS8) en Railway para varias réplicas.
 */
function loadOrCreateKeyPair(): { privatePem: string; publicPem: string } {
  const fromEnv = process.env.AUTH_RSA_PRIVATE_KEY?.replace(/\\n/g, '\n')?.trim();
  if (fromEnv) {
    const privateKey = createPrivateKey(fromEnv);
    const publicKey = createPublicKey(privateKey);
    return {
      privatePem: privateKey.export({ type: 'pkcs8', format: 'pem' }).toString(),
      publicPem: publicKey.export({ type: 'spki', format: 'pem' }).toString(),
    };
  }

  const { privateKey, publicKey } = generateKeyPairSync('rsa', {
    modulusLength: 2048,
    publicKeyEncoding: { type: 'spki', format: 'pem' },
    privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
  });

  if (env.appEnv === 'prod' || env.appEnv === 'qa') {
    console.warn(
      '[auth-crypto] AUTH_RSA_PRIVATE_KEY no definido — clave efímera por proceso. ' +
        'En Railway con >1 réplica define AUTH_RSA_PRIVATE_KEY.',
    );
  }

  return { privatePem: privateKey, publicPem: publicKey };
}

const pair = loadOrCreateKeyPair();

export function getLoginPublicKeyPem(): string {
  return pair.publicPem;
}

/** Descifra ek (RSA-OAEP SHA-256) → AES key raw bytes. */
export function decryptAesKeyEk(ekBase64: string): Buffer {
  const ek = Buffer.from(ekBase64, 'base64');
  return privateDecrypt(
    {
      key: pair.privatePem,
      padding: constants.RSA_PKCS1_OAEP_PADDING,
      oaepHash: 'sha256',
    },
    ek,
  );
}
