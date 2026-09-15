const PDFDocument = require('pdfkit');

const formatDateTimeStr = (date) => {
  if (!date) return '—';
  const d = new Date(date);
  return d.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
};

/**
 * Streams a professional invoice PDF for an Online Order directly to HTTP response.
 * Called with populated Order and optional Payment & ShopSettings documents.
 */
const streamOrderInvoice = (order, payment, res, shopSettings = null) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const safeOrderId = order.orderId || 'ORDER';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${safeOrderId}.pdf"`);
  doc.pipe(res);

  const primaryColor = '#4F46E5';
  const secondaryColor = '#0F172A';
  const mutedColor = '#64748B';
  const borderColor = '#CBD5E1';
  const lightBg = '#F8FAFC';

  const shopName = shopSettings?.shopName || 'Campus Stationery Shop';
  const collegeName = shopSettings?.collegeName || 'College Stationery & Supplies';
  const address = shopSettings?.address || 'Campus Shop Counter';
  const phone = shopSettings?.phone || '';
  const email = shopSettings?.email || '';

  // ---------- Top Brand Header ----------
  doc.rect(40, 40, 515, 65).fill(lightBg).strokeColor(borderColor).stroke();

  doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(shopName.toUpperCase(), 55, 50);
  doc.fontSize(8.5).fillColor(mutedColor).font('Helvetica').text(collegeName, 55, 70);
  const contactParts = [address, phone ? `Tel: ${phone}` : '', email ? `Email: ${email}` : ''].filter(Boolean);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), 55, 83, { width: 320 });
  }

  // Invoice Title block
  doc.fontSize(15).fillColor(secondaryColor).font('Helvetica-Bold').text('TAX INVOICE', 380, 50, { align: 'right' });
  doc.fontSize(9).fillColor(mutedColor).font('Helvetica').text(`Invoice #: INV-${safeOrderId}`, 380, 68, { align: 'right' });
  doc.text(`Date: ${formatDateTimeStr(order.createdAt)}`, 380, 81, { align: 'right' });

  let y = 120;

  // ---------- Order & Customer Metadata Boxes ----------
  const boxWidth = 250;
  const boxHeight = 85;

  // Customer Details Box (Left)
  doc.rect(40, y, boxWidth, boxHeight).strokeColor(borderColor).stroke();
  doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold').text('BILLED TO (STUDENT)', 50, y + 8);
  doc.fontSize(9).fillColor(secondaryColor).font('Helvetica-Bold').text(order.student?.name || 'Student', 50, y + 24);
  doc.font('Helvetica').fillColor(mutedColor);
  let custY = y + 37;
  if (order.student?.rollNumber) {
    doc.text(`Roll No: ${order.student.rollNumber}`, 50, custY);
    custY += 12;
  }
  if (order.student?.department) {
    doc.text(`Department: ${order.student.department}`, 50, custY);
    custY += 12;
  }
  if (order.student?.mobile || order.student?.email) {
    doc.text(`${order.student.mobile || ''} ${order.student.email ? `(${order.student.email})` : ''}`, 50, custY, { width: 230 });
  }

  // Order Details Box (Right)
  doc.rect(305, y, boxWidth, boxHeight).strokeColor(borderColor).stroke();
  doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold').text('ORDER DETAILS', 315, y + 8);
  doc.font('Helvetica').fillColor(mutedColor).fontSize(9);
  doc.text(`Order ID: `, 315, y + 24).font('Helvetica-Bold').fillColor(secondaryColor).text(safeOrderId, 365, y + 24);
  doc.font('Helvetica').fillColor(mutedColor).text(`Status: `, 315, y + 37).font('Helvetica-Bold').fillColor(order.status === 'confirmed' || order.status === 'completed' ? '#16A34A' : '#D97706').text(order.status ? order.status.toUpperCase() : 'PENDING', 365, y + 37);
  doc.font('Helvetica').fillColor(mutedColor).text(`Pickup Time: `, 315, y + 50).font('Helvetica').fillColor(secondaryColor).text(formatDateTimeStr(order.pickupTime), 375, y + 50);
  doc.font('Helvetica').fillColor(mutedColor).text(`Payment: `, 315, y + 63).font('Helvetica-Bold').fillColor(order.paymentStatus === 'paid' ? '#16A34A' : '#DC2626').text(order.paymentStatus ? order.paymentStatus.toUpperCase() : 'PENDING', 365, y + 63);

  y += boxHeight + 15;

  // ---------- Items Table Header ----------
  const col = {
    sr: 45,
    name: 70,
    qty: 320,
    price: 375,
    subtotal: 475,
  };

  doc.rect(40, y, 515, 20).fill(primaryColor);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('#', col.sr, y + 6);
  doc.text('ITEM DESCRIPTION', col.name, y + 6);
  doc.text('QTY', col.qty, y + 6, { width: 40, align: 'center' });
  doc.text('UNIT PRICE', col.price, y + 6, { width: 80, align: 'right' });
  doc.text('TOTAL', col.subtotal, y + 6, { width: 70, align: 'right' });

  y += 20;

  // ---------- Line Items ----------
  const items = Array.isArray(order.items) ? order.items : [];
  let index = 1;
  doc.font('Helvetica').fontSize(8.5).fillColor(secondaryColor);

  items.forEach((item) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(40, y, 515, 18).fill('#F1F5F9');
    }

    doc.fillColor(mutedColor).text(String(index), col.sr, y + 5);
    doc.fillColor(secondaryColor).font('Helvetica').text(item.name || item.product?.name || 'Item', col.name, y + 5, { width: 240 });
    doc.text(String(item.quantity || 1), col.qty, y + 5, { width: 40, align: 'center' });
    doc.text(`Rs. ${(item.unitPrice || 0).toFixed(2)}`, col.price, y + 5, { width: 80, align: 'right' });
    doc.font('Helvetica-Bold').text(`Rs. ${(item.subtotal || item.unitPrice * item.quantity || 0).toFixed(2)}`, col.subtotal, y + 5, { width: 70, align: 'right' });

    y += 18;
    index++;
  });

  doc.moveTo(40, y).lineTo(555, y).strokeColor(borderColor).stroke();
  y += 10;

  // ---------- Summary / Financial Totals ----------
  const subtotal = items.reduce((sum, item) => sum + (item.subtotal || 0), 0);
  const gstAmount = order.gstAmount || 0;
  const discountAmount = order.discountAmount || 0;
  const grandTotal = order.totalAmount || 0;

  // Payment method & Razorpay reference (Left side of summary)
  const payX = 45;
  doc.fontSize(9).font('Helvetica-Bold').fillColor(primaryColor).text('PAYMENT DETAILS', payX, y);
  doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor);
  doc.text(`Method: ${order.paymentMethod ? order.paymentMethod.toUpperCase() : 'RAZORPAY (ONLINE)'}`, payX, y + 14);
  doc.text(`Payment Status: ${order.paymentStatus ? order.paymentStatus.toUpperCase() : 'PENDING'}`, payX, y + 26);
  if (payment?.razorpayPaymentId) {
    doc.text(`Razorpay Payment ID: ${payment.razorpayPaymentId}`, payX, y + 38);
  }
  if (payment?.razorpayOrderId) {
    doc.text(`Razorpay Order ID: ${payment.razorpayOrderId}`, payX, y + 50);
  }

  // Financial summary (Right side of summary)
  const sumLabelX = 350;
  const sumValX = 475;
  const sumValWidth = 70;

  doc.font('Helvetica').fontSize(8.5).fillColor(mutedColor);
  doc.text('Subtotal:', sumLabelX, y);
  doc.font('Helvetica-Bold').fillColor(secondaryColor).text(`Rs. ${subtotal.toFixed(2)}`, sumValX, y, { width: sumValWidth, align: 'right' });

  if (discountAmount > 0) {
    y += 14;
    doc.font('Helvetica').fillColor('#16A34A').text(`Discount ${order.couponCode ? `(${order.couponCode})` : ''}:`, sumLabelX, y);
    doc.font('Helvetica-Bold').text(`- Rs. ${discountAmount.toFixed(2)}`, sumValX, y, { width: sumValWidth, align: 'right' });
  }

  if (gstAmount > 0) {
    y += 14;
    doc.font('Helvetica').fillColor(mutedColor).text('GST / Taxes:', sumLabelX, y);
    doc.font('Helvetica-Bold').fillColor(secondaryColor).text(`Rs. ${gstAmount.toFixed(2)}`, sumValX, y, { width: sumValWidth, align: 'right' });
  }

  y += 16;
  doc.rect(345, y - 3, 210, 22).fill(primaryColor);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('GRAND TOTAL:', sumLabelX, y + 4);
  doc.text(`Rs. ${grandTotal.toFixed(2)}`, sumValX, y + 4, { width: sumValWidth, align: 'right' });

  // ---------- Footer ----------
  const footerY = 760;
  doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).strokeColor(borderColor).stroke();
  doc.fontSize(8).fillColor(mutedColor).font('Helvetica').text('Thank you for choosing Campus Stationery Shop! For questions or pickup support, visit the shop counter.', 40, footerY, {
    align: 'center',
    width: 515,
  });
  doc.text('This is a computer-generated invoice and requires no physical signature.', 40, footerY + 12, {
    align: 'center',
    width: 515,
  });

  doc.end();
};

/**
 * Streams a professional invoice PDF for an Admin Offline Sale directly to HTTP response.
 * Called with populated Sale and optional ShopSettings documents.
 */
const streamSaleInvoice = (sale, res, shopSettings = null) => {
  const doc = new PDFDocument({ size: 'A4', margin: 40 });

  const safeSaleId = sale.saleId || 'SALE';
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="invoice-${safeSaleId}.pdf"`);
  doc.pipe(res);

  const primaryColor = '#4F46E5';
  const secondaryColor = '#0F172A';
  const mutedColor = '#64748B';
  const borderColor = '#CBD5E1';
  const lightBg = '#F8FAFC';

  const shopName = shopSettings?.shopName || 'Campus Stationery Shop';
  const collegeName = shopSettings?.collegeName || 'College Stationery & Supplies';
  const address = shopSettings?.address || 'Campus Shop Counter';
  const phone = shopSettings?.phone || '';
  const email = shopSettings?.email || '';

  // ---------- Header ----------
  doc.rect(40, 40, 515, 65).fill(lightBg).strokeColor(borderColor).stroke();

  doc.fontSize(16).fillColor(primaryColor).font('Helvetica-Bold').text(shopName.toUpperCase(), 55, 50);
  doc.fontSize(8.5).fillColor(mutedColor).font('Helvetica').text(collegeName, 55, 70);
  const contactParts = [address, phone ? `Tel: ${phone}` : '', email ? `Email: ${email}` : ''].filter(Boolean);
  if (contactParts.length > 0) {
    doc.text(contactParts.join(' | '), 55, 83, { width: 320 });
  }

  doc.fontSize(15).fillColor(secondaryColor).font('Helvetica-Bold').text('POS SALE RECEIPT', 380, 50, { align: 'right' });
  doc.fontSize(9).fillColor(mutedColor).font('Helvetica').text(`Invoice #: INV-${safeSaleId}`, 380, 68, { align: 'right' });
  doc.text(`Date: ${formatDateTimeStr(sale.createdAt)}`, 380, 81, { align: 'right' });

  let y = 120;

  // ---------- Customer & Sale Details ----------
  const boxWidth = 250;
  const boxHeight = 70;

  // Customer Box
  doc.rect(40, y, boxWidth, boxHeight).strokeColor(borderColor).stroke();
  doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold').text('CUSTOMER INFORMATION', 50, y + 8);
  doc.fontSize(9).fillColor(secondaryColor).font('Helvetica-Bold').text(sale.customerName || 'Walk-in Customer', 50, y + 24);
  doc.font('Helvetica').fillColor(mutedColor);
  let custY = y + 37;
  if (sale.rollNumber) {
    doc.text(`Roll No: ${sale.rollNumber}`, 50, custY);
    custY += 12;
  }
  if (sale.department) {
    doc.text(`Department: ${sale.department}`, 50, custY);
  }

  // Sale Details Box
  doc.rect(305, y, boxWidth, boxHeight).strokeColor(borderColor).stroke();
  doc.fontSize(9.5).fillColor(primaryColor).font('Helvetica-Bold').text('SALE INFORMATION', 315, y + 8);
  doc.font('Helvetica').fillColor(mutedColor).fontSize(9);
  doc.text(`Sale ID: `, 315, y + 24).font('Helvetica-Bold').fillColor(secondaryColor).text(safeSaleId, 365, y + 24);
  doc.font('Helvetica').fillColor(mutedColor).text(`Status: `, 315, y + 37).font('Helvetica-Bold').fillColor(sale.status === 'reversed' ? '#DC2626' : '#16A34A').text(sale.status === 'reversed' ? 'REVERSED' : 'COMPLETED', 365, y + 37);
  doc.font('Helvetica').fillColor(mutedColor).text(`Payment: `, 315, y + 50).font('Helvetica-Bold').fillColor(secondaryColor).text(sale.paymentMethod ? sale.paymentMethod.toUpperCase() : 'CASH', 365, y + 50);

  y += boxHeight + 15;

  // ---------- Items Table ----------
  const col = {
    sr: 45,
    name: 70,
    qty: 300,
    price: 360,
    gst: 420,
    subtotal: 480,
  };

  doc.rect(40, y, 515, 20).fill(primaryColor);
  doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('#', col.sr, y + 6);
  doc.text('ITEM DESCRIPTION', col.name, y + 6);
  doc.text('QTY', col.qty, y + 6, { width: 40, align: 'center' });
  doc.text('PRICE', col.price, y + 6, { width: 55, align: 'right' });
  doc.text('GST %', col.gst, y + 6, { width: 50, align: 'right' });
  doc.text('SUBTOTAL', col.subtotal, y + 6, { width: 65, align: 'right' });

  y += 20;

  const items = Array.isArray(sale.items) ? sale.items : [];
  let index = 1;
  doc.font('Helvetica').fontSize(8.5).fillColor(secondaryColor);

  items.forEach((item) => {
    const isEven = index % 2 === 0;
    if (isEven) {
      doc.rect(40, y, 515, 18).fill('#F1F5F9');
    }

    doc.fillColor(mutedColor).text(String(index), col.sr, y + 5);
    doc.fillColor(secondaryColor).font('Helvetica').text(item.name || 'Product', col.name, y + 5, { width: 220 });
    doc.text(String(item.quantity || 1), col.qty, y + 5, { width: 40, align: 'center' });
    doc.text(`Rs. ${(item.unitPrice || 0).toFixed(2)}`, col.price, y + 5, { width: 55, align: 'right' });
    doc.text(`${item.gstPercent || 0}%`, col.gst, y + 5, { width: 50, align: 'right' });
    doc.font('Helvetica-Bold').text(`Rs. ${(item.subtotal || 0).toFixed(2)}`, col.subtotal, y + 5, { width: 65, align: 'right' });

    y += 18;
    index++;
  });

  doc.moveTo(40, y).lineTo(555, y).strokeColor(borderColor).stroke();
  y += 10;

  // ---------- Totals & Remarks ----------
  if (sale.remarks) {
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor(primaryColor).text('Remarks:', 45, y);
    doc.font('Helvetica').fillColor(mutedColor).text(sale.remarks, 45, y + 12, { width: 280 });
  }

  const sumLabelX = 350;
  const sumValX = 475;
  const sumValWidth = 70;

  doc.rect(345, y, 210, 22).fill(primaryColor);
  doc.fontSize(10).font('Helvetica-Bold').fillColor('#FFFFFF');
  doc.text('TOTAL AMOUNT:', sumLabelX, y + 6);
  doc.text(`Rs. ${(sale.totalAmount || 0).toFixed(2)}`, sumValX, y + 6, { width: sumValWidth, align: 'right' });

  // If sale was reversed, show audit notice
  if (sale.status === 'reversed') {
    y += 35;
    doc.rect(40, y, 515, 26).fill('#FEE2E2').strokeColor('#FCA5A5').stroke();
    doc.fontSize(8.5).font('Helvetica-Bold').fillColor('#B91C1C').text(`[NOTICE] This sale was reversed on ${formatDateTimeStr(sale.reversedAt)}${sale.reversalReason ? ` (Reason: ${sale.reversalReason})` : ''}.`, 50, y + 8);
  }

  // ---------- Footer ----------
  const footerY = 760;
  doc.moveTo(40, footerY - 10).lineTo(555, footerY - 10).strokeColor(borderColor).stroke();
  doc.fontSize(8).fillColor(mutedColor).font('Helvetica').text('Thank you for shopping with Campus Stationery Shop!', 40, footerY, {
    align: 'center',
    width: 515,
  });
  doc.text('This is a computer-generated POS invoice receipt.', 40, footerY + 12, {
    align: 'center',
    width: 515,
  });

  doc.end();
};

module.exports = { streamOrderInvoice, streamSaleInvoice };
