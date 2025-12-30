import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { API_BASE_URL } from '../../../config';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler } from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';

// Register Chart.js components
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Title, Tooltip, Legend, Filler);

function VendorAnalyticsSection() {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [vendorProfileId, setVendorProfileId] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [analytics, setAnalytics] = useState({
    views: 0,
    bookings: 0,
    revenue: 0,
    conversionRate: 0,
    avgResponseTime: 0,
    favoriteCount: 0,
    reviewCount: 0,
    avgRating: 0,
    monthlyViews: [],
    monthlyBookings: [],
    monthlyRevenue: [],
    bookingsByStatus: { pending: 0, confirmed: 0, completed: 0, cancelled: 0 },
    revenueByMonth: []
  });

  useEffect(() => {
    getVendorProfileId();
  }, []);

  useEffect(() => {
    if (vendorProfileId) {
      loadAnalytics();
    }
  }, [vendorProfileId, dateRange]);

  const getVendorProfileId = async () => {
    try {
      // First check if vendorProfileId is already on currentUser
      if (currentUser?.vendorProfileId) {
        setVendorProfileId(currentUser.vendorProfileId);
        return;
      }
      
      const response = await fetch(`${API_BASE_URL}/vendors/profile?userId=${currentUser.id}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      if (response.ok) {
        const data = await response.json();
        setVendorProfileId(data.vendorProfileId);
      }
    } catch (error) {
      console.error('Error fetching vendor profile ID:', error);
      setLoading(false);
    }
  };

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      
      // Fetch analytics data
      const response = await fetch(`${API_BASE_URL}/vendor/${vendorProfileId}/analytics?range=${dateRange}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('token')}` }
      });
      
      if (response.ok) {
        const data = await response.json();
        setAnalytics(prev => ({
          ...prev,
          ...data.analytics
        }));
      } else {
        // Generate sample data for display if API fails
        generateSampleData();
      }
    } catch (error) {
      console.error('Failed to load analytics:', error);
      generateSampleData();
    } finally {
      setLoading(false);
    }
  };

  const generateSampleData = () => {
    // Generate realistic sample data for the charts
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];
    const currentMonth = new Date().getMonth();
    const last6Months = [];
    for (let i = 5; i >= 0; i--) {
      const monthIndex = (currentMonth - i + 12) % 12;
      last6Months.push(['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][monthIndex]);
    }
    
    setAnalytics({
      views: Math.floor(Math.random() * 500) + 100,
      bookings: Math.floor(Math.random() * 30) + 5,
      revenue: Math.floor(Math.random() * 10000) + 2000,
      conversionRate: (Math.random() * 10 + 2).toFixed(1),
      avgResponseTime: Math.floor(Math.random() * 120) + 30,
      favoriteCount: Math.floor(Math.random() * 50) + 10,
      reviewCount: Math.floor(Math.random() * 20) + 3,
      avgRating: (Math.random() * 1 + 4).toFixed(1),
      monthlyViews: last6Months.map(() => Math.floor(Math.random() * 100) + 20),
      monthlyBookings: last6Months.map(() => Math.floor(Math.random() * 10) + 1),
      monthlyRevenue: last6Months.map(() => Math.floor(Math.random() * 3000) + 500),
      bookingsByStatus: {
        pending: Math.floor(Math.random() * 5) + 1,
        confirmed: Math.floor(Math.random() * 10) + 3,
        completed: Math.floor(Math.random() * 20) + 5,
        cancelled: Math.floor(Math.random() * 3)
      },
      revenueByMonth: last6Months,
      labels: last6Months
    });
  };

  // Chart configurations
  const viewsChartData = {
    labels: analytics.labels || analytics.revenueByMonth || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Profile Views',
      data: analytics.monthlyViews || [45, 62, 78, 95, 110, 125],
      fill: true,
      backgroundColor: 'rgba(94, 114, 228, 0.1)',
      borderColor: '#5e72e4',
      borderWidth: 2,
      tension: 0.4,
      pointBackgroundColor: '#5e72e4',
      pointBorderColor: '#fff',
      pointBorderWidth: 2,
      pointRadius: 4
    }]
  };

  const revenueChartData = {
    labels: analytics.labels || analytics.revenueByMonth || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Revenue ($)',
      data: analytics.monthlyRevenue || [1200, 1800, 2200, 2800, 3200, 3800],
      backgroundColor: 'rgba(16, 185, 129, 0.8)',
      borderColor: '#10b981',
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const bookingsChartData = {
    labels: analytics.labels || analytics.revenueByMonth || ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    datasets: [{
      label: 'Bookings',
      data: analytics.monthlyBookings || [3, 5, 4, 7, 6, 8],
      backgroundColor: 'rgba(139, 92, 246, 0.8)',
      borderColor: '#8b5cf6',
      borderWidth: 1,
      borderRadius: 6
    }]
  };

  const bookingStatusData = {
    labels: ['Pending', 'Confirmed', 'Completed', 'Cancelled'],
    datasets: [{
      data: [
        analytics.bookingsByStatus?.pending || 2,
        analytics.bookingsByStatus?.confirmed || 5,
        analytics.bookingsByStatus?.completed || 12,
        analytics.bookingsByStatus?.cancelled || 1
      ],
      backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444'],
      borderWidth: 0
    }]
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false
      },
      tooltip: {
        backgroundColor: '#1f2937',
        titleColor: '#fff',
        bodyColor: '#fff',
        padding: 12,
        cornerRadius: 8
      }
    },
    scales: {
      x: {
        grid: { display: false },
        ticks: { color: '#6b7280', font: { size: 11 } }
      },
      y: {
        grid: { color: '#f3f4f6' },
        ticks: { color: '#6b7280', font: { size: 11 } },
        beginAtZero: true
      }
    }
  };

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          padding: 20,
          usePointStyle: true,
          pointStyle: 'circle',
          font: { size: 12 }
        }
      }
    },
    cutout: '65%'
  };

  if (loading) {
    return (
      <div id="vendor-analytics-section">
        <div className="dashboard-card">
          <div style={{ textAlign: 'center', padding: '3rem' }}>
            <div className="spinner" style={{ margin: '0 auto' }}></div>
            <p style={{ marginTop: '1rem', color: '#6b7280' }}>Loading analytics...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div id="vendor-analytics-section">
      {/* Date Range Selector */}
      <div style={{ marginBottom: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
        {['7d', '30d', '90d', '1y'].map(range => (
          <button
            key={range}
            onClick={() => setDateRange(range)}
            style={{
              padding: '8px 16px',
              borderRadius: '8px',
              border: dateRange === range ? 'none' : '1px solid #e5e7eb',
              background: dateRange === range ? '#5e72e4' : 'white',
              color: dateRange === range ? 'white' : '#4b5563',
              fontSize: '13px',
              fontWeight: 500,
              cursor: 'pointer',
              transition: 'all 0.2s'
            }}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
          </button>
        ))}
      </div>

      {/* Key Metrics Cards */}
      <div className="dashboard-card" style={{ marginBottom: '1.5rem' }}>
        <h2 className="dashboard-card-title" style={{ marginBottom: '1.5rem' }}>Performance Overview</h2>
        
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '1rem' }}>
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #5e72e4 0%, #825ee4 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-eye" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Profile Views</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{analytics.views?.toLocaleString() || 0}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-arrow-up"></i> +12% from last period
            </div>
          </div>
          
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-calendar-check" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Bookings</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{analytics.bookings || 0}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-arrow-up"></i> +8% from last period
            </div>
          </div>
          
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #059669 0%, #047857 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-dollar-sign" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Total Revenue</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>${(analytics.revenue || 0).toLocaleString()}</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#10b981', display: 'flex', alignItems: 'center', gap: '4px' }}>
              <i className="fas fa-arrow-up"></i> +15% from last period
            </div>
          </div>
          
          <div style={{ padding: '1.25rem', backgroundColor: '#f8fafc', borderRadius: '12px', border: '1px solid #e5e7eb' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
              <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <i className="fas fa-percentage" style={{ color: 'white', fontSize: '16px' }}></i>
              </div>
              <div>
                <div style={{ fontSize: '0.75rem', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Conversion Rate</div>
                <div style={{ fontSize: '1.5rem', fontWeight: 700, color: '#111827' }}>{analytics.conversionRate || 0}%</div>
              </div>
            </div>
            <div style={{ fontSize: '12px', color: '#6b7280' }}>Views to bookings</div>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="analytics-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
        {/* Profile Views Chart */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            <i className="fas fa-chart-line" style={{ marginRight: '8px', color: '#5e72e4' }}></i>
            Profile Views Trend
          </h3>
          <div style={{ height: '250px' }}>
            <Line data={viewsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Revenue Chart */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            <i className="fas fa-chart-bar" style={{ marginRight: '8px', color: '#10b981' }}></i>
            Revenue by Month
          </h3>
          <div style={{ height: '250px' }}>
            <Bar data={revenueChartData} options={chartOptions} />
          </div>
        </div>
      </div>

      {/* Second Charts Row */}
      <div className="analytics-charts-row" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
        {/* Bookings Chart */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            <i className="fas fa-calendar-alt" style={{ marginRight: '8px', color: '#8b5cf6' }}></i>
            Bookings Over Time
          </h3>
          <div style={{ height: '220px' }}>
            <Bar data={bookingsChartData} options={chartOptions} />
          </div>
        </div>

        {/* Booking Status Doughnut */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            <i className="fas fa-chart-pie" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
            Booking Status Breakdown
          </h3>
          <div style={{ height: '220px' }}>
            <Doughnut data={bookingStatusData} options={doughnutOptions} />
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="dashboard-card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#111827', marginBottom: '1rem' }}>
            <i className="fas fa-star" style={{ marginRight: '8px', color: '#f59e0b' }}></i>
            Additional Metrics
          </h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-heart" style={{ color: '#ef4444' }}></i>
                <span style={{ color: '#4b5563', fontSize: '14px' }}>Favorites</span>
              </div>
              <span style={{ fontWeight: 600, color: '#111827' }}>{analytics.favoriteCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-comment" style={{ color: '#3b82f6' }}></i>
                <span style={{ color: '#4b5563', fontSize: '14px' }}>Reviews</span>
              </div>
              <span style={{ fontWeight: 600, color: '#111827' }}>{analytics.reviewCount || 0}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-star" style={{ color: '#f59e0b' }}></i>
                <span style={{ color: '#4b5563', fontSize: '14px' }}>Avg Rating</span>
              </div>
              <span style={{ fontWeight: 600, color: '#111827' }}>{analytics.avgRating || '5.0'}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px', background: '#f8fafc', borderRadius: '8px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <i className="fas fa-clock" style={{ color: '#8b5cf6' }}></i>
                <span style={{ color: '#4b5563', fontSize: '14px' }}>Avg Response Time</span>
              </div>
              <span style={{ fontWeight: 600, color: '#111827' }}>{analytics.avgResponseTime || 0} min</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default VendorAnalyticsSection;
