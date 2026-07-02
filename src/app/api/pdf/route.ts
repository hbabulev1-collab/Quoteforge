import { NextResponse } from 'next/server';
import { jsPDF } from 'jspdf';
import { PTSANS_BASE64 } from '@/fonts/PTSans-Regular';

interface Part {
  partName?: string;
  materialName?: string;
  qty?: string;
  total?: number;
}

interface PDFData {
  company: string;
  clientName?: string;
  leadTime?: string;
  contact?: string;
  parts: Part[];
  grandTotal: number;
  lang: 'bg' | 'en';
  date: string;
}

function fmt(n: number) {
  return '\u20AC' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export async function POST(request: Request) {
  try {
    const data: PDFData = await request.json();
    const isBg = data.lang === 'bg';

    const doc = new jsPDF({ unit: 'mm', format: 'a4' });

    // Register PT Sans with Cyrillic support
    doc.addFileToVFS('PTSans-Regular.ttf', PTSANS_BASE64);
    doc.addFont('PTSans-Regular.ttf', 'PTSans', 'normal');
    doc.setFont('PTSans', 'normal');

    const W = 210;
    const marginX = 20;
    const contentW = W - marginX * 2;

    // Orange stripe
    doc.setFillColor(255, 107, 26);
    doc.rect(0, 0, W, 6, 'F');

    // Dark header
    doc.setFillColor(31, 36, 33);
    doc.rect(0, 6, W, 28, 'F');

    // Brand name
    doc.setTextColor(255, 107, 26);
    doc.setFontSize(18);
    doc.text('QUOTEFORGE', marginX, 20);

    doc.setTextColor(139, 144, 136);
    doc.setFontSize(8);
    doc.text('Bulgaria \u00B7 Manufacturing', marginX, 26);

    // Doc title
    doc.setTextColor(250, 248, 244);
    doc.setFontSize(13);
    const title = isBg ? 'OFERТА' : 'QUOTATION';
    doc.text(title, W - marginX, 18, { align: 'right' });

    doc.setTextColor(139, 144, 136);
    doc.setFontSize(8);
    doc.text(data.date, W - marginX, 25, { align: 'right' });

    let y = 46;

    // From / For
    doc.setTextColor(90, 95, 90);
    doc.setFontSize(8);
    doc.text(isBg ? 'ОТ' : 'FROM', marginX, y);
    if (data.clientName) {
      doc.text(isBg ? 'ЗА' : 'FOR', W - marginX, y, { align: 'right' });
    }

    y += 5;
    doc.setTextColor(31, 36, 33);
    doc.setFontSize(12);
    doc.text(data.company || (isBg ? 'Работилница' : 'Workshop'), marginX, y);
    if (data.clientName) {
      doc.text(data.clientName, W - marginX, y, { align: 'right' });
    }

    y += 5;
    doc.setTextColor(90, 95, 90);
    doc.setFontSize(8);
    doc.text('Bulgaria \u00B7 Manufacturing', marginX, y);

    y += 8;

    // Divider
    doc.setDrawColor(31, 36, 33);
    doc.setLineWidth(0.6);
    doc.line(marginX, y, W - marginX, y);
    y += 8;

    // Table header
    doc.setFillColor(232, 230, 225);
    doc.rect(marginX, y - 4, contentW, 8, 'F');

    doc.setTextColor(90, 95, 90);
    doc.setFontSize(8);
    const colPart = marginX;
    const colMat = marginX + contentW * 0.42;
    const colQty = marginX + contentW * 0.68;
    const colPrice = W - marginX;

    doc.text(isBg ? 'ДЕTАЙЛ' : 'PART', colPart, y);
    doc.text(isBg ? 'МАТЕРИАЛ' : 'MATERIAL', colMat, y);
    doc.text(isBg ? 'БР.' : 'QTY', colQty, y);
    doc.text(isBg ? 'ЦЕНА' : 'PRICE', colPrice, y, { align: 'right' });
    y += 8;

    // Parts
    data.parts.forEach((p, idx) => {
      if (idx % 2 === 1) {
        doc.setFillColor(245, 244, 241);
        doc.rect(marginX, y - 4, contentW, 8, 'F');
      }

      doc.setTextColor(31, 36, 33);
      doc.setFontSize(9);
      doc.text(p.partName || `Part ${idx + 1}`, colPart, y);
      doc.text(p.materialName || '\u2014', colMat, y);
      doc.text(String(p.qty || 1), colQty, y);

      doc.setTextColor(201, 85, 26);
      doc.text(fmt(p.total || 0), colPrice, y, { align: 'right' });
      y += 8;
    });

    // Total line
    y += 4;
    doc.setDrawColor(31, 36, 33);
    doc.setLineWidth(0.8);
    doc.line(marginX, y, W - marginX, y);
    y += 8;

    doc.setTextColor(31, 36, 33);
    doc.setFontSize(11);
    doc.text(isBg ? 'ОБЩА ЦЕНА' : 'TOTAL PRICE', marginX, y);

    doc.setTextColor(201, 85, 26);
    doc.setFontSize(20);
    doc.text(fmt(data.grandTotal), W - marginX, y, { align: 'right' });
    y += 10;

    // Details strip
    if (data.leadTime || data.contact) {
      doc.setFillColor(232, 230, 225);
      doc.rect(marginX, y, contentW, 14, 'F');
      y += 8;

      doc.setFontSize(7.5);
      let detX = marginX + 4;

      if (data.leadTime) {
        doc.setTextColor(90, 95, 90);
        doc.text(isBg ? 'СРОК' : 'LEAD TIME', detX, y - 3);
        doc.setTextColor(31, 36, 33);
        doc.setFontSize(9);
        doc.text(data.leadTime, detX, y + 2);
        detX += contentW / 2;
      }

      if (data.contact) {
        doc.setFontSize(7.5);
        doc.setTextColor(90, 95, 90);
        doc.text(isBg ? 'КОНТАКТ' : 'CONTACT', detX, y - 3);
        doc.setTextColor(31, 36, 33);
        doc.setFontSize(9);
        doc.text(data.contact, detX, y + 2);
      }
      y += 14;
    }

    // Note
    y += 4;
    doc.setDrawColor(255, 107, 26);
    doc.setLineWidth(1.5);
    doc.line(marginX, y, marginX, y + 10);
    doc.setTextColor(90, 95, 90);
    doc.setFontSize(8);
    const note = isBg
      ? 'Ofertata e validna 30 dni. Potrebtvardete poratchkata pishmeno.'
      : 'This quotation is valid for 30 days. Please confirm your order in writing.';
    doc.text(note, marginX + 4, y + 6);

    // Footer
    doc.setDrawColor(199, 205, 212);
    doc.setLineWidth(0.3);
    doc.line(marginX, 277, W - marginX, 277);
    doc.setTextColor(139, 144, 136);
    doc.setFontSize(7.5);
    const footerText = isBg
      ? 'QUOTEFORGE \u2014 INSTRUMENT ZA PROIZVODSTVENI OFERTI'
      : 'QUOTEFORGE \u2014 MANUFACTURING QUOTE TOOL';
    doc.text(footerText, marginX, 282);
    doc.text(`Doc: QF-${Date.now().toString(36).toUpperCase()}`, W - marginX, 282, { align: 'right' });

    const pdfBuffer = Buffer.from(doc.output('arraybuffer'));
    const company = (data.company || 'quote').replace(/[^a-zA-Z0-9]/g, '_');

    return new NextResponse(new Uint8Array(pdfBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="quote_${company}_${data.lang}.pdf"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}
