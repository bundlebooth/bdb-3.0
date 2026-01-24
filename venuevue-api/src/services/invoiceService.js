/**
 * Invoice Generation Service
 * Generates PDF invoices using PDFKit with styling matching the shared HTML template.
 * 
 * Note: Uses PDFKit for serverless/Render compatibility.
 * The styling closely matches the shared HTML template used by the frontend.
 */

const PDFDocument = require('pdfkit');

/**
 * Generate an invoice PDF as a Buffer
 * Uses PDFKit with styling matching the shared HTML template
 * 
 * @param {Object} invoiceData - Invoice data (same structure as frontend Invoice.js expects)
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
      
      // Extract data matching the shared template structure
      const isPaid = invoiceData.Status === 'paid' || invoiceData.PaymentStatus === 'paid';
      const booking = invoiceData.booking || {};
      const subtotal = parseFloat(invoiceData.Subtotal || invoiceData.Amount || 0);
      const platformFee = parseFloat(invoiceData.PlatformFee || 0);
      const taxAmount = parseFloat(invoiceData.TaxAmount || 0);
      const totalAmount = parseFloat(invoiceData.TotalAmount || invoiceData.Amount || 0);
      
      // Colors matching the shared template
      const primaryGreen = '#166534';
      const textDark = '#222222';
      const textMuted = '#6b7280';
      const borderColor = '#e5e7eb';
      const bgLight = '#f9fafb';
      
      let yPos = 50;
      
      // Header
      doc.fontSize(24).fillColor(primaryGreen).font('Helvetica-Bold').text('planbeau', 50, yPos);
      doc.fontSize(10).fillColor(textMuted).font('Helvetica').text('Event Booking Platform', 50, yPos + 28);
      
      doc.fontSize(28).fillColor(textDark).font('Helvetica-Bold').text('INVOICE', 350, yPos, { align: 'right' });
      doc.fontSize(10).fillColor(textMuted).font('Helvetica').text(`#${invoiceData.InvoiceNumber || `INV-${invoiceData.InvoiceID}`}`, 350, yPos + 32, { align: 'right' });
      
      // Status badge
      yPos += 50;
      const statusText = isPaid ? 'PAID' : 'PENDING';
      const statusBg = isPaid ? '#dcfce7' : '#fef3c7';
      const statusColor = isPaid ? primaryGreen : '#92400e';
      
      doc.roundedRect(480, yPos, 70, 22, 11).fill(statusBg);
      doc.fontSize(10).fillColor(statusColor).font('Helvetica-Bold').text(statusText, 480, yPos + 6, { width: 70, align: 'center' });
      
      yPos += 50;
      
      // Bill To / Service Provider / Invoice Details
      doc.fontSize(9).fillColor(textMuted).font('Helvetica-Bold')
         .text('BILL TO', 50, yPos)
         .text('SERVICE PROVIDER', 220, yPos)
         .text('INVOICE DETAILS', 390, yPos);
      
      yPos += 18;
      doc.fontSize(11).fillColor(textDark).font('Helvetica-Bold')
         .text(booking.ClientName || invoiceData.ClientName || 'Client', 50, yPos)
         .text(booking.VendorName || invoiceData.VendorName || 'Vendor', 220, yPos);
      
      const issueDate = invoiceData.IssueDate ? new Date(invoiceData.IssueDate).toLocaleDateString('en-CA') : new Date().toLocaleDateString('en-CA');
      doc.fontSize(10).fillColor(textDark).font('Helvetica')
         .text(`Issue Date: ${issueDate}`, 390, yPos)
         .text(`Due Date: ${issueDate}`, 390, yPos + 14);
      
      yPos += 16;
      if (booking.ClientEmail || invoiceData.ClientEmail) {
        doc.fontSize(10).fillColor(textMuted).text(booking.ClientEmail || invoiceData.ClientEmail, 50, yPos);
      }
      
      yPos += 40;
      
      // Event Details (if available)
      if (booking.EventDate || booking.EventName || booking.EventLocation) {
        doc.fontSize(11).fillColor(textDark).font('Helvetica-Bold').text('Event Details', 50, yPos);
        yPos += 20;
        doc.fontSize(10).font('Helvetica');
        
        if (booking.EventName) {
          doc.fillColor(textMuted).text('Event:', 60, yPos);
          doc.fillColor(primaryGreen).text(booking.EventName, 130, yPos);
          yPos += 16;
        }
        if (booking.EventDate) {
          doc.fillColor(textMuted).text('Date:', 60, yPos);
          doc.fillColor(textDark).text(new Date(booking.EventDate).toLocaleDateString('en-CA', { year: 'numeric', month: 'long', day: 'numeric' }), 130, yPos);
          yPos += 16;
        }
        if (booking.EventLocation) {
          doc.fillColor(textMuted).text('Location:', 60, yPos);
          doc.fillColor(primaryGreen).text(booking.EventLocation, 130, yPos, { width: 380 });
          yPos += 16;
        }
        yPos += 20;
      }
      
      // Services & Charges
      doc.fontSize(11).fillColor(textDark).font('Helvetica-Bold').text('Services & Charges', 50, yPos);
      yPos += 20;
      
      // Table header
      doc.rect(50, yPos, 512, 25).fill(bgLight);
      doc.fontSize(9).fillColor(textMuted).font('Helvetica-Bold')
         .text('DESCRIPTION', 60, yPos + 8)
         .text('QTY', 280, yPos + 8, { align: 'center', width: 50 })
         .text('UNIT PRICE', 340, yPos + 8, { align: 'right', width: 80 })
         .text('AMOUNT', 440, yPos + 8, { align: 'right', width: 80 });
      
      yPos += 35;
      
      // Render invoice items if available (from database invoice)
      const items = invoiceData.items || [];
      if (items.length > 0) {
        for (const item of items) {
          const itemName = item.Title || item.ServiceName || 'Service';
          const qty = parseFloat(item.Quantity || 1);
          const unitPrice = parseFloat(item.UnitPrice || item.Amount || 0);
          const lineAmount = parseFloat(item.Amount || (qty * unitPrice));
          
          doc.fontSize(10).fillColor(textDark).font('Helvetica')
             .text(itemName, 60, yPos, { width: 200 })
             .text(qty % 1 === 0 ? qty.toString() : qty.toFixed(1), 280, yPos, { align: 'center', width: 50 })
             .text(`$${unitPrice.toFixed(2)}`, 340, yPos, { align: 'right', width: 80 })
             .text(`$${lineAmount.toFixed(2)}`, 440, yPos, { align: 'right', width: 80 });
          
          yPos += 20;
        }
      } else {
        // Fallback: single service line item
        const serviceName = booking.ServiceName || invoiceData.ServiceName || 'Service';
        doc.fontSize(10).fillColor(textDark).font('Helvetica')
           .text(serviceName, 60, yPos)
           .text('1', 280, yPos, { align: 'center', width: 50 })
           .text(`$${subtotal.toFixed(2)}`, 340, yPos, { align: 'right', width: 80 })
           .text(`$${subtotal.toFixed(2)}`, 440, yPos, { align: 'right', width: 80 });
        yPos += 20;
      }
      
      yPos += 20;
      doc.moveTo(50, yPos).lineTo(562, yPos).strokeColor(borderColor).stroke();
      yPos += 20;
      
      // Totals
      const totalsX = 380;
      const valuesX = 480;
      
      doc.fontSize(10).fillColor(textMuted).font('Helvetica').text('Subtotal', totalsX, yPos);
      doc.fillColor(textDark).text(`$${subtotal.toFixed(2)}`, valuesX, yPos, { align: 'right', width: 82 });
      yPos += 18;
      
      if (platformFee > 0) {
        doc.fillColor(textMuted).text('Platform Service Fee', totalsX, yPos);
        doc.fillColor(textDark).text(`$${platformFee.toFixed(2)}`, valuesX, yPos, { align: 'right', width: 82 });
        yPos += 18;
      }
      
      if (taxAmount > 0) {
        // Calculate tax percentage from amounts for display
        const taxableAmount = subtotal + platformFee;
        const taxPercent = taxableAmount > 0 ? Math.round((taxAmount / taxableAmount) * 100) : 13;
        const taxLabel = taxPercent === 13 ? 'Tax (HST 13%)' : `Tax (${taxPercent}%)`;
        doc.fillColor(textMuted).text(taxLabel, totalsX, yPos);
        doc.fillColor(textDark).text(`$${taxAmount.toFixed(2)}`, valuesX, yPos, { align: 'right', width: 82 });
        yPos += 25;
      }
      
      doc.fontSize(11).fillColor(textDark).font('Helvetica-Bold')
         .text('Total', totalsX, yPos)
         .text(`$${totalAmount.toFixed(2)}`, valuesX, yPos, { align: 'right', width: 82 });
      
      if (isPaid) {
        yPos += 20;
        doc.fillColor(primaryGreen).text('Amount Paid', totalsX, yPos).text(`$${totalAmount.toFixed(2)}`, valuesX, yPos, { align: 'right', width: 82 });
      }
      
      // Payment Information
      yPos += 40;
      if (invoiceData.TransactionID || invoiceData.PaymentMethod) {
        doc.fontSize(11).fillColor(textDark).font('Helvetica-Bold').text('Payment Information', 50, yPos);
        yPos += 18;
        doc.fontSize(10).font('Helvetica').fillColor(textMuted);
        if (invoiceData.PaymentMethod) {
          doc.text(`Payment Method: ${invoiceData.PaymentMethod}`, 50, yPos);
          yPos += 14;
        }
        if (invoiceData.TransactionID) {
          doc.text(`Transaction ID: ${invoiceData.TransactionID}`, 50, yPos);
        }
      }
      
      // Footer
      const footerY = doc.page.height - 60;
      doc.fontSize(9).fillColor(textMuted)
         .text('Thank you for using PlanBeau!', 50, footerY, { align: 'center', width: 512 })
         .text('Questions? Contact us at support@planbeau.com', 50, footerY + 14, { align: 'center', width: 512 });
      
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Generate invoice data from booking/payment information
 * Returns data structure matching the SHARED template (sharedInvoiceTemplate.js)
 * which is the same structure used by frontend Invoice.js component
 * 
 * @param {Object} paymentData - Payment and booking data
 * @returns {Object} - Formatted invoice data matching shared template structure
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
    eventName,
    eventType,
    eventDate,
    eventLocation,
    amount,
    subtotal: providedSubtotal,
    platformFee = 0,
    taxRate = 0.13,
    taxAmount: providedTaxAmount,
    paymentMethod = 'Credit Card',
    transactionId,
    paymentDate,
    items = []
  } = paymentData;
  
  // Calculate amounts - match the structure expected by sharedInvoiceTemplate
  const totalAmount = parseFloat(amount) || 0;
  const subtotal = providedSubtotal || (totalAmount / (1 + taxRate));
  const taxAmount = providedTaxAmount || (totalAmount - subtotal - platformFee);
  const currentDate = new Date().toISOString();
  
  // Return structure matching sharedInvoiceTemplate.js expectations
  // This is the SAME structure used by frontend Invoice.js
  return {
    // Invoice identification
    InvoiceID: bookingId,
    InvoiceNumber: `INV-${bookingId || Date.now()}`,
    
    // Dates (ISO format for consistency)
    IssueDate: currentDate,
    DueDate: currentDate,
    PaidAt: paymentDate || currentDate,
    
    // Status
    Status: 'paid',
    PaymentStatus: 'paid',
    
    // Amounts
    Subtotal: subtotal,
    PlatformFee: platformFee,
    TaxAmount: taxAmount,
    TotalAmount: totalAmount,
    
    // Payment info
    PaymentMethod: paymentMethod,
    TransactionID: transactionId,
    
    // Service info
    ServiceName: serviceName,
    
    // Items array (for line items display)
    items: items.length > 0 ? items : [{
      Title: serviceName || 'Service',
      ServiceName: serviceName || 'Service',
      Description: serviceDescription || '',
      Quantity: 1,
      UnitPrice: subtotal,
      Amount: subtotal
    }],
    
    // Booking details (nested object matching frontend structure)
    booking: {
      ClientName: clientName,
      ClientEmail: clientEmail,
      VendorName: vendorName,
      ServiceName: serviceName,
      EventName: eventName || '',
      EventType: eventType || '',
      EventDate: eventDate,
      EventLocation: eventLocation
    },
    
    // Direct client/vendor fields (for backward compatibility)
    ClientName: clientName,
    ClientEmail: clientEmail,
    VendorName: vendorName
  };
}

// Re-export the shared template functions for use elsewhere
const sharedTemplate = require('./sharedInvoiceTemplate');

module.exports = {
  generateInvoicePDF,
  formatInvoiceData,
  generateInvoiceHTML: sharedTemplate.generateInvoiceHTML,
  generateInvoiceContent: sharedTemplate.generateInvoiceContent
};
