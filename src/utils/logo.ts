import { AppError } from '../middlewares/error.middleware';

const MAX_BYTES = 800_000; // ~800KB raw image
const MAX_DATA_URL = 1_200_000;

function decodeDataUrl(dataUrl: string): { mime: string; buffer: Buffer } {
  const m = /^data:(image\/(?:png|jpeg|jpg|webp));base64,([A-Za-z0-9+/=\s]+)$/i.exec(
    dataUrl.trim(),
  );
  if (!m) {
    throw new AppError(400, 'Logo inválido. Usa PNG, JPG o WEBP en base64');
  }
  const mime = m[1]!.toLowerCase().replace('image/jpg', 'image/jpeg');
  const buffer = Buffer.from(m[2]!.replace(/\s+/g, ''), 'base64');
  if (!buffer.length || buffer.length > MAX_BYTES) {
    throw new AppError(400, 'El logo es demasiado grande (máx. ~800KB)');
  }
  return { mime, buffer };
}

/** Ancho/alto desde cabeceras PNG / JPEG / WEBP (sin deps). */
export function imageDimensions(
  buffer: Buffer,
  mime: string,
): { width: number; height: number } {
  if (mime === 'image/png') {
    if (buffer.length < 24 || buffer.toString('ascii', 1, 4) !== 'PNG') {
      throw new AppError(400, 'PNG inválido');
    }
    return { width: buffer.readUInt32BE(16), height: buffer.readUInt32BE(20) };
  }

  if (mime === 'image/jpeg') {
    let i = 2;
    while (i < buffer.length - 8) {
      if (buffer[i] !== 0xff) {
        i += 1;
        continue;
      }
      const marker = buffer[i + 1]!;
      if (marker === 0xd8) {
        i += 2;
        continue;
      }
      if (marker === 0xd9 || marker === 0xda) break;
      const len = buffer.readUInt16BE(i + 2);
      // SOF0..SOF3
      if (marker >= 0xc0 && marker <= 0xc3 && len >= 8) {
        return {
          height: buffer.readUInt16BE(i + 5),
          width: buffer.readUInt16BE(i + 7),
        };
      }
      i += 2 + len;
    }
    throw new AppError(400, 'JPEG inválido');
  }

  if (mime === 'image/webp') {
    // RIFF....WEBP VP8 / VP8L / VP8X
    if (buffer.toString('ascii', 0, 4) !== 'RIFF' || buffer.toString('ascii', 8, 12) !== 'WEBP') {
      throw new AppError(400, 'WEBP inválido');
    }
    const chunk = buffer.toString('ascii', 12, 16);
    if (chunk === 'VP8X' && buffer.length >= 30) {
      const w = 1 + buffer.readUIntLE(24, 3);
      const h = 1 + buffer.readUIntLE(27, 3);
      return { width: w, height: h };
    }
    if (chunk === 'VP8 ' && buffer.length >= 30) {
      return {
        width: buffer.readUInt16LE(26) & 0x3fff,
        height: buffer.readUInt16LE(28) & 0x3fff,
      };
    }
    if (chunk === 'VP8L' && buffer.length >= 25) {
      const b0 = buffer[21]!;
      const b1 = buffer[22]!;
      const b2 = buffer[23]!;
      const b3 = buffer[24]!;
      const w = 1 + (((b1 & 0x3f) << 8) | b0);
      const h = 1 + (((b3 & 0xf) << 10) | (b2 << 2) | ((b1 & 0xc0) >> 6));
      return { width: w, height: h };
    }
    throw new AppError(400, 'WEBP no soportado');
  }

  throw new AppError(400, 'Formato de imagen no soportado');
}

/**
 * Valida data URL de logo: MIME permitido + exactamente 1:1.
 * Devuelve data URL normalizado (sin espacios).
 */
export function assertSquareLogoDataUrl(raw: string): string {
  if (!raw || typeof raw !== 'string') {
    throw new AppError(400, 'Logo de empresa requerido (imagen 1:1)');
  }
  if (raw.length > MAX_DATA_URL) {
    throw new AppError(400, 'El logo es demasiado grande');
  }
  const { mime, buffer } = decodeDataUrl(raw);
  const { width, height } = imageDimensions(buffer, mime);
  if (!width || !height) {
    throw new AppError(400, 'No se pudo leer el tamaño del logo');
  }
  if (width !== height) {
    throw new AppError(
      400,
      `El logo debe ser cuadrado (1:1). Recibido ${width}×${height}`,
    );
  }
  if (width < 64 || width > 2048) {
    throw new AppError(400, 'El logo debe medir entre 64px y 2048px por lado');
  }
  return `data:${mime};base64,${buffer.toString('base64')}`;
}
