import fs from 'fs';
import path from 'path';

/** Carga PNG/JPG de assets/logos como data URL (seed / bootstrap). */
export function loadLogoDataUrl(filename: string): string {
  const candidates = [
    path.join(__dirname, '../../assets/logos', filename),
    path.join(process.cwd(), 'assets/logos', filename),
    path.join(process.cwd(), 'dist/../assets/logos', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) {
      const buf = fs.readFileSync(p);
      const ext = path.extname(p).toLowerCase();
      const mime =
        ext === '.jpg' || ext === '.jpeg'
          ? 'image/jpeg'
          : ext === '.webp'
            ? 'image/webp'
            : 'image/png';
      return `data:${mime};base64,${buf.toString('base64')}`;
    }
  }
  throw new Error(`Logo asset no encontrado: ${filename}`);
}
