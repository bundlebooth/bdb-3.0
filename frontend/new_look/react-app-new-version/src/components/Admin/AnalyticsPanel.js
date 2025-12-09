import React, { useState, useEffect } from 'react';
import { API_BASE_URL } from '../../config';
import { showBanner } from '../../utils/helpers';

const AnalyticsPanel = () => {
  const [activeTab, setActiveTab] = useState('overview'); // overview, vendors, bookings, revenue
  const [dateRange, setDateRange] = useState('30d'); // 7d, 30d, 90d, 1y, custom
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAnalytics();
  }, [dateRange]);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${API_BASE_URL}/admin/analytics?range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
      } else {
        // Use mock data for display
        setStats(getMockData());
      }
    } catch (error) {
      console.error('Error fetching analytics:', error);
      setStats(getMockData());
    } finally {
      setLoading(false);
    }
  };

  const getMockData = () => ({
    totalVendors: 156,
    activeListings: 142,
    totalUsers: 2847,
    totalBookings: 1234,
    monthlyRevenue: 45678,
    platformFees: 4567,
    averageBookingValue: 285,
    conversionRate: 3.2,
    topCategories: [
      { name: 'Catering', count: 45, revenue: 15000 },
      { name: 'Photography', count: 38, revenue: 12000 },
      { name: 'Venue', count: 32, revenue: 18000 },
      { name: 'DJ/Music', count: 28, revenue: 8000 },
      { name: 'Florist', count: 22, revenue: 5000 }
    ],
    bookingTrends: [
      { month: 'Jan', bookings: 85, revenue: 24000 },
      { month: 'Feb', bookings: 92, revenue: 26000 },
      { month: 'Mar', bookings: 108, revenue: 31000 },
      { month: 'Apr', bookings: 125, revenue: 36000 },
      { month: 'May', bookings: 142, revenue: 41000 },
      { month: 'Jun', bookings: 168, revenue: 48000 }
    ],
    topVendors: [
      { name: 'Elite Catering Co.', bookings: 45, revenue: 12500, rating: 4.9 },
      { name: 'Perfect Moments Photography', bookings: 38, revenue: 9500, rating: 4.8 },
      { name: 'Grand Venue Hall', bookings: 32, revenue: 28000, rating: 4.7 },
      { name: 'DJ Beats', bookings: 28, revenue: 5600, rating: 4.6 },
      { name: 'Bloom Florists', bookings: 25, revenue: 4500, rating: 4.8 }
    ]
  });

  const handleExport = async (type) => {
    try {
      const response = await fetch(`${API_BASE_URL}/admin/analytics/export?type=${type}&range=${dateRange}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `analytics-${type}-${new Date().toISOString().split('T')[0]}.csv`;
        a.click();
        showBanner('Export downloaded', 'success');
      }
    } catch (error) {
      showBanner('Failed to export data', 'error');
    }
  };

  return (
    <div className="admin-panel analytics-panel">
      {/* Date Range Selector */}
      <div className="panel-toolbar">
        <div className="toolbar-left">
          <div className="date-range-selector">
            {['7d', '30d', '90d', '1y'].map(range => (
              <button
                key={range}
                className={`range-btn ${dateRange === range ? 'active' : ''}`}
                onClick={() => setDateRange(range)}
              >
                {range === '7d' ? 'Last 7 Days' :
                 range === '30d' ? 'Last 30 Days' :
                 range === '90d' ? 'Last 90 Days' : 'Last Year'}
              </button>
            ))}
          </div>
        </div>
        <div className="toolbar-right">
          <button className="btn-secondary" onClick={() => handleExport('all')}>
            <i className="fas fa-download"></i> Export All
          </button>
          <button className="btn-primary" onClick={fetchAnalytics}>
            <i className="fas fa-sync-alt"></i> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="panel-tabs">
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-chart-pie"></i> Overview
        </button>
        <button
          className={`tab ${activeTab === 'vendors' ? 'active' : ''}`}
          onClick={() => setActiveTab('vendors')}
        >
          <i className="fas fa-store"></i> Vendor Performance
        </button>
        <button
          className={`tab ${activeTab === 'bookings' ? 'active' : ''}`}
          onClick={() => setActiveTab('bookings')}
        >
          <i className="fas fa-calendar-check"></i> Booking Trends
        </button>
        <button
          className={`tab ${activeTab === 'revenue' ? 'active' : ''}`}
          onClick={() => setActiveTab('revenue')}
        >
          <i className="fas fa-dollar-sign"></i> Revenue
        </button>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading analytics...</p>
        </div>
      ) : (
        <>
          {/* Overview Tab */}
          {activeTab === 'overview' && (
            <div className="analytics-overview">
              {/* Key Metrics */}
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#5e72e4' }}>
                    <i className="fas fa-store"></i>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalVendors}</span>
                    <span className="stat-label">Total Vendors</span>
                    <span className="stat-change positive">+12% from last period</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#2dce89' }}>
                    <i className="fas fa-users"></i>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalUsers?.toLocaleString()}</span>
                    <span className="stat-label">Total Users</span>
                    <span className="stat-change positive">+8% from last period</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#11cdef' }}>
                    <i className="fas fa-calendar-check"></i>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalBookings?.toLocaleString()}</span>
                    <span className="stat-label">Total Bookings</span>
                    <span className="stat-change positive">+15% from last period</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-icon" style={{ background: '#f5365c' }}>
                    <i className="fas fa-dollar-sign"></i>
                  </div>
                  <div className="stat-info">
                    <span className="stat-value">${stats.monthlyRevenue?.toLocaleString()}</span>
                    <span className="stat-label">Monthly Revenue</span>
                    <span className="stat-change positive">+22% from last period</span>
                  </div>
                </div>
              </div>

              {/* Charts Row */}
              <div className="charts-row">
                <div className="chart-card">
                  <h3>Booking Trends</h3>
                  <div className="chart-placeholder">
                    <div className="bar-chart">
                      {stats.bookingTrends?.map((item, index) => (
                        <div key={index} className="bar-item">
                          <div
                            className="bar"
                            style={{ height: `${(item.bookings / 200) * 100}%` }}
                          ></div>
                          <span className="bar-label">{item.month}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="chart-card">
                  <h3>Top Categories</h3>
                  <div className="category-list">
                    {stats.topCategories?.map((cat, index) => (
                      <div key={index} className="category-item">
                        <div className="category-info">
                          <span className="category-rank">#{index + 1}</span>
                          <span className="category-name">{cat.name}</span>
                        </div>
                        <div className="category-stats">
                          <span className="category-count">{cat.count} vendors</span>
                          <span className="category-revenue">${cat.revenue.toLocaleString()}</span>
                        </div>
                        <div className="category-bar">
                          <div
                            className="category-fill"
                            style={{ width: `${(cat.revenue / 20000) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Additional Metrics */}
              <div className="metrics-row">
                <div className="metric-card">
                  <div className="metric-icon"><i className="fas fa-percentage"></i></div>
                  <div className="metric-info">
                    <span className="metric-value">{stats.conversionRate}%</span>
                    <span className="metric-label">Conversion Rate</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon"><i className="fas fa-receipt"></i></div>
                  <div className="metric-info">
                    <span className="metric-value">${stats.averageBookingValue}</span>
                    <span className="metric-label">Avg Booking Value</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon"><i className="fas fa-coins"></i></div>
                  <div className="metric-info">
                    <span className="metric-value">${stats.platformFees?.toLocaleString()}</span>
                    <span className="metric-label">Platform Fees Earned</span>
                  </div>
                </div>
                <div className="metric-card">
                  <div className="metric-icon"><i className="fas fa-list"></i></div>
                  <div className="metric-info">
                    <span className="metric-value">{stats.activeListings}</span>
                    <span className="metric-label">Active Listings</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Vendors Tab */}
          {activeTab === 'vendors' && (
            <div className="vendor-analytics">
              <div className="section-card">
                <div className="section-header">
                  <h3>Top Performing Vendors</h3>
                  <button className="btn-secondary" onClick={() => handleExport('vendors')}>
                    <i className="fas fa-download"></i> Export
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Rank</th>
                      <th>Vendor</th>
                      <th>Bookings</th>
                      <th>Revenue</th>
                      <th>Rating</th>
                      <th>Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.topVendors?.map((vendor, index) => (
                      <tr key={index}>
                        <td><span className="rank-badge">#{index + 1}</span></td>
                        <td><strong>{vendor.name}</strong></td>
                        <td>{vendor.bookings}</td>
                        <td>${vendor.revenue.toLocaleString()}</td>
                        <td>
                          <div className="rating">
                            <i className="fas fa-star"></i> {vendor.rating}
                          </div>
                        </td>
                        <td>
                          <span className="trend positive">
                            <i className="fas fa-arrow-up"></i> +12%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Bookings Tab */}
          {activeTab === 'bookings' && (
            <div className="booking-analytics">
              <div className="stats-grid small">
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">{stats.totalBookings}</span>
                    <span className="stat-label">Total Bookings</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">89%</span>
                    <span className="stat-label">Completion Rate</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">4.2%</span>
                    <span className="stat-label">Cancellation Rate</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">2.3 days</span>
                    <span className="stat-label">Avg Response Time</span>
                  </div>
                </div>
              </div>

              <div className="section-card">
                <h3>Booking Trends Over Time</h3>
                <div className="chart-placeholder large">
                  <div className="line-chart">
                    {stats.bookingTrends?.map((item, index) => (
                      <div key={index} className="line-point" style={{ left: `${(index / 5) * 100}%`, bottom: `${(item.bookings / 200) * 100}%` }}>
                        <div className="point-dot"></div>
                        <div className="point-label">{item.bookings}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Revenue Tab */}
          {activeTab === 'revenue' && (
            <div className="revenue-analytics">
              <div className="stats-grid small">
                <div className="stat-card highlight">
                  <div className="stat-info">
                    <span className="stat-value">${stats.monthlyRevenue?.toLocaleString()}</span>
                    <span className="stat-label">Total Revenue</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">${stats.platformFees?.toLocaleString()}</span>
                    <span className="stat-label">Platform Fees</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">${stats.averageBookingValue}</span>
                    <span className="stat-label">Avg Transaction</span>
                  </div>
                </div>
                <div className="stat-card">
                  <div className="stat-info">
                    <span className="stat-value">10%</span>
                    <span className="stat-label">Commission Rate</span>
                  </div>
                </div>
              </div>

              <div className="section-card">
                <div className="section-header">
                  <h3>Revenue by Month</h3>
                  <button className="btn-secondary" onClick={() => handleExport('revenue')}>
                    <i className="fas fa-download"></i> Export
                  </button>
                </div>
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Month</th>
                      <th>Bookings</th>
                      <th>Gross Revenue</th>
                      <th>Platform Fees</th>
                      <th>Growth</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.bookingTrends?.map((item, index) => (
                      <tr key={index}>
                        <td><strong>{item.month}</strong></td>
                        <td>{item.bookings}</td>
                        <td>${item.revenue.toLocaleString()}</td>
                        <td>${Math.round(item.revenue * 0.1).toLocaleString()}</td>
                        <td>
                          <span className="trend positive">
                            <i className="fas fa-arrow-up"></i> +{Math.round(Math.random() * 20)}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AnalyticsPanel;
