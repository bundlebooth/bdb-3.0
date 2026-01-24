/**
 * Invoice Generation Service
 * Generates PDF invoices using the SHARED invoice template
 * 
 * This service uses the EXACT SAME HTML template as the frontend dashboard
 * to ensure consistency between email PDF attachments and dashboard display.
 */

const puppeteer = require('puppeteer');
const { generateInvoiceHTML } = require('./sharedInvoiceTemplate');

/**
 * Generate an invoice PDF as a Buffer
 * Uses the SHARED HTML template (same as frontend dashboard) rendered via Puppeteer
 * 
 * @param {Object} invoiceData - Invoice data (same structure as frontend Invoice.js expects)
 * @returns {Promise<Buffer>} - PDF buffer
 */
async function generateInvoicePDF(invoiceData) {
  let browser = null;
  
  try {
    // Generate HTML using the SHARED template (same as frontend)
    const html = generateInvoiceHTML(invoiceData);
    
    // Launch Puppeteer to render HTML to PDF
    browser = await puppeteer.launch({
      headless: 'new',
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    const page = await browser.newPage();
    await page.setContent(html, { waitUntil: 'networkidle0' });
    
    // Generate PDF with settings matching Letter size
    const pdfBuffer = await page.pdf({
      format: 'Letter',
      margin: {
        top: '0.5in',
        right: '0.5in',
        bottom: '0.5in',
        left: '0.5in'
      },
      printBackground: true
    });
    
    return pdfBuffer;
  } catch (error) {
    console.error('[InvoiceService] PDF generation error:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
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

// Also export the shared template functions for use elsewhere
const { generateInvoiceHTML, generateInvoiceContent } = require('./sharedInvoiceTemplate');

module.exports = {
  generateInvoicePDF,
  formatInvoiceData,
  generateInvoiceHTML,
  generateInvoiceContent
};
