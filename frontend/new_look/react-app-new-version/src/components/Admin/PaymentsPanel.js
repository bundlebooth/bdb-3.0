import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const PaymentsPanel = () => {
  const [transactions, setTransactions] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [vendorBalances, setVendorBalances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview'); // overview, transactions, payouts, balances, stripe
  const [filter, setFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedItem, setSelectedItem] = useState(null);
  const [modalType, setModalType] = useState(null);
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0 });
  const [stripeConnected, setStripeConnected] = useState(false);
  const [stripeBalance, setStripeBalance] = useState({ available: 0, pending: 0 });
  const [stats, setStats] = useState({
    totalRevenue: 0,
    platformFees: 0,
    pendingPayouts: 0,
    completedPayouts: 0,
    totalTransactions: 0,
    thisMonthRevenue: 0,
    lastMonthRevenue: 0,
    growthPercent: 0
  });

  useEffect(() => {
    fetchStats();
    fetchTransactions();
    fetchPayoutsData();
    fetchVendorBalances();
    checkStripeConnection();
  }, [filter, pagination.page]);

  const fetchPayoutsData = async () => {
    try {
      const response = await fetch(
        `${API_BASE_URL}/admin/payments/payouts?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setPayouts(data.payouts || []);
      }
    } catch (error) {
      console.error('Error fetching payouts:', error);
    }
  };

  const fetchTransactions = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `${API_BASE_URL}/admin/payments/transactions?filter=${filter}&page=${pagination.page}&limit=${pagination.limit}&search=${searchTerm}`,
        {
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        setTransactions(data.transactions || []);
        setPagination(prev => ({ ...prev, total: data.total || 0 }));
      }
    } catch (error) {
      console.error('Error fetching transactions:', error);
    } finally {
      setLoading(false);
    }
  };

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
        setStats({
          totalRevenue: data.totalRevenue || data.TotalRevenue || 0,
          platformFees: data.platformFees || data.PlatformFees || 0,
          pendingPayouts: data.pendingPayouts || data.PendingPayouts || 0,
          completedPayouts: data.completedPayouts || data.CompletedPayouts || 0,
          totalTransactions: data.totalTransactions || data.TotalTransactions || 0,
          thisMonthRevenue: data.thisMonthRevenue || data.ThisMonthRevenue || 0,
          lastMonthRevenue: data.lastMonthRevenue || data.LastMonthRevenue || 0,
          growthPercent: data.growthPercent || 0
        });
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchVendorBalances = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/vendor-balances`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setVendorBalances(data.balances || []);
      }
    } catch (error) {
      console.error('Error fetching vendor balances:', error);
    }
  };

  const checkStripeConnection = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/payments/stripe-status`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStripeConnected(data.connected || false);
        setStripeBalance({
          available: data.balance?.available || 0,
          pending: data.balance?.pending || 0
        });
      }
    } catch (error) {
      console.error('Error checking Stripe status:', error);
      setStripeConnected(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount || 0);
  };

  return (
    <div className="admin-panel payments-panel">
      {/* Stripe Connection Status */}
      <div style={{
        background: stripeConnected ? '#d1fae5' : '#fef3c7',
        border: `1px solid ${stripeConnected ? '#10b981' : '#f59e0b'}`,
        borderRadius: '12px',
        padding: '16px 20px',
        marginBottom: '24px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '40px',
            height: '40px',
            borderRadius: '10px',
            background: stripeConnected ? '#10b981' : '#f59e0b',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <i className="fab fa-stripe-s" style={{ color: 'white', fontSize: '20px' }}></i>
          </div>
          <div>
            <div style={{ fontWeight: '600', color: stripeConnected ? '#065f46' : '#92400e', fontSize: '15px' }}>
              {stripeConnected ? 'Stripe Connected' : 'Stripe Not Connected'}
            </div>
            <div style={{ fontSize: '13px', color: stripeConnected ? '#047857' : '#b45309' }}>
              {stripeConnected
                ? `Available: ${formatCurrency(stripeBalance.available)} | Pending: ${formatCurrency(stripeBalance.pending)}`
                : 'Connect your Stripe account to process payments and payouts'
              }
            </div>
          </div>
        </div>
        <button
          onClick={() => setActiveTab('stripe')}
          style={{
            padding: '10px 20px',
            background: stripeConnected ? '#059669' : '#f59e0b',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <i className={`fas ${stripeConnected ? 'fa-cog' : 'fa-link'}`}></i>
          {stripeConnected ? 'Manage Stripe' : 'Connect Stripe'}
        </button>
      </div>

      {/* Stats Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div
          onClick={() => setActiveTab('transactions')}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#d1fae5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-dollar-sign" style={{ color: '#10b981', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(stats.totalRevenue)}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Total Revenue</div>
              {stats.growthPercent !== 0 && (
                <div style={{ fontSize: '12px', color: stats.growthPercent > 0 ? '#10b981' : '#ef4444', marginTop: '2px' }}>
                  <i className={`fas fa-arrow-${stats.growthPercent > 0 ? 'up' : 'down'}`}></i> {Math.abs(stats.growthPercent)}% vs last month
                </div>
              )}
            </div>
          </div>
        </div>

        <div style={{ background: 'white', borderRadius: '12px', padding: '20px', boxShadow: '0 2px 8px rgba(0,0,0,0.08)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#ede9fe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-percentage" style={{ color: '#7c3aed', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(stats.platformFees)}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Platform Fees</div>
              <div style={{ fontSize: '12px', color: '#9ca3af', marginTop: '2px' }}>15% commission</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('payouts')}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-clock" style={{ color: '#f59e0b', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(stats.pendingPayouts)}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Pending Payouts</div>
              <div style={{ fontSize: '12px', color: '#f59e0b', marginTop: '2px' }}>Awaiting transfer</div>
            </div>
          </div>
        </div>

        <div
          onClick={() => setActiveTab('balances')}
          style={{
            background: 'white',
            borderRadius: '12px',
            padding: '20px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
            cursor: 'pointer',
            transition: 'transform 0.2s, box-shadow 0.2s'
          }}
          onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.transform = 'none'; e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)'; }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{ width: '48px', height: '48px', borderRadius: '12px', background: '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <i className="fas fa-wallet" style={{ color: '#2563eb', fontSize: '20px' }}></i>
            </div>
            <div>
              <div style={{ fontSize: '24px', fontWeight: '700', color: '#1f2937' }}>{formatCurrency(stats.completedPayouts)}</div>
              <div style={{ fontSize: '13px', color: '#6b7280' }}>Completed Payouts</div>
              <div style={{ fontSize: '12px', color: '#10b981', marginTop: '2px' }}>Successfully paid</div>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', borderBottom: '1px solid #e5e7eb', paddingBottom: '8px' }}>
        {[
          { key: 'overview', label: 'Overview', icon: 'fa-chart-pie' },
          { key: 'transactions', label: 'Transactions', icon: 'fa-exchange-alt' },
          { key: 'payouts', label: 'Payouts', icon: 'fa-money-bill-wave' },
          { key: 'balances', label: 'Vendor Balances', icon: 'fa-wallet' },
          { key: 'stripe', label: 'Stripe Settings', icon: 'fa-stripe-s' }
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            style={{
              padding: '10px 16px',
              background: activeTab === tab.key ? '#5e72e4' : 'transparent',
              color: activeTab === tab.key ? 'white' : '#6b7280',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '14px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            <i className={`fas ${tab.icon}`}></i>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Toolbar */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="filter-tabs">
            {['all', 'completed', 'pending', 'failed'].map(status => (
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
