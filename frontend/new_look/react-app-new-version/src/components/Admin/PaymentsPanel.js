import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const PaymentsPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // transactions, payouts, balances
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFees: 0,
    pendingPayouts: 0,
    completedPayouts: 0
  });

  useEffect(() => {
    fetchData();
    fetchStats();
  }, [activeTab, filter, pagination.page]);

  const fetchData = async () => {
    try {
      setLoading(true);
      const endpoint = activeTab === 'transactions' ? 'transactions' : 'payouts';
      const response = await fetch(
        `${API_BASE_URL}/admin/payments/${endpoint}?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        if (activeTab === 'transactions') {
          setTransactions(data.transactions || []);
        } else {
          setPayouts(data.payouts || []);
        }
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      showBanner('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/stats`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleManualPayout = async (vendorId, amount) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/manual-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ vendorId, amount })
      });

      if (response.ok) {
        showBanner('Payout initiated', 'success');
        fetchData();
        setSelectedItem(null);
        setModalType(null);
      }
    } catch (error) {
      showBanner('Failed to process payout', 'error');
    }
  };

  const handleRefund = async (transactionId, amount, reason) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ transactionId, amount, reason })
      });

      if (response.ok) {
        showBanner('Refund processed', 'success');
        fetchData();
        setSelectedItem(null);
        setModalType(null);
      }
    } catch (error) {
      showBanner('Failed to process refund', 'error');
    }
  };

  const getStatusBadge = (status) => {
    const statusMap = {
      'Completed': { class: 'badge-success', icon: 'fa-check-circle' },
      'Pending': { class: 'badge-warning', icon: 'fa-clock' },
      'Failed': { class: 'badge-danger', icon: 'fa-times-circle' },
      'Refunded': { class: 'badge-info', icon: 'fa-undo' },
      'Processing': { class: 'badge-purple', icon: 'fa-spinner' }
    };
    const config = statusMap[status] || { class: 'badge-secondary', icon: 'fa-question' };
    return (
      <span className={`status-badge ${config.class}`}>
        <i className={`fas ${config.icon}`}></i> {status}
      </span>
    );
  };

  return (
    <div className="admin-panel payments-panel">
      {/* Stats Cards */}
      <div className="stats-grid small">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#2dce89' }}>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">${stats.totalRevenue?.toLocaleString() || 0}</span>
            <span className="stat-label">Total Revenue</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#5e72e4' }}>
            <i className="fas fa-percentage"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">${stats.platformFees?.toLocaleString() || 0}</span>
            <span className="stat-label">Platform Fees</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#fb6340' }}>
            <i className="fas fa-clock"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">${stats.pendingPayouts?.toLocaleString() || 0}</span>
            <span className="stat-label">Pending Payouts</span>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: '#11cdef' }}>
            <i className="fas fa-check"></i>
          </div>
          <div className="stat-info">
            <span className="stat-value">${stats.completedPayouts?.toLocaleString() || 0}</span>
            <span className="stat-label">Completed Payouts</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          <i className="fas fa-exchange-alt"></i> Transactions
        </button>
        <button
          className={`tab ${activeTab === 'payouts' ? 'active' : ''}`}
          onClick={() => setActiveTab('payouts')}
        >
          <i className="fas fa-money-bill-wave"></i> Payouts
        </button>
        <button
          className={`tab ${activeTab === 'balances' ? 'active' : ''}`}
          onClick={() => setActiveTab('balances')}
        >
          <i className="fas fa-wallet"></i> Vendor Balances
        </button>
      </div>

      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'completed', 'pending', 'failed', 'refunded'].map(status => (
              <button
                key={status}
                className={`filter-tab ${filter === status ? 'active' : ''}`}
                onClick={() => setFilter(status)}
              >
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <div className="search-box">
            <i className="fas fa-search"></i>
            <input
              type="text"
              placeholder="Search transactions..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchData()}
            />
          </div>
          <button className="btn-secondary" onClick={() => setModalType('manual-payout')}>
            <i className="fas fa-paper-plane"></i> Manual Payout
          </button>
          <button className="btn-primary" onClick={fetchData}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Data Table */}
      <div className="data-table-container">
        {loading ? (
          <div className="loading-state">
            <div className="spinner"></div>
            <p>Loading...</p>
          </div>
        ) : activeTab === 'transactions' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Transaction ID</th>
                <th>Date</th>
                <th>Client</th>
                <th>Vendor</th>
                <th>Booking</th>
                <th>Amount</th>
                <th>Fee</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map(tx => (
                <tr key={tx.TransactionID}>
                  <td><code>{tx.TransactionID}</code></td>
                  <td>{new Date(tx.CreatedAt).toLocaleDateString()}</td>
                  <td>{tx.ClientName}</td>
                  <td>{tx.VendorName}</td>
                  <td>#{tx.BookingID}</td>
                  <td><strong>${tx.Amount?.toFixed(2)}</strong></td>
                  <td>${tx.PlatformFee?.toFixed(2)}</td>
                  <td>{getStatusBadge(tx.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => { setSelectedItem(tx); setModalType('view-transaction'); }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                      {tx.Status === 'Completed' && (
                        <button
                          className="action-btn refund"
                          onClick={() => { setSelectedItem(tx); setModalType('refund'); }}
                        >
                          <i className="fas fa-undo"></i>
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : activeTab === 'payouts' ? (
          <table className="data-table">
            <thead>
              <tr>
                <th>Payout ID</th>
                <th>Date</th>
                <th>Vendor</th>
                <th>Amount</th>
                <th>Method</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payouts.map(payout => (
                <tr key={payout.PayoutID}>
                  <td><code>{payout.PayoutID}</code></td>
                  <td>{new Date(payout.CreatedAt).toLocaleDateString()}</td>
                  <td>{payout.VendorName}</td>
                  <td><strong>${payout.Amount?.toFixed(2)}</strong></td>
                  <td>{payout.Method || 'Stripe'}</td>
                  <td>{getStatusBadge(payout.Status)}</td>
                  <td>
                    <div className="action-buttons">
                      <button
                        className="action-btn view"
                        onClick={() => { setSelectedItem(payout); setModalType('view-payout'); }}
                      >
                        <i className="fas fa-eye"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <VendorBalancesTable />
        )}
      </div>

      {/* Pagination */}
      {pagination.total > pagination.limit && (
        <div className="pagination">
          <button
            disabled={pagination.page === 1}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page - 1 }))}
          >
            <i className="fas fa-chevron-left"></i> Previous
          </button>
          <span>Page {pagination.page} of {Math.ceil(pagination.total / pagination.limit)}</span>
          <button
            disabled={pagination.page >= Math.ceil(pagination.total / pagination.limit)}
            onClick={() => setPagination(prev => ({ ...prev, page: prev.page + 1 }))}
          >
            Next <i className="fas fa-chevron-right"></i>
          </button>
        </div>
      )}

      {/* Commission Settings */}
      <div className="section-card">
        <h3><i className="fas fa-sliders-h"></i> Commission Settings</h3>
        <div className="commission-grid">
          <div className="commission-item">
            <label>Default Commission Rate (%)</label>
            <input type="number" defaultValue="10" min="0" max="50" />
          </div>
          <div className="commission-item">
            <label>Premium Vendor Rate (%)</label>
            <input type="number" defaultValue="8" min="0" max="50" />
          </div>
          <div className="commission-item">
            <label>New Vendor Rate (%)</label>
            <input type="number" defaultValue="5" min="0" max="50" />
          </div>
        </div>
        <button className="btn-primary">
          <i className="fas fa-save"></i> Save Settings
        </button>
      </div>

      {/* Modals */}
      {modalType === 'refund' && selectedItem && (
        <RefundModal
          transaction={selectedItem}
          onClose={() => { setSelectedItem(null); setModalType(null); }}
          onRefund={handleRefund}
        />
      )}

      {modalType === 'manual-payout' && (
        <ManualPayoutModal
          onClose={() => setModalType(null)}
          onPayout={handleManualPayout}
        />
      )}

      {modalType === 'view-transaction' && selectedItem && (
        <TransactionViewModal
          transaction={selectedItem}
          onClose={() => { setSelectedItem(null); setModalType(null); }}
        />
      )}
    </div>
  );
};

// Vendor Balances Table
const VendorBalancesTable = () => {
  const [balances, setBalances] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBalances();
  }, []);

  const fetchBalances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/vendor-balances`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setBalances(data.balances || []);
      }
    } catch (error) {
      console.error('Error fetching balances:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-state">
        <div className="spinner"></div>
      </div>
    );
  }

  return (
    <table className="data-table">
      <thead>
        <tr>
          <th>Vendor</th>
          <th>Available Balance</th>
          <th>Pending Balance</th>
          <th>Total Earned</th>
          <th>Last Payout</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        {balances.map(balance => (
          <tr key={balance.VendorID}>
            <td>
              <div className="vendor-cell">
                <strong>{balance.VendorName}</strong>
                <small>{balance.VendorEmail}</small>
              </div>
            </td>
            <td><strong>${balance.AvailableBalance?.toFixed(2) || '0.00'}</strong></td>
            <td>${balance.PendingBalance?.toFixed(2) || '0.00'}</td>
            <td>${balance.TotalEarned?.toFixed(2) || '0.00'}</td>
            <td>{balance.LastPayoutDate ? new Date(balance.LastPayoutDate).toLocaleDateString() : 'Never'}</td>
            <td>
              <button className="btn-small primary">
                <i className="fas fa-paper-plane"></i> Payout
              </button>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
};

// Refund Modal
const RefundModal = ({ transaction, onClose, onRefund }) => {
  const [amount, setAmount] = useState(transaction.Amount || 0);
  const [reason, setReason] = useState('');
  const [refundType, setRefundType] = useState('full');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    setProcessing(true);
    await onRefund(
      transaction.TransactionID,
      refundType === 'full' ? transaction.Amount : amount,
      reason
    );
    setProcessing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Process Refund</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="info-box">
            <p><strong>Transaction:</strong> {transaction.TransactionID}</p>
            <p><strong>Original Amount:</strong> ${transaction.Amount?.toFixed(2)}</p>
          </div>
          <div className="form-group">
            <label>Refund Type</label>
            <div className="radio-group">
              <label>
                <input
                  type="radio"
                  value="full"
                  checked={refundType === 'full'}
                  onChange={() => setRefundType('full')}
                />
                Full Refund (${transaction.Amount?.toFixed(2)})
              </label>
              <label>
                <input
                  type="radio"
                  value="partial"
                  checked={refundType === 'partial'}
                  onChange={() => setRefundType('partial')}
                />
                Partial Refund
              </label>
            </div>
          </div>
          {refundType === 'partial' && (
            <div className="form-group">
              <label>Refund Amount ($)</label>
              <input
                type="number"
                value={amount}
                onChange={e => setAmount(parseFloat(e.target.value))}
                max={transaction.Amount}
                min={0}
              />
            </div>
          )}
          <div className="form-group">
            <label>Reason</label>
            <textarea
              value={reason}
              onChange={e => setReason(e.target.value)}
              placeholder="Reason for refund..."
              rows={3}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={processing || !reason.trim()}
          >
            {processing ? 'Processing...' : 'Process Refund'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Manual Payout Modal
const ManualPayoutModal = ({ onClose, onPayout }) => {
  const [vendorId, setVendorId] = useState('');
  const [amount, setAmount] = useState('');
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    setProcessing(true);
    await onPayout(vendorId, parseFloat(amount));
    setProcessing(false);
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Manual Payout</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="form-group">
            <label>Vendor ID</label>
            <input
              type="text"
              value={vendorId}
              onChange={e => setVendorId(e.target.value)}
              placeholder="Enter vendor ID"
            />
          </div>
          <div className="form-group">
            <label>Amount ($)</label>
            <input
              type="number"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="Enter amount"
              min={0}
            />
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button
            className="btn-primary"
            onClick={handleSubmit}
            disabled={processing || !vendorId || !amount}
          >
            {processing ? 'Processing...' : 'Send Payout'}
          </button>
        </div>
      </div>
    </div>
  );
};

// Transaction View Modal
const TransactionViewModal = ({ transaction, onClose }) => {
  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <h2>Transaction Details</h2>
          <button className="modal-close" onClick={onClose}>
            <i className="fas fa-times"></i>
          </button>
        </div>
        <div className="modal-body">
          <div className="detail-section">
            <div className="detail-row">
              <label>Transaction ID:</label>
              <code>{transaction.TransactionID}</code>
            </div>
            <div className="detail-row">
              <label>Stripe ID:</label>
              <code>{transaction.StripePaymentID || 'N/A'}</code>
            </div>
            <div className="detail-row">
              <label>Date:</label>
              <span>{new Date(transaction.CreatedAt).toLocaleString()}</span>
            </div>
            <div className="detail-row">
              <label>Status:</label>
              <span>{transaction.Status}</span>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-row">
              <label>Client:</label>
              <span>{transaction.ClientName} ({transaction.ClientEmail})</span>
            </div>
            <div className="detail-row">
              <label>Vendor:</label>
              <span>{transaction.VendorName}</span>
            </div>
            <div className="detail-row">
              <label>Booking:</label>
              <span>#{transaction.BookingID}</span>
            </div>
          </div>
          <div className="detail-section">
            <div className="detail-row">
              <label>Amount:</label>
              <strong>${transaction.Amount?.toFixed(2)}</strong>
            </div>
            <div className="detail-row">
              <label>Platform Fee:</label>
              <span>${transaction.PlatformFee?.toFixed(2)}</span>
            </div>
            <div className="detail-row">
              <label>Vendor Payout:</label>
              <span>${(transaction.Amount - transaction.PlatformFee)?.toFixed(2)}</span>
            </div>
          </div>
        </div>
        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>Close</button>
        </div>
      </div>
    </div>
  );
};

export default PaymentsPanel;
