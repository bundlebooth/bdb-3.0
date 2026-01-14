/**
 * Invoice Generation Service
 * Generates PDF invoices for payment confirmations
 */

const PDFDocument = require('pdfkit');

/**
 * Generate an invoice PDF as a Buffer
 * @param {Object} invoiceData - Invoice data
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateInvoicePDF(invoiceData) {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ 
        size: 'LETTER',
        margin: 50
      });
      
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
      
      const {
        invoiceNumber = `INV-${Date.now()}`,
        invoiceDate = new Date().toLocaleDateString('en-CA'),
        vendorName = 'Vendor',
        vendorEmail = '',
        vendorPhone = '',
        vendorAddress = '',
        clientName = 'Client',
        clientEmail = '',
        clientPhone = '',
        serviceName = 'Service',
        serviceDescription = '',
        eventDate = '',
        eventLocation = '',
        subtotal = 0,
        taxRate = 0.13,
        taxAmount = 0,
        totalAmount = 0,
        paymentMethod = 'Credit Card',
        paymentDate = new Date().toLocaleDateString('en-CA'),
        transactionId = '',
        platformName = 'PlanBeau',
        platformUrl = 'planbeau.com'
      } = invoiceData;
      
      // Colors
      const primaryColor = '#667eea';
      const secondaryColor = '#764ba2';
      const textColor = '#333333';
      const lightGray = '#f8f9fa';
      
      // Header with gradient-like effect
      doc.rect(0, 0, doc.page.width, 120)
         .fill(primaryColor);
      
      // Platform name
      doc.fontSize(28)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text(platformName, 50, 40);
      
      doc.fontSize(12)
         .fillColor('rgba(255,255,255,0.9)')
         .font('Helvetica')
         .text('Payment Invoice', 50, 75);
      
      // Invoice number and date (right side)
      doc.fontSize(10)
         .fillColor('white')
         .text(`Invoice #: ${invoiceNumber}`, 400, 40, { align: 'right' })
         .text(`Date: ${invoiceDate}`, 400, 55, { align: 'right' })
         .text(`Payment Date: ${paymentDate}`, 400, 70, { align: 'right' });
      
      // Reset position
      let yPos = 150;
      
      // Bill To / From section
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('BILLED TO:', 50, yPos);
      
      doc.fontSize(10)
         .fillColor(primaryColor)
         .text('SERVICE PROVIDED BY:', 300, yPos);
      
      yPos += 20;
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text(clientName, 50, yPos)
         .text(vendorName, 300, yPos);
      
      yPos += 15;
      
      doc.font('Helvetica')
         .text(clientEmail || '', 50, yPos)
         .text(vendorEmail || '', 300, yPos);
      
      yPos += 15;
      
      if (clientPhone) {
        doc.text(clientPhone, 50, yPos);
      }
      if (vendorPhone) {
        doc.text(vendorPhone, 300, yPos);
      }
      
      yPos += 40;
      
      // Service Details Header
      doc.rect(50, yPos, 512, 25)
         .fill(lightGray);
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica-Bold')
         .text('DESCRIPTION', 60, yPos + 7)
         .text('AMOUNT', 480, yPos + 7, { align: 'right' });
      
      yPos += 35;
      
      // Service line item
      doc.font('Helvetica-Bold')
         .fontSize(11)
         .fillColor(textColor)
         .text(serviceName, 60, yPos);
      
      doc.font('Helvetica')
         .fontSize(10)
         .text(`$${subtotal.toFixed(2)}`, 400, yPos, { align: 'right', width: 112 });
      
      yPos += 18;
      
      if (serviceDescription) {
        doc.fontSize(9)
           .fillColor('#666666')
           .text(serviceDescription, 60, yPos, { width: 350 });
        yPos += 15;
      }
      
      if (eventDate) {
        doc.fontSize(9)
           .fillColor('#666666')
           .text(`Event Date: ${eventDate}`, 60, yPos);
        yPos += 12;
      }
      
      if (eventLocation) {
        doc.fontSize(9)
           .text(`Location: ${eventLocation}`, 60, yPos);
        yPos += 12;
      }
      
      yPos += 30;
      
      // Divider line
      doc.moveTo(50, yPos)
         .lineTo(562, yPos)
         .strokeColor('#e9ecef')
         .stroke();
      
      yPos += 20;
      
      // Totals section
      const totalsX = 380;
      
      doc.fontSize(10)
         .fillColor(textColor)
         .font('Helvetica')
         .text('Subtotal:', totalsX, yPos)
         .text(`$${subtotal.toFixed(2)}`, 480, yPos, { align: 'right', width: 82 });
      
      yPos += 18;
      
      const taxLabel = taxRate === 0.13 ? 'HST (13%)' : `Tax (${(taxRate * 100).toFixed(1)}%)`;
      doc.text(taxLabel + ':', totalsX, yPos)
         .text(`$${taxAmount.toFixed(2)}`, 480, yPos, { align: 'right', width: 82 });
      
      yPos += 25;
      
      // Total box
      doc.rect(totalsX - 10, yPos - 5, 192, 30)
         .fill(primaryColor);
      
      doc.fontSize(12)
         .fillColor('white')
         .font('Helvetica-Bold')
         .text('TOTAL PAID:', totalsX, yPos + 3)
         .text(`$${totalAmount.toFixed(2)}`, 480, yPos + 3, { align: 'right', width: 82 });
      
      yPos += 50;
      
      // Payment Information
      doc.fontSize(10)
         .fillColor(primaryColor)
         .font('Helvetica-Bold')
         .text('PAYMENT INFORMATION', 50, yPos);
      
      yPos += 20;
      
      doc.fontSize(9)
         .fillColor(textColor)
         .font('Helvetica')
         .text(`Payment Method: ${paymentMethod}`, 50, yPos);
      
      yPos += 15;
      
      if (transactionId) {
        doc.text(`Transaction ID: ${transactionId}`, 50, yPos);
        yPos += 15;
      }
      
      doc.text(`Status: PAID`, 50, yPos);
      
      // Footer
      const footerY = doc.page.height - 80;
      
      doc.fontSize(9)
         .fillColor('#999999')
         .text(`Thank you for using ${platformName}!`, 50, footerY, { align: 'center', width: 512 })
         .text(`Questions? Contact us at support@${platformUrl}`, 50, footerY + 15, { align: 'center', width: 512 })
         .text(`© ${new Date().getFullYear()} ${platformName}. All rights reserved.`, 50, footerY + 30, { align: 'center', width: 512 });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate invoice data from booking/payment information
 * @param {Object} paymentData - Payment and booking data
 * @returns {Object} - Formatted invoice data
 */
function formatInvoiceData(paymentData) {
  const {
    bookingId,
    vendorName,
    vendorEmail,
    vendorPhone,
    vendorAddress,
    clientName,
    clientEmail,
    clientPhone,
    serviceName,
    serviceDescription,
    eventDate,
    eventLocation,
    amount,
    taxRate = 0.13,
    paymentMethod = 'Credit Card',
    transactionId,
    paymentDate
  } = paymentData;
  
  const subtotal = parseFloat(amount) / (1 + taxRate);
  const taxAmount = parseFloat(amount) - subtotal;
  
  return {
    invoiceNumber: `INV-${bookingId || Date.now()}`,
    invoiceDate: new Date().toLocaleDateString('en-CA'),
    vendorName,
    vendorEmail,
    vendorPhone,
    vendorAddress,
    clientName,
    clientEmail,
    clientPhone,
    serviceName,
    serviceDescription,
    eventDate,
    eventLocation,
    subtotal,
    taxRate,
    taxAmount,
    totalAmount: parseFloat(amount),
    paymentMethod,
    paymentDate: paymentDate || new Date().toLocaleDateString('en-CA'),
    transactionId,
    platformName: process.env.PLATFORM_NAME || 'PlanBeau',
    platformUrl: process.env.PLATFORM_URL || 'planbeau.com'
  };
}

module.exports = {
  generateInvoicePDF,
  formatInvoiceData
};
