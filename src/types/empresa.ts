/**
 * Cliente / tenant del SaaS Ally Flow.
 * Una sola app sirve a N empresas; el aislamiento es por empresaId.
 */
export interface Empresa {
  id: string;
  nombre: string;
  slug: string;
  /** NIT / documento tributario (obligatorio en empresas nuevas). */
  nit: string;
  /** Logo cuadrado 1:1 como data URL (PNG/JPEG/WEBP). */
  logoDataUrl: string | null;
}
