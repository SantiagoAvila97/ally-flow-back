/**
 * Cliente / tenant del SaaS Ally Flow.
 * Una sola app sirve a N empresas; el aislamiento es por empresaId.
 */
export interface Empresa {
  id: string;
  nombre: string;
  slug: string;
}
