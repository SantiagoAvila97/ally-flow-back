import PDFDocument from 'pdfkit';
import type { Caso } from '../types/caso';
import type { PlantillaPdfCobro } from '../types/plantilla-pdf';

function money(n: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    maximumFractionDigits: 0,
  }).format(n);
}

/**
 * Genera el PDF de cobro según plantilla de la empresa.
 */
export function buildDocumentoCobroPdf(
  caso: Caso,
  plantilla: PlantillaPdfCobro,
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50, size: 'LETTER' });
    const chunks: Buffer[] = [];
    doc.on('data', (c: Buffer) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    if (plantilla.tipoPlantilla === 'carta_siniestro') {
      renderCartaSiniestro(doc, caso, plantilla);
    } else {
      renderTablaOperativa(doc, caso, plantilla);
    }

    doc.end();
  });
}

function renderTablaOperativa(
  doc: PDFKit.PDFDocument,
  caso: Caso,
  p: PlantillaPdfCobro,
): void {
  const accent = p.colorAcento || '#0f766e';
  const total = caso.lineasCobro.reduce(
    (s, l) => s + l.cantidad * l.precioUnitario,
    0,
  );

  doc.rect(50, 40, 512, 6).fill(accent);

  doc
    .fillColor('#071422')
    .fontSize(18)
    .font('Helvetica-Bold')
    .text(p.razonSocial, 50, 55);
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`NIT ${p.nit} · ${p.ciudad} · ${p.telefono}`)
    .text(p.email);

  doc
    .moveDown(1.2)
    .fontSize(14)
    .fillColor(accent)
    .font('Helvetica-Bold')
    .text(p.textoHeader || 'Documento de cobro operativo');

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

function renderCartaSiniestro(
  doc: PDFKit.PDFDocument,
  caso: Caso,
  p: PlantillaPdfCobro,
): void {
  const accent = p.colorAcento || '#1e3a5f';
  const total = caso.lineasCobro.reduce(
    (s, l) => s + l.cantidad * l.precioUnitario,
    0,
  );

  doc
    .fillColor(accent)
    .fontSize(20)
    .font('Helvetica-Bold')
    .text(p.razonSocial, { align: 'center' });
  doc
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#475569')
    .text(`NIT ${p.nit} · ${p.ciudad}`, { align: 'center' })
    .text(`${p.telefono} · ${p.email}`, { align: 'center' });

  doc
    .moveDown(1.5)
    .fontSize(13)
    .fillColor(accent)
    .font('Helvetica-Bold')
    .text(p.textoHeader || 'Liquidacion de honorarios / reclamo', {
      align: 'center',
    });

  doc.moveDown(1.2).fontSize(10).fillColor('#071422').font('Helvetica');
  doc.text('Datos del siniestro / servicio', { underline: true });
  doc.moveDown(0.4);
  doc.text(`Nº siniestro / aseguradora: ${caso.numeroAseguradora}`);
  doc.text(`Aseguradora: ${caso.aseguradora}`);
  doc.text(`Asegurado / titular: ${caso.titularNombre}`);
  doc.text(`Teléfono: ${caso.titularTelefono}`);
  doc.text(`Dirección del servicio: ${caso.direccion}, ${caso.ciudad}`);
  doc.text(`Categoría de servicio: ${caso.categoriaServicio}`);
  doc.text(`Referencia interna: ${caso.id}`);
  doc.text(`Fecha de emisión: ${new Date().toLocaleDateString('es-CO')}`);

  doc.moveDown(1.2).font('Helvetica-Bold').text('Detalle de honorarios');
  doc.moveDown(0.4).font('Helvetica');

  caso.lineasCobro.forEach((l, i) => {
    const sub = l.cantidad * l.precioUnitario;
    doc.text(
      `${i + 1}. ${l.nombre} — ${l.cantidad} ${l.unidad} × ${money(l.precioUnitario)} = ${money(sub)}`,
    );
  });

  doc
    .moveDown(1)
    .font('Helvetica-Bold')
    .fontSize(12)
    .fillColor(accent)
    .text(`Valor total a reclamar: ${money(total)}`);

  doc
    .moveDown(1.5)
    .fontSize(9)
    .font('Helvetica')
    .fillColor('#334155')
    .text(
      'Se solicita a la aseguradora la confirmación de este documento y la gestión del pago correspondiente a los honorarios/servicios descritos.',
      { align: 'justify' },
    );

  doc
    .fontSize(8)
    .fillColor('#64748b')
    .text(p.textoFooter, 50, 720, { width: 512, align: 'center' });
}
