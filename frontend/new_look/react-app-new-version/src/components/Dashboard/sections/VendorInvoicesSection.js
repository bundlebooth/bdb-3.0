import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';

function VendorInvoicesSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [vendorProfileId, setVendorProfileId] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortKey, setSortKey] = useState('date');
  const [sortDir, setSortDir] = useState('desc');

  useEffect(() => {
    getVendorProfileId();
  }, [currentUser]);

  useEffect(() => {
    if (vendorProfileId) {
      loadInvoices();
    }
  }, [vendorProfileId]);

  const getVendorProfileId = async () => {
    if (!currentUser?.id) return;
    try {
      const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendorProfileId(data.vendorProfileId);
      }
    } catch (error) {
      console.error('Error getting vendor profile:', error);
    }
  };

  const loadInvoices = useCallback(async () => {
    if (!vendorProfileId) return;
    
    try {
      setLoading(true);
      // Primary: fetch invoices directly
      const resp1 = await fetch(`${API_BASE_URL}/invoices/vendor/${vendorProfileId}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (resp1.ok) {
        const data = await resp1.json();
        setInvoices(Array.isArray(data?.invoices) ? data.invoices : []);
      } else {
        // Fallback: legacy bookings-based list
        const resp = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/bookings/all`, {
          headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
        });
        if (resp.ok) {
          const bookings = await resp.json();
          const accepted = (Array.isArray(bookings) ? bookings : []).filter(b => {
            const s = (b.Status || '').toString().toLowerCase();
            return s === 'confirmed' || s === 'paid' || s === 'approved';
          }).sort((a,b) => new Date(b.EventDate) - new Date(a.EventDate));
          setInvoices(accepted);
        } else {
          setInvoices([]);
        }
      }
    } catch (error) {
      console.error('Error loading invoices:', error);
      setInvoices([]);
    } finally {
      setLoading(false);
    }
  }, [vendorProfileId]);

  const normalize = (v) => (v || '').toString().toLowerCase();
  
  const formatDate = (d) => {
    try {
      const dt = new Date(d);
      return dt.toLocaleDateString([], { month: 'short', day: '2-digit', year: 'numeric' });
    } catch {
      return '';
    }
  };

  const getFilteredAndSorted = () => {
    let arr = invoices.slice();
    
    // Filter by search
    if (searchTerm) {
      const q = normalize(searchTerm);
      arr = arr.filter(b => {
        const name = b.ClientName || '';
        const status = b.InvoiceStatus || b.Status || '';
        const invNum = b.InvoiceNumber || '';
        const svc = b.ServicesSummary || '';
        const evn = b.EventName || '';
        const typ = b.EventType || '';
        const loc = b.EventLocation || '';
        const tz = b.TimeZone || '';
        const guests = b.AttendeeCount != null ? String(b.AttendeeCount) : '';
        return normalize(name).includes(q) || normalize(status).includes(q) || 
               normalize(invNum).includes(q) || normalize(svc).includes(q) || 
               normalize(evn).includes(q) || normalize(typ).includes(q) || 
               normalize(loc).includes(q) || normalize(tz).includes(q) || 
               normalize(guests).includes(q);
      });
    }
    
    // Sort
    const dir = sortDir === 'asc' ? 1 : -1;
    arr.sort((a, b) => {
      let av, bv;
      if (sortKey === 'date') {
        av = new Date(a.EventDate || 0);
        bv = new Date(b.EventDate || 0);
      } else if (sortKey === 'amount') {
        av = Number(a.TotalAmount || 0);
        bv = Number(b.TotalAmount || 0);
      } else if (sortKey === 'name') {
        av = normalize(a.ClientName || '');
        bv = normalize(b.ClientName || '');
      } else if (sortKey === 'status') {
        av = normalize(a.InvoiceStatus || a.Status || '');
        bv = normalize(b.InvoiceStatus || b.Status || '');
      } else if (sortKey === 'invoice') {
        av = a.InvoiceNumber || '';
        bv = b.InvoiceNumber || '';
      } else if (sortKey === 'due') {
        av = new Date(a.DueDate || 0);
        bv = new Date(b.DueDate || 0);
      } else {
        av = new Date(a.EventDate || 0);
        bv = new Date(b.EventDate || 0);
      }
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
    
    return arr;
  };

  const handleSort = (key) => {
    if (sortKey === key) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc');
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const filteredInvoices = getFilteredAndSorted();

  if (loading) {
    return (
      <div id="vendor-invoices-section">
        <div className="dashboard-card">
          <div id="vendor-invoices-list">
            <div style={{ textAlign: 'center', padding: '3rem' }}>
              <div className="spinner" style={{ margin: '0 auto' }}></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (invoices.length === 0) {
    return (
      <div id="vendor-invoices-section">
        <div className="dashboard-card">
          <div id="vendor-invoices-list">
            <p>No invoices available.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-invoices-section">
      <div className="dashboard-card">
        <div id="vendor-invoices-list">
          <div className="invoices-toolbar" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px', gap: '8px', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              <input 
                type="text" 
                placeholder="Search by name, status, invoice #, service" 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                style={{ padding: '8px 10px', border: '1px solid var(--border, #e5e7eb)', borderRadius: '6px', minWidth: '260px' }}
              />
              <button className="btn btn-outline btn-sm" onClick={() => setSearchTerm('')}>Clear</button>
            </div>
            <div style={{ color: '#6b7280', fontSize: '.9rem' }}>
              {filteredInvoices.length} item{filteredInvoices.length !== 1 ? 's' : ''}
            </div>
          </div>
          <div className="invoices-table-wrap">
            <div style={{ overflow: 'auto' }}>
              <table role="table" aria-label="Invoices" className="invoices-table" style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr>
                    <th className="ta-center" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, position: 'sticky', top: 0, zIndex: 1 }}>Actions</th>
                    <th className={`sortable ${sortKey === 'invoice' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} onClick={() => handleSort('invoice')} style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Invoice #{sortKey === 'invoice' && (sortDir === 'asc' ? ' ▲' : ' ▼')}</th>
                    <th className={`sortable ${sortKey === 'date' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} onClick={() => handleSort('date')} style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Date{sortKey === 'date' && (sortDir === 'asc' ? ' ▲' : ' ▼')}</th>
                    <th className={`sortable ${sortKey === 'name' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} onClick={() => handleSort('name')} style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Client{sortKey === 'name' && (sortDir === 'asc' ? ' ▲' : ' ▼')}</th>
                    <th className="sortable" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Service</th>
                    <th className="sortable" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Time</th>
                    <th className="sortable" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Type</th>
                    <th className="sortable" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Timezone</th>
                    <th className="sortable" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Location</th>
                    <th className="sortable ta-right" style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'right', position: 'sticky', top: 0, zIndex: 1 }}>Guests</th>
                    <th className={`sortable ${sortKey === 'status' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} onClick={() => handleSort('status')} style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', position: 'sticky', top: 0, zIndex: 1 }}>Status{sortKey === 'status' && (sortDir === 'asc' ? ' ▲' : ' ▼')}</th>
                    <th className={`sortable ta-right ${sortKey === 'amount' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} onClick={() => handleSort('amount')} style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'right', position: 'sticky', top: 0, zIndex: 1 }}>Amount{sortKey === 'amount' && (sortDir === 'asc' ? ' ▲' : ' ▼')}</th>
                    <th className={`sortable ta-right ${sortKey === 'due' ? (sortDir === 'asc' ? 'sorted-asc' : 'sorted-desc') : ''}`} onClick={() => handleSort('due')} style={{ padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: '#f9fafb', color: '#374151', fontWeight: 600, cursor: 'pointer', userSelect: 'none', textAlign: 'right', position: 'sticky', top: 0, zIndex: 1 }}>Due Date{sortKey === 'due' && (sortDir === 'asc' ? ' ▲' : ' ▼')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredInvoices.map(b => {
                    const eventDate = b.EventDate ? new Date(b.EventDate) : null;
                    const dateStr = eventDate ? formatDate(eventDate) : '';
                    const name = b.ClientName || 'Client';
                    const total = b.TotalAmount != null ? `$${Number(b.TotalAmount).toFixed(2)}` : '';
                    const statusRaw = (b.InvoiceStatus || b.Status || '').toString().toLowerCase();
                    const statusLabel = statusRaw === 'confirmed' ? 'Accepted' : (statusRaw.charAt(0).toUpperCase() + statusRaw.slice(1));
                    const invNum = b.InvoiceNumber || '—';
                    const due = b.DueDate ? formatDate(b.DueDate) : '—';
                    const svc = b.ServicesSummary || '—';
                    const typ = b.EventType || '';
                    const loc = b.EventLocation || '';
                    const tz = b.TimeZone || '';
                    const guests = b.AttendeeCount != null ? b.AttendeeCount : '';
                    
                    let timeTxt = '';
                    if (b.EventDate) {
                      try {
                        const bd = new Date(b.EventDate);
                        const ed = b.EndDate ? new Date(b.EndDate) : null;
                        const t1 = bd.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
                        const t2 = ed ? ed.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' }) : null;
                        timeTxt = t2 ? `${t1} — ${t2}` : `${t1}`;
                      } catch {}
                    }
                    
                    return (
                      <tr key={b.InvoiceID || b.BookingID || `invoice-${b.InvoiceNumber}-${dateStr}`} style={{ borderBottom: '1px solid var(--border, #e5e7eb)' }}>
                        <td className="nowrap ta-center" style={{ whiteSpace: 'nowrap', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)', textAlign: 'center' }}>
                          <div className="inv-actions" style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                              className="btn btn-icon" 
                              title="View invoice" 
                              aria-label="View invoice" 
                              onClick={() => {
                                // Open invoice view modal or navigate to invoice page
                                console.log('View invoice:', b.InvoiceID || b.InvoiceNumber);
                                alert(`Viewing invoice: ${b.InvoiceNumber || b.InvoiceID}`);
                              }}
                              style={{ 
                                margin: 0, 
                                padding: '6px', 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer',
                                color: '#6b7280',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#5e72e4'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                            >
                              <i className="fa-solid fa-eye" aria-hidden="true" style={{ fontSize: '16px' }}></i>
                            </button>
                            <button 
                              className="btn btn-icon" 
                              title="Download PDF" 
                              aria-label="Download PDF" 
                              onClick={() => {
                                // Download invoice as PDF
                                console.log('Download invoice:', b.InvoiceID || b.InvoiceNumber);
                                alert(`Downloading invoice: ${b.InvoiceNumber || b.InvoiceID}`);
                              }}
                              style={{ 
                                margin: 0, 
                                padding: '6px', 
                                background: 'transparent', 
                                border: 'none', 
                                cursor: 'pointer',
                                color: '#6b7280',
                                transition: 'color 0.2s'
                              }}
                              onMouseEnter={(e) => e.currentTarget.style.color = '#5e72e4'}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#6b7280'}
                            >
                              <i className="fa-solid fa-cloud-arrow-down" aria-hidden="true" style={{ fontSize: '16px' }}></i>
                            </button>
                          </div>
                        </td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#111827', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{invNum}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#374151', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{dateStr}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#111827', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{name}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#111827', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{svc}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#6b7280', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{timeTxt}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#6b7280', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{typ}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#6b7280', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{tz}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', color: '#6b7280', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{loc}</td>
                        <td className="ta-right nowrap" style={{ whiteSpace: 'nowrap', color: '#6b7280', textAlign: 'right', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{guests}</td>
                        <td className="nowrap" style={{ whiteSpace: 'nowrap', textTransform: 'capitalize', color: '#374151', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{statusLabel}</td>
                        <td className="ta-right nowrap" style={{ whiteSpace: 'nowrap', color: '#111827', textAlign: 'right', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{total}</td>
                        <td className="ta-right nowrap" style={{ whiteSpace: 'nowrap', color: '#374151', textAlign: 'right', padding: '6px 8px', border: '1px solid var(--border, #e5e7eb)', background: 'var(--secondary, #fff)' }}>{due}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorInvoicesSection;
