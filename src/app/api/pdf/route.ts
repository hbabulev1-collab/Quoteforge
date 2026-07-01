import { NextResponse } from 'next/server';
import { renderToBuffer, Font } from '@react-pdf/renderer';
import { createElement } from 'react';
import { Document, Page, Text, View, StyleSheet } from '@react-pdf/renderer';

// Register Noto Sans with Cyrillic support
Font.register({
  family: 'NotoSans',
  fonts: [
    {
      src: 'https://fonts.gstatic.com/s/notosans/v36/o-0IIpQlx3QUlC5A4PNr5TRA.woff2',
      fontWeight: 'normal',
    },
    {
      src: 'https://fonts.gstatic.com/s/notosans/v36/o-0NIpQlx3QUlC5A4PNjXhFVadyB1Wk.woff2',
      fontWeight: 'bold',
    },
  ],
});

// Disable font hyphenation
Font.registerHyphenationCallback(word => [word]);

const styles = StyleSheet.create({
  page: {
    fontFamily: 'NotoSans',
    fontSize: 10,
    padding: 40,
    backgroundColor: '#FAFBFC',
    color: '#1F2421',
  },
  // Hazard stripe header
  headerStripe: {
    height: 8,
    backgroundColor: '#FF6B1A',
    marginBottom: 0,
  },
  headerBlock: {
    backgroundColor: '#1F2421',
    padding: '16 24',
    marginBottom: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  brandName: {
    fontSize: 22,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: '#FF6B1A',
    letterSpacing: 1,
  },
  brandSub: {
    fontSize: 8,
    color: '#8B9088',
    marginTop: 3,
    letterSpacing: 0.5,
  },
  docLabel: {
    textAlign: 'right',
  },
  docTitle: {
    fontSize: 14,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: '#FAF8F4',
    letterSpacing: 2,
  },
  docDate: {
    fontSize: 8,
    color: '#8B9088',
    marginTop: 4,
    textAlign: 'right',
  },
  // From/To section
  fromToRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
    paddingBottom: 16,
    borderBottomWidth: 1.5,
    borderBottomColor: '#1F2421',
  },
  fromBlock: {},
  fromLabel: {
    fontSize: 8,
    color: '#5A5F5A',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  fromName: {
    fontSize: 13,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: '#1F2421',
  },
  fromSub: {
    fontSize: 8,
    color: '#5A5F5A',
    marginTop: 2,
  },
  // Parts table
  tableHeader: {
    flexDirection: 'row',
    backgroundColor: '#E8E6E1',
    padding: '6 8',
    marginBottom: 0,
  },
  tableHeaderText: {
    fontSize: 8,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: '#5A5F5A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    padding: '8 8',
    borderBottomWidth: 1,
    borderBottomColor: '#E8E6E1',
  },
  tableRowAlt: {
    backgroundColor: '#F5F4F1',
  },
  colPart: { flex: 3 },
  colMat: { flex: 2 },
  colQty: { flex: 1 },
  colPrice: { flex: 1.5, textAlign: 'right' },
  cellText: {
    fontSize: 9,
    color: '#1F2421',
  },
  cellSubText: {
    fontSize: 7.5,
    color: '#5A5F5A',
    marginTop: 2,
  },
  priceText: {
    fontSize: 9,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: '#C9551A',
    textAlign: 'right',
  },
  // Total section
  totalSection: {
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 2,
    borderTopColor: '#1F2421',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  totalLabel: {
    fontSize: 11,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    color: '#1F2421',
  },
  totalAmount: {
    fontSize: 22,
    fontFamily: 'NotoSans', fontWeight: 'bold',
    color: '#C9551A',
  },
  // Details row
  detailsRow: {
    flexDirection: 'row',
    gap: 24,
    marginTop: 16,
    padding: '10 12',
    backgroundColor: '#E8E6E1',
  },
  detailItem: {
    flex: 1,
  },
  detailLabel: {
    fontSize: 7.5,
    color: '#5A5F5A',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  detailValue: {
    fontSize: 9,
    color: '#1F2421',
    fontFamily: 'NotoSans', fontWeight: 'bold',
  },
  // Footer
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 40,
    right: 40,
    borderTopWidth: 1,
    borderTopColor: '#C7CDD4',
    paddingTop: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  footerText: {
    fontSize: 7.5,
    color: '#8B9088',
    letterSpacing: 0.3,
  },
  noteBox: {
    marginTop: 16,
    padding: '8 10',
    borderLeftWidth: 2,
    borderLeftColor: '#FF6B1A',
    backgroundColor: '#FAF8F4',
  },
  noteText: {
    fontSize: 8,
    color: '#5A5F5A',
    fontStyle: 'italic',
  },
});

function fmt(n: number) {
  return '€' + n.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

interface Part {
  partName?: string;
  materialName?: string;
  qty?: string;
  weight?: string;
  matPrice?: string;
  machTime?: string;
  rate?: string;
  margin?: number;
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

function QuotePDF({ data }: { data: PDFData }) {
  const isBg = data.lang === 'bg';
  const labels = {
    from: isBg ? 'ОТ' : 'FROM',
    for: isBg ? 'ЗА' : 'FOR',
    title: isBg ? 'ОФЕРТА' : 'QUOTATION',
    part: isBg ? 'Детайл' : 'Part',
    material: isBg ? 'Материал' : 'Material',
    qty: isBg ? 'Бр.' : 'Qty',
    price: isBg ? 'Цена' : 'Price',
    total: isBg ? 'ОБЩА ЦЕНА' : 'TOTAL PRICE',
    leadTime: isBg ? 'Срок' : 'Lead time',
    contact: isBg ? 'Контакт' : 'Contact',
    note: isBg
      ? 'Тази оферта е валидна 30 дни. Моля, потвърдете поръчката в писмена форма.'
      : 'This quotation is valid for 30 days. Please confirm your order in writing.',
    footer: isBg
      ? 'QUOTEFORGE — ИНСТРУМЕНТ ЗА ПРОИЗВОДСТВЕНИ ОФЕРТИ'
      : 'QUOTEFORGE — MANUFACTURING QUOTE TOOL',
  };

  return createElement(Document, null,
    createElement(Page, { size: 'A4', style: styles.page },
      // Orange stripe
      createElement(View, { style: styles.headerStripe }),

      // Dark header
      createElement(View, { style: styles.headerBlock },
        createElement(View, null,
          createElement(Text, { style: styles.brandName }, 'QUOTEFORGE'),
          createElement(Text, { style: styles.brandSub }, 'Bulgaria · Manufacturing'),
        ),
        createElement(View, { style: styles.docLabel },
          createElement(Text, { style: styles.docTitle }, labels.title),
          createElement(Text, { style: styles.docDate }, data.date),
        ),
      ),

      // From / For
      createElement(View, { style: styles.fromToRow },
        createElement(View, { style: styles.fromBlock },
          createElement(Text, { style: styles.fromLabel }, labels.from),
          createElement(Text, { style: styles.fromName }, data.company || 'Workshop'),
          createElement(Text, { style: styles.fromSub }, 'Bulgaria · Manufacturing'),
        ),
        data.clientName ? createElement(View, { style: styles.fromBlock },
          createElement(Text, { style: { ...styles.fromLabel, textAlign: 'right' } }, labels.for),
          createElement(Text, { style: { ...styles.fromName, textAlign: 'right' } }, data.clientName),
        ) : null,
      ),

      // Parts table header
      createElement(View, { style: styles.tableHeader },
        createElement(View, { style: styles.colPart },
          createElement(Text, { style: styles.tableHeaderText }, labels.part),
        ),
        createElement(View, { style: styles.colMat },
          createElement(Text, { style: styles.tableHeaderText }, labels.material),
        ),
        createElement(View, { style: styles.colQty },
          createElement(Text, { style: styles.tableHeaderText }, labels.qty),
        ),
        createElement(View, { style: styles.colPrice },
          createElement(Text, { style: { ...styles.tableHeaderText, textAlign: 'right' } }, labels.price),
        ),
      ),

      // Parts rows
      ...data.parts.map((p, idx) =>
        createElement(View, { key: String(idx), style: idx % 2 === 1 ? { ...styles.tableRow, ...styles.tableRowAlt } : styles.tableRow },
          createElement(View, { style: styles.colPart },
            createElement(Text, { style: styles.cellText }, p.partName || `Part ${idx + 1}`),
          ),
          createElement(View, { style: styles.colMat },
            createElement(Text, { style: styles.cellText }, p.materialName || '—'),
          ),
          createElement(View, { style: styles.colQty },
            createElement(Text, { style: styles.cellText }, String(p.qty || 1)),
          ),
          createElement(View, { style: styles.colPrice },
            createElement(Text, { style: styles.priceText }, fmt(p.total || 0)),
          ),
        )
      ),

      // Total
      createElement(View, { style: styles.totalSection },
        createElement(Text, { style: styles.totalLabel }, labels.total),
        createElement(Text, { style: styles.totalAmount }, fmt(data.grandTotal)),
      ),

      // Details
      createElement(View, { style: styles.detailsRow },
        data.leadTime ? createElement(View, { style: styles.detailItem },
          createElement(Text, { style: styles.detailLabel }, labels.leadTime),
          createElement(Text, { style: styles.detailValue }, data.leadTime),
        ) : null,
        data.contact ? createElement(View, { style: styles.detailItem },
          createElement(Text, { style: styles.detailLabel }, labels.contact),
          createElement(Text, { style: styles.detailValue }, data.contact),
        ) : null,
      ),

      // Note
      createElement(View, { style: styles.noteBox },
        createElement(Text, { style: styles.noteText }, labels.note),
      ),

      // Footer
      createElement(View, { style: styles.footer },
        createElement(Text, { style: styles.footerText }, labels.footer),
        createElement(Text, { style: styles.footerText }, `Doc: QF-${Date.now().toString(36).toUpperCase()}`),
      ),
    )
  );
}

export async function POST(request: Request) {
  try {
    const data: PDFData = await request.json();

    const buffer = await renderToBuffer(createElement(QuotePDF, { data }) as any);

    const company = (data.company || 'quote').replace(/[^a-zA-Z0-9]/g, '_');
    const filename = `quote_${company}_${data.lang}.pdf`;

    return new NextResponse(new Uint8Array(buffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('PDF generation error:', error);
    return NextResponse.json({ error: 'PDF generation failed' }, { status: 500 });
  }
}
