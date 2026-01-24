import React from 'react';
import { formatCurrency, formatDateFormal } from '../../utils/helpers';

/**
 * Centralized Invoice Component
 * Used for both dashboard display and PDF generation
 * Single source of truth for invoice styling and layout
 */
const Invoice = ({ invoice, forPdf = false }) => {
  if (!invoice) return null;

  const isPaid = invoice.Status === 'paid' || invoice.PaymentStatus === 'paid';
  const booking = invoice.booking || {};

  const formatDate = formatDateFormal;

  // Styles that work for both screen and PDF
  const styles = {
    container: {
      fontFamily: 'Arial, sans-serif',
      maxWidth: '800px',
      margin: '0 auto',
      padding: forPdf ? '20px' : '40px',
      background: 'white',
      color: '#222'
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: '40px',
      paddingBottom: '20px',
      borderBottom: '1px solid #e5e7eb'
    },
    branding: {
      display: 'flex',
      flexDirection: 'column'
    },
    logo: {
      height: '48px',
      width: 'auto',
      marginBottom: '8px'
    },
    tagline: {
      color: '#6b7280',
      fontSize: '14px',
      margin: 0
    },
    titleSection: {
      textAlign: 'right'
    },
    title: {
      color: '#222',
      fontSize: '28px',
      fontWeight: 700,
      margin: 0
    },
    invoiceNumber: {
      color: '#6b7280',
      fontSize: '14px',
      marginTop: '4px'
    },
    statusBadge: {
      display: 'inline-block',
      padding: '4px 12px',
      borderRadius: '20px',
      fontSize: '12px',
      fontWeight: 600,
      marginTop: '8px',
      background: isPaid ? '#dcfce7' : '#fef3c7',
      color: isPaid ? '#166534' : '#92400e'
    },
    parties: {
      display: 'grid',
      gridTemplateColumns: 'repeat(3, 1fr)',
      gap: '24px',
      marginBottom: '32px'
    },
    partySection: {
      padding: 0
    },
    partyLabel: {
      fontSize: '12px',
      fontWeight: 600,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      marginBottom: '8px'
    },
    partyName: {
      fontSize: '16px',
      fontWeight: 600,
      color: '#222',
      margin: '0 0 4px 0'
    },
    partyDetail: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '4px 0'
    },
    eventDetails: {
      background: '#f9fafb',
      borderRadius: '8px',
      padding: '20px',
      marginBottom: '32px'
    },
    eventTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#222',
      marginBottom: '16px'
    },
    eventGrid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '12px'
    },
    eventItem: {
      display: 'flex',
      gap: '8px'
    },
    eventLabel: {
      color: '#6b7280',
      fontSize: '14px',
      minWidth: '70px'
    },
    eventValue: {
      color: '#222',
      fontSize: '14px',
      fontWeight: 500
    },
    itemsSection: {
      marginBottom: '32px'
    },
    itemsTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#222',
      marginBottom: '16px'
    },
    table: {
      width: '100%',
      borderCollapse: 'collapse'
    },
    tableHeader: {
      background: '#f9fafb',
      borderBottom: '1px solid #e5e7eb'
    },
    th: {
      padding: '12px 16px',
      fontSize: '12px',
      fontWeight: 600,
      color: '#6b7280',
      textTransform: 'uppercase',
      letterSpacing: '0.5px',
      textAlign: 'left'
    },
    thRight: {
      textAlign: 'right'
    },
    thCenter: {
      textAlign: 'center'
    },
    td: {
      padding: '16px',
      fontSize: '14px',
      color: '#374151',
      borderBottom: '1px solid #e5e7eb'
    },
    tdRight: {
      textAlign: 'right'
    },
    tdCenter: {
      textAlign: 'center'
    },
    itemTitle: {
      fontWeight: 500,
      color: '#222'
    },
    itemDesc: {
      fontSize: '13px',
      color: '#6b7280',
      marginTop: '4px'
    },
    totalsSection: {
      display: 'flex',
      justifyContent: 'flex-end',
      marginTop: '24px'
    },
    totalsTable: {
      width: '300px'
    },
    totalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: '14px'
    },
    totalLabel: {
      color: '#6b7280'
    },
    totalValue: {
      color: '#222',
      fontWeight: 500
    },
    grandTotalRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '12px 0',
      fontSize: '16px',
      fontWeight: 600,
      borderTop: '2px solid #e5e7eb',
      marginTop: '8px'
    },
    paidRow: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '8px 0',
      fontSize: '14px',
      color: '#166534',
      fontWeight: 600
    },
    paymentInfo: {
      marginTop: '32px',
      padding: '20px',
      background: '#f9fafb',
      borderRadius: '8px'
    },
    paymentTitle: {
      fontSize: '14px',
      fontWeight: 600,
      color: '#222',
      marginBottom: '12px'
    },
    paymentDetail: {
      fontSize: '14px',
      color: '#6b7280',
      margin: '4px 0'
    },
    footer: {
      marginTop: '40px',
      paddingTop: '20px',
      borderTop: '1px solid #e5e7eb',
      textAlign: 'center',
      color: '#6b7280',
      fontSize: '13px'
    }
  };

  const subtotal = parseFloat(invoice.Subtotal || invoice.Amount || 0);
  const platformFee = parseFloat(invoice.PlatformFee || 0);
  const taxAmount = parseFloat(invoice.TaxAmount || 0);
  const totalAmount = parseFloat(invoice.TotalAmount || invoice.Amount || 0);

  return (
    <div style={styles.container} className="invoice-content">
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.branding}>
          <img 
            src={forPdf ? 'https://www.planbeau.com/images/logo.png' : '/images/logo.png'}
            alt="Planbeau" 
            style={styles.logo}
          />
          <p style={styles.tagline}>Event Booking Platform</p>
        </div>
        <div style={styles.titleSection}>
          <h2 style={styles.title}>INVOICE</h2>
          <div style={styles.invoiceNumber}>
            #{invoice.InvoiceNumber || `INV-${invoice.InvoiceID}`}
          </div>
          <div style={styles.statusBadge}>
            {isPaid ? 'PAID' : 'PENDING'}
          </div>
        </div>
      </div>

      {/* Parties */}
      <div style={styles.parties}>
        <div style={styles.partySection}>
          <div style={styles.partyLabel}>Bill To</div>
          <p style={styles.partyName}>{booking.ClientName || invoice.ClientName || 'Client'}</p>
          <p style={styles.partyDetail}>{booking.ClientEmail || invoice.ClientEmail || ''}</p>
        </div>
        <div style={styles.partySection}>
          <div style={styles.partyLabel}>Service Provider</div>
          <p style={styles.partyName}>{booking.VendorName || invoice.VendorName || 'Vendor'}</p>
        </div>
        <div style={styles.partySection}>
          <div style={styles.partyLabel}>Invoice Details</div>
          <p style={styles.partyDetail}><strong>Issue Date:</strong> {formatDate(invoice.IssueDate)}</p>
          <p style={styles.partyDetail}><strong>Due Date:</strong> {formatDate(invoice.DueDate || invoice.IssueDate)}</p>
          {isPaid && invoice.PaidAt && (
            <p style={styles.partyDetail}><strong>Paid On:</strong> {formatDate(invoice.PaidAt)}</p>
          )}
        </div>
      </div>

      {/* Event Details */}
      {booking.EventDate && (
        <div style={styles.eventDetails}>
          <div style={styles.eventTitle}>Event Details</div>
          <div style={styles.eventGrid}>
            {booking.EventName && (
              <div style={styles.eventItem}>
                <span style={styles.eventLabel}>Event:</span>
                <span style={{...styles.eventValue, color: '#166534'}}>{booking.EventName}</span>
              </div>
            )}
            {booking.EventType && (
              <div style={styles.eventItem}>
                <span style={styles.eventLabel}>Type:</span>
                <span style={styles.eventValue}>{booking.EventType}</span>
              </div>
            )}
            <div style={styles.eventItem}>
              <span style={styles.eventLabel}>Date:</span>
              <span style={styles.eventValue}>{formatDate(booking.EventDate)}</span>
            </div>
            {booking.EventLocation && (
              <div style={styles.eventItem}>
                <span style={styles.eventLabel}>Location:</span>
                <span style={{...styles.eventValue, color: '#166534'}}>{booking.EventLocation}</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Services & Charges */}
      <div style={styles.itemsSection}>
        <div style={styles.itemsTitle}>Services & Charges</div>
        <table style={styles.table}>
          <thead style={styles.tableHeader}>
            <tr>
              <th style={styles.th}>Description</th>
              <th style={{...styles.th, ...styles.thCenter}}>Qty</th>
              <th style={{...styles.th, ...styles.thRight}}>Unit Price</th>
              <th style={{...styles.th, ...styles.thRight}}>Amount</th>
            </tr>
          </thead>
          <tbody>
            {invoice.items && invoice.items.length > 0 ? (
              invoice.items.map((item, idx) => (
                <tr key={idx}>
                  <td style={styles.td}>
                    <div style={styles.itemTitle}>{item.Title || item.ServiceName || 'Service'}</div>
                    {item.Description && <div style={styles.itemDesc}>{item.Description}</div>}
                  </td>
                  <td style={{...styles.td, ...styles.tdCenter}}>{item.Quantity || 1}</td>
                  <td style={{...styles.td, ...styles.tdRight}}>{formatCurrency(item.UnitPrice || item.Amount)}</td>
                  <td style={{...styles.td, ...styles.tdRight}}>{formatCurrency(item.Amount || item.UnitPrice)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td style={styles.td}>
                  <div style={styles.itemTitle}>{booking.ServiceName || invoice.ServiceName || 'Service'}</div>
                </td>
                <td style={{...styles.td, ...styles.tdCenter}}>1</td>
                <td style={{...styles.td, ...styles.tdRight}}>{formatCurrency(subtotal)}</td>
                <td style={{...styles.td, ...styles.tdRight}}>{formatCurrency(subtotal)}</td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Totals */}
        <div style={styles.totalsSection}>
          <div style={styles.totalsTable}>
            <div style={styles.totalRow}>
              <span style={styles.totalLabel}>Subtotal</span>
              <span style={styles.totalValue}>{formatCurrency(subtotal)}</span>
            </div>
            {platformFee > 0 && (
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Platform Service Fee</span>
                <span style={styles.totalValue}>{formatCurrency(platformFee)}</span>
              </div>
            )}
            {taxAmount > 0 && (
              <div style={styles.totalRow}>
                <span style={styles.totalLabel}>Tax (HST 13%)</span>
                <span style={styles.totalValue}>{formatCurrency(taxAmount)}</span>
              </div>
            )}
            <div style={styles.grandTotalRow}>
              <span>Total</span>
              <span>{formatCurrency(totalAmount)}</span>
            </div>
            {isPaid && (
              <div style={styles.paidRow}>
                <span>Amount Paid</span>
                <span>{formatCurrency(totalAmount)}</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Payment Information */}
      {(invoice.PaymentMethod || invoice.TransactionID) && (
        <div style={styles.paymentInfo}>
          <div style={styles.paymentTitle}>Payment Information</div>
          {invoice.PaymentMethod && (
            <p style={styles.paymentDetail}>Payment Method: {invoice.PaymentMethod}</p>
          )}
          {invoice.TransactionID && (
            <p style={styles.paymentDetail}>Transaction ID: {invoice.TransactionID}</p>
          )}
        </div>
      )}

      {/* Footer */}
      <div style={styles.footer}>
        <p>Thank you for using PlanBeau!</p>
        <p>Questions? Contact us at support@planbeau.com</p>
      </div>
    </div>
  );
};

export default Invoice;
