/**
 * Invoice Generation Service
 * Generates PDF invoices matching the dashboard invoice design
 */

const PDFDocument = require('pdfkit');

/**
 * Generate an invoice PDF as a Buffer - matches dashboard InvoicePage design
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
        eventName = '',
        eventType = '',
        eventDate = '',
        eventLocation = '',
        subtotal = 0,
        platformFee = 0,
        taxRate = 0.13,
        taxAmount = 0,
        totalAmount = 0,
        paymentMethod = 'Credit Card',
        paymentDate = new Date().toLocaleDateString('en-CA'),
        transactionId = '',
        isPaid = true,
        platformName = 'PlanBeau',
        platformUrl = 'planbeau.com'
      } = invoiceData;
      
      // Colors matching dashboard theme
      const primaryGreen = '#166534';
      const accentGold = '#92400e';
      const textDark = '#222222';
      const textMuted = '#6b7280';
      const borderColor = '#e5e7eb';
      const bgLight = '#f9fafb';
      
      let yPos = 50;
      
      // Logo and Header Section
      doc.fontSize(24)
         .fillColor(primaryGreen)
         .font('Helvetica-Bold')
         .text('planbeau', 50, yPos);
      
      doc.fontSize(10)
         .fillColor(textMuted)
         .font('Helvetica')
         .text('Event Booking Platform', 50, yPos + 28);
      
      // Invoice title (right side)
      doc.fontSize(28)
         .fillColor(textDark)
         .font('Helvetica-Bold')
         .text('INVOICE', 350, yPos, { align: 'right' });
      
      doc.fontSize(10)
         .fillColor(textMuted)
         .font('Helvetica')
         .text(`#${invoiceNumber}`, 350, yPos + 32, { align: 'right' });
      
      // Status badge
      yPos += 50;
      const statusText = isPaid ? 'PAID' : 'PENDING';
      const statusBg = isPaid ? '#dcfce7' : '#fef3c7';
      const statusColor = isPaid ? primaryGreen : accentGold;
      
      doc.roundedRect(480, yPos, 70, 22, 11)
         .fill(statusBg);
      doc.fontSize(10)
         .fillColor(statusColor)
         .font('Helvetica-Bold')
         .text(statusText, 480, yPos + 6, { width: 70, align: 'center' });
      
      yPos += 50;
      
      // Three column header: Bill To | Service Provider | Invoice Details
      const col1X = 50;
      const col2X = 220;
      const col3X = 390;
      
      doc.fontSize(9)
         .fillColor(textMuted)
         .font('Helvetica-Bold')
         .text('BILL TO', col1X, yPos)
         .text('SERVICE PROVIDER', col2X, yPos)
         .text('INVOICE DETAILS', col3X, yPos);
      
      yPos += 18;
      
      doc.fontSize(11)
         .fillColor(textDark)
         .font('Helvetica-Bold')
         .text(clientName, col1X, yPos)
         .text(vendorName, col2X, yPos);
      
      doc.fontSize(10)
         .fillColor(textMuted)
         .font('Helvetica');
      
      yPos += 16;
      if (clientEmail) doc.text(clientEmail, col1X, yPos);
      
      doc.fontSize(10)
         .fillColor(textDark)
         .font('Helvetica')
         .text(`Issue Date: ${invoiceDate}`, col3X, yPos - 16)
         .text(`Due Date: ${invoiceDate}`, col3X, yPos);
      
      if (isPaid) {
        yPos += 14;
        doc.text(`Paid On: ${paymentDate}`, col3X, yPos);
      }
      
      yPos += 40;
      
      // Event Details Section (if available)
      if (eventName || eventDate || eventLocation) {
        doc.fontSize(11)
           .fillColor(textDark)
           .font('Helvetica-Bold')
           .text('Event Details', 50, yPos);
        
        yPos += 20;
        
        // Event details grid
        doc.fontSize(10)
           .font('Helvetica');
        
        if (eventName) {
          doc.fillColor(textMuted).text('Event:', 60, yPos);
          doc.fillColor(primaryGreen).text(eventName, 130, yPos);
          yPos += 16;
        }
        if (eventType) {
          doc.fillColor(textMuted).text('Type:', 60, yPos);
          doc.fillColor(textDark).text(eventType, 130, yPos);
          yPos += 16;
        }
        if (eventDate) {
          doc.fillColor(textMuted).text('Date:', 60, yPos);
          doc.fillColor(textDark).text(eventDate, 130, yPos);
          yPos += 16;
        }
        if (eventLocation) {
          doc.fillColor(textMuted).text('Location:', 60, yPos);
          doc.fillColor(primaryGreen).text(eventLocation, 130, yPos, { width: 380 });
          yPos += 16;
        }
        
        yPos += 20;
      }
      
      // Services & Charges Section
      doc.fontSize(11)
         .fillColor(textDark)
         .font('Helvetica-Bold')
         .text('Services & Charges', 50, yPos);
      
      yPos += 20;
      
      // Table header
      doc.rect(50, yPos, 512, 25)
         .fill(bgLight);
      
      doc.fontSize(9)
         .fillColor(textMuted)
         .font('Helvetica-Bold')
         .text('DESCRIPTION', 60, yPos + 8)
         .text('QTY', 280, yPos + 8, { align: 'center', width: 50 })
         .text('UNIT PRICE', 340, yPos + 8, { align: 'right', width: 80 })
         .text('AMOUNT', 440, yPos + 8, { align: 'right', width: 80 });
      
      yPos += 35;
      
      // Service line item
      doc.fontSize(10)
         .fillColor(textDark)
         .font('Helvetica')
         .text(serviceName || 'Service', 60, yPos)
         .text('1', 280, yPos, { align: 'center', width: 50 })
         .text(`$${subtotal.toFixed(2)}`, 340, yPos, { align: 'right', width: 80 })
         .text(`$${subtotal.toFixed(2)}`, 440, yPos, { align: 'right', width: 80 });
      
      yPos += 40;
      
      // Divider
      doc.moveTo(50, yPos).lineTo(562, yPos).strokeColor(borderColor).stroke();
      
      yPos += 20;
      
      // Totals section (right aligned)
      const totalsLabelX = 380;
      const totalsValueX = 480;
      
      doc.fontSize(10)
         .fillColor(textMuted)
         .font('Helvetica')
         .text('Subtotal', totalsLabelX, yPos);
      doc.fillColor(textDark)
         .text(`$${subtotal.toFixed(2)}`, totalsValueX, yPos, { align: 'right', width: 82 });
      
      yPos += 18;
      
      if (platformFee > 0) {
        doc.fillColor(textMuted)
           .text('Platform Service Fee', totalsLabelX, yPos);
        doc.fillColor(textDark)
           .text(`$${platformFee.toFixed(2)}`, totalsValueX, yPos, { align: 'right', width: 82 });
        yPos += 18;
      }
      
      const taxLabel = taxRate === 0.13 ? 'Tax (HST 13%)' : `Tax (${(taxRate * 100).toFixed(1)}%)`;
      doc.fillColor(textMuted)
         .text(taxLabel, totalsLabelX, yPos);
      doc.fillColor(textDark)
         .text(`$${taxAmount.toFixed(2)}`, totalsValueX, yPos, { align: 'right', width: 82 });
      
      yPos += 25;
      
      // Total row
      doc.fontSize(11)
         .fillColor(textDark)
         .font('Helvetica-Bold')
         .text('Total', totalsLabelX, yPos);
      doc.text(`$${totalAmount.toFixed(2)}`, totalsValueX, yPos, { align: 'right', width: 82 });
      
      if (isPaid) {
        yPos += 20;
        doc.fillColor(primaryGreen)
           .text('Amount Paid', totalsLabelX, yPos);
        doc.text(`$${totalAmount.toFixed(2)}`, totalsValueX, yPos, { align: 'right', width: 82 });
      }
      
      yPos += 40;
      
      // Payment Information
      if (transactionId || paymentMethod) {
        doc.fontSize(11)
           .fillColor(textDark)
           .font('Helvetica-Bold')
           .text('Payment Information', 50, yPos);
        
        yPos += 18;
        
        doc.fontSize(10)
           .font('Helvetica')
           .fillColor(textMuted);
        
        if (paymentMethod) {
          doc.text(`Payment Method: ${paymentMethod}`, 50, yPos);
          yPos += 14;
        }
        if (transactionId) {
          doc.text(`Transaction ID: ${transactionId}`, 50, yPos);
          yPos += 14;
        }
      }
      
      // Footer
      const footerY = doc.page.height - 60;
      
      doc.fontSize(9)
         .fillColor(textMuted)
         .text(`Thank you for using ${platformName}!`, 50, footerY, { align: 'center', width: 512 })
         .text(`Questions? Contact us at support@${platformUrl}`, 50, footerY + 14, { align: 'center', width: 512 });
      
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
