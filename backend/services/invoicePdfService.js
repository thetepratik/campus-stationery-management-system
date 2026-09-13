const PDFDocument = require('pdfkit');

/**
 * Streams a professional-looking invoice PDF for a Sale directly to the
 * HTTP response. Called with an already-populated Sale document.
 */
const streamSaleInvoice = (sale, res) => {
  const doc = new PDFDocument({ size: 'A4', margin: 50 });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `inline; filename="invoice-${sale.saleId}.pdf"`);
  doc.pipe(res);

  const primaryColor = '#4F46E5';
  const mutedColor = '#64748B';
  const borderColor = '#E2E8F0';

  // ---------- Header ----------
  doc.fontSize(20).fillColor(primaryColor).font('Helvetica-Bold').text('Campus Stationery', 50, 50);
  doc.fontSize(9).fillColor(mutedColor).font('Helvetica').text('Inventory & Sales Management System', 50, 74);

  doc.fontSize(16).fillColor('#0F172A').font('Helvetica-Bold').text('INVOICE', 400, 50, { align: 'right' });
  doc.fontSize(10).fillColor(mutedColor).font('Helvetica').text(`Sale ID: ${sale.saleId}`, 400, 72, { align: 'right' });
  doc
    .text(
      `Date: ${new Date(sale.createdAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}`,
      400,
      86,
      { align: 'right' }
    );

  doc.moveTo(50, 115).lineTo(545, 115).strokeColor(borderColor).stroke();

  // ---------- Customer details ----------
  let y = 130;
  doc.fontSize(10).fillColor('#0F172A').font('Helvetica-Bold').text('Billed To', 50, y);
  y += 16;
  doc.font('Helvetica').fillColor(mutedColor);
  doc.text(sale.customerName || 'Walk-in Customer', 50, y);
  y += 14;
  if (sale.rollNumber) {
    doc.text(`Roll No: ${sale.rollNumber}`, 50, y);
    y += 14;
  }
  if (sale.department) {
    doc.text(`Department: ${sale.department}`, 50, y);
    y += 14;
  }

  doc.font('Helvetica-Bold').fillColor('#0F172A').text('Payment Method', 350, 130);
  doc.font('Helvetica').fillColor(mutedColor).text(sale.paymentMethod.toUpperCase(), 350, 146);

  // ---------- Items table ----------
  const tableTop = Math.max(y + 20, 210);
  const colX = { name: 50, qty: 300, price: 360, gst: 420, subtotal: 480 };

  doc.font('Helvetica-Bold').fillColor('#0F172A').fontSize(9);
  doc.text('Item', colX.name, tableTop);
  doc.text('Qty', colX.qty, tableTop);
  doc.text('Price', colX.price, tableTop);
  doc.text('GST %', colX.gst, tableTop);
  doc.text('Subtotal', colX.subtotal, tableTop, { width: 65, align: 'right' });
  doc.moveTo(50, tableTop + 16).lineTo(545, tableTop + 16).strokeColor(borderColor).stroke();

  let rowY = tableTop + 26;
  doc.font('Helvetica').fillColor('#0F172A').fontSize(9);
  sale.items.forEach((item) => {
    doc.text(item.name, colX.name, rowY, { width: 240 });
    doc.text(String(item.quantity), colX.qty, rowY);
    doc.text(`Rs.${item.unitPrice}`, colX.price, rowY);
    doc.text(`${item.gstPercent || 0}%`, colX.gst, rowY);
    doc.text(`Rs.${item.subtotal}`, colX.subtotal, rowY, { width: 65, align: 'right' });
    rowY += 20;
  });

  doc.moveTo(50, rowY + 4).lineTo(545, rowY + 4).strokeColor(borderColor).stroke();

  // ---------- Totals ----------
  rowY += 20;
  doc.font('Helvetica-Bold').fontSize(11);
  doc.text('Total Amount', 360, rowY);
  doc.text(`Rs.${sale.totalAmount}`, colX.subtotal, rowY, { width: 65, align: 'right' });

  if (sale.remarks) {
    rowY += 30;
    doc.font('Helvetica-Bold').fontSize(9).fillColor('#0F172A').text('Remarks', 50, rowY);
    doc.font('Helvetica').fillColor(mutedColor).text(sale.remarks, 50, rowY + 14, { width: 495 });
  }

  // ---------- Footer ----------
  doc
    .fontSize(8)
    .fillColor(mutedColor)
    .font('Helvetica')
    .text('Thank you for shopping with Campus Stationery!', 50, 770, { align: 'center', width: 495 });

  doc.end();
};

module.exports = { streamSaleInvoice };
