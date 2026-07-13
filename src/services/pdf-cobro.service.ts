import PDFDocument from 'pdfkit';
import type { Caso } from '../types/caso';
import {
  hasPlantillaExtras,
  type PlantillaPdfCobro,
} from '../types/plantilla-pdf';

function money(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

/** LETTER: 612×792. Logo arriba a la derecha. */
const PAGE_RIGHT = 612 - 50;
const LOGO_SIZE = 56;
const LOGO_X = PAGE_RIGHT - LOGO_SIZE;
const LOGO_Y = 42;

function dataUrlToBuffer(dataUrl: string | null | undefined): Buffer | null {
  if (!dataUrl) return null;
  const m = /^data:image\/(png|jpeg|jpg|webp);base64,([A-Za-z0-9+/=]+)$/i.exec(dataUrl.trim());
  if (!m?.[2]) return null;
  try {
    return Buffer.from(m[2], 'base64');
  } catch {
    return null;
  }
}

/** Dibuja el logo de la empresa en la esquina superior derecha (si existe). */
function drawEmpresaLogo(
  doc: PDFKit.PDFDocument,
  logoDataUrl: string | null | undefined,
): void {
  const buf = dataUrlToBuffer(logoDataUrl);
  if (!buf) return;
  try {
    doc.image(buf, LOGO_X, LOGO_Y, {
      width: LOGO_SIZE,
      height: LOGO_SIZE,
      fit: [LOGO_SIZE, LOGO_SIZE],
      align: 'center',
      valign: 'center',
    });
  } catch {
    // Logo inválido: no tumba el PDF
  }
}

export interface BuildCobroPdfOptions {
  /** Logo 1:1 de la empresa (data URL). Se coloca arriba a la derecha. */
  logoDataUrl?: string | null;
}

/**
 * PDF de cobro unificado (estilo Full Soluciones / tabla operativa).
 * Color de acento configurable por plantilla; mismos layout para todos los tenants.
 */
export function buildDocumentoCobroPdf(
  caso: Caso,
  plantilla: PlantillaPdfCobro,
  options: BuildCobroPdfOptions = {},
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    renderDocumentoCobro(doc, caso, plantilla, options.logoDataUrl ?? null);
    doc.end();
  });
}

function renderExtrasBlock(
  doc: PDFKit.PDFDocument,
  p: PlantillaPdfCobro,
): void {
  if (!hasPlantillaExtras(p.extras)) return;
  const e = p.extras;
  doc.moveDown(0.8);
  doc
    .fontSize(9)
    .font('Helvetica-Bold')
    .fillColor('#334155')
    .text('Datos adicionales para la aseguradora', { underline: true });
  doc.moveDown(0.3).font('Helvetica').fillColor('#475569');
  if (e.destinatario.trim()) doc.text(`Destinatario: ${e.destinatario}`);
  if (e.codigoProveedor.trim()) doc.text(`Código proveedor: ${e.codigoProveedor}`);
  if (e.notaAdicional.trim()) {
    doc.moveDown(0.2).text(e.notaAdicional, { align: 'justify' });
  }
}

function renderDocumentoCobro(
  doc: PDFKit.PDFDocument,
  caso: Caso,
  p: PlantillaPdfCobro,
  logoDataUrl: string | null,
): void {
  const accent = p.colorAcento || '#0f766e';
  const total = caso.lineasCobro.reduce(
    (s, l) => s + l.cantidad * l.precioUnitario,
    0,
  );
  const headerTextWidth = logoDataUrl ? LOGO_X - 50 - 12 : 512;

  doc.rect(50, 40, 512, 2).fill(accent);

  drawEmpresaLogo(doc, logoDataUrl);

  doc
    .fillColor('#071422')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(p.razonSocial, 50, 55, { width: headerTextWidth });
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`NIT ${p.nit} · ${p.ciudad} · ${p.telefono}`, { width: headerTextWidth })
    .text(p.email, { width: headerTextWidth });

  doc
    .moveDown(1.2)
    .fontSize(14)
    .fillColor(accent)
    .font('Helvetica-Bold')
    .text(p.textoHeader || 'Factura para cobro');

  doc
    .moveDown(0.6)
    .fontSize(10)
    .fillColor('#071422')
    .font('Helvetica')
    .text(`Caso: ${caso.titulo}`)
    .text(`Nº aseguradora: ${caso.numeroAseguradora}`)
    .text(`Aseguradora: ${caso.aseguradora}`)
    .text(`Titular: ${caso.titularNombre}`)
    .text(`Dirección: ${caso.direccion}, ${caso.ciudad}`)
    .text(`Categoría: ${caso.categoriaServicio}`)
    .text(`Fecha: ${new Date().toLocaleDateString('es-CO')}`);

  renderExtrasBlock(doc, p);

  doc.moveDown(1);
  const tableTop = doc.y;
  const cols = [50, 100, 280, 340, 400, 470];
  doc.rect(50, tableTop, 512, 20).fill(accent);
  doc.fillColor('#ffffff').font('Helvetica-Bold').fontSize(9);
  doc.text('#', cols[0]! + 4, tableTop + 6, { width: 40 });
  doc.text('Descripción', cols[1]! + 4, tableTop + 6, { width: 170 });
  doc.text('Und', cols[2]! + 4, tableTop + 6, { width: 50 });
  doc.text('Cant', cols[3]! + 4, tableTop + 6, { width: 50 });
  doc.text('Valor', cols[4]! + 4, tableTop + 6, { width: 60 });
  doc.text('Subtotal', cols[5]! + 4, tableTop + 6, { width: 80 });

  let y = tableTop + 24;
  doc.font('Helvetica').fillColor('#071422');
  caso.lineasCobro.forEach((l, i) => {
    const sub = l.cantidad * l.precioUnitario;
    if (i % 2 === 0) {
      doc.rect(50, y - 4, 512, 18).fill('#f1f5f9');
      doc.fillColor('#071422');
    }
    doc.text(String(i + 1), cols[0]! + 4, y, { width: 40 });
    doc.text(l.nombre, cols[1]! + 4, y, { width: 170 });
    doc.text(l.unidad, cols[2]! + 4, y, { width: 50 });
    doc.text(String(l.cantidad), cols[3]! + 4, y, { width: 50 });
    doc.text(money(l.precioUnitario), cols[4]! + 4, y, { width: 60 });
    doc.text(money(sub), cols[5]! + 4, y, { width: 80 });
    y += 18;
  });

  doc
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor('#071422')
    .text(`Total: ${money(total)}`, 50, y + 16, { align: 'right' });

  doc
    .font('Helvetica')
    .fontSize(8)
    .fillColor('#64748b')
    .text(p.textoFooter, 50, 720, { width: 512, align: 'center' });
}
