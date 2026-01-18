/**
 * Shared Admin Panel Components
 * Reusable UI components for Admin panels to eliminate duplicated markup
 */

import React from 'react';
import './AdminComponents.css';

/**
 * Loading State Component
 * Displays a spinner with optional message
 */
export const LoadingState = ({ message = 'Loading...', small = false }) => (
  <div className={`admin-loading-state ${small ? 'small' : ''}`}>
    <div className="admin-spinner"></div>
    <p>{message}</p>
  </div>
);

/**
 * Empty State Component
 * Displays when no data is available
 */
export const EmptyState = ({ 
  icon = 'fa-inbox', 
  title = 'No data found', 
  message = '', 
  action = null,
  small = false 
}) => (
  <div className={`admin-empty-state ${small ? 'small' : ''}`}>
    <i className={`fas ${icon}`}></i>
    <h3>{title}</h3>
    {message && <p>{message}</p>}
    {action && action}
  </div>
);

/**
 * Panel Header Component
 * Standard header with title, stats, and actions
 */
export const PanelHeader = ({ title, subtitle, stats = [], actions = null, children }) => (
  <div className="admin-panel-header">
    <div className="header-content">
      <div className="header-text">
        <h1>{title}</h1>
        {subtitle && <p className="subtitle">{subtitle}</p>}
      </div>
      {stats.length > 0 && (
        <div className="header-stats">
          {stats.map((stat, index) => (
            <div key={index} className={`stat-item ${stat.color || ''}`}>
              <span className="stat-value">{stat.value}</span>
              <span className="stat-label">{stat.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
    {(actions || children) && (
      <div className="header-actions">
        {actions}
        {children}
      </div>
    )}
  </div>
);

/**
 * Filter Bar Component
 * Standard filter/search bar for admin panels
 */
export const FilterBar = ({ 
  filters = [], 
  activeFilter, 
  onFilterChange, 
  searchTerm = '', 
  onSearchChange,
  searchPlaceholder = 'Search...',
  actions = null 
}) => (
  <div className="admin-filter-bar">
    {filters.length > 0 && (
      <div className="filter-tabs">
        {filters.map(filter => (
          <button
            key={filter.value}
            className={`filter-tab ${activeFilter === filter.value ? 'active' : ''}`}
            onClick={() => onFilterChange(filter.value)}
          >
            {filter.icon && <i className={`fas ${filter.icon}`}></i>}
            <span>{filter.label}</span>
            {filter.count !== undefined && <span className="count">{filter.count}</span>}
          </button>
        ))}
      </div>
    )}
    <div className="filter-actions">
      {onSearchChange && (
        <div className="search-input">
          <i className="fas fa-search"></i>
          <input
            type="text"
            placeholder={searchPlaceholder}
            value={searchTerm}
            onChange={e => onSearchChange(e.target.value)}
          />
          {searchTerm && (
            <button className="clear-search" onClick={() => onSearchChange('')}>
              <i className="fas fa-times"></i>
            </button>
          )}
        </div>
      )}
      {actions}
    </div>
  </div>
);

/**
 * Data Table Component
 * Reusable table with sorting, selection, and actions
 */
export const DataTable = ({ 
  columns, 
  data, 
  onRowClick,
  selectedRows = new Set(),
  onSelectRow,
  onSelectAll,
  actions,
  emptyMessage = 'No data available',
  loading = false
}) => {
  if (loading) {
    return <LoadingState message="Loading data..." />;
  }

  if (!data || data.length === 0) {
    return <EmptyState message={emptyMessage} />;
  }

  const allSelected = data.length > 0 && selectedRows.size === data.length;

  return (
    <div className="admin-data-table-wrapper">
      <table className="admin-data-table">
        <thead>
          <tr>
            {onSelectRow && (
              <th className="checkbox-col">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={e => onSelectAll && onSelectAll(e.target.checked)}
                />
              </th>
            )}
            {columns.map((col, index) => (
              <th key={index} className={col.className || ''} style={col.style}>
                {col.header}
              </th>
            ))}
            {actions && <th className="actions-col">Actions</th>}
          </tr>
        </thead>
        <tbody>
          {data.map((row, rowIndex) => (
            <tr 
              key={row.id || rowIndex} 
              onClick={() => onRowClick && onRowClick(row)}
              className={onRowClick ? 'clickable' : ''}
            >
              {onSelectRow && (
                <td className="checkbox-col" onClick={e => e.stopPropagation()}>
                  <input
                    type="checkbox"
                    checked={selectedRows.has(row.id)}
                    onChange={() => onSelectRow(row.id)}
                  />
                </td>
              )}
              {columns.map((col, colIndex) => (
                <td key={colIndex} className={col.className || ''} style={col.style}>
                  {col.render ? col.render(row) : row[col.field]}
                </td>
              ))}
              {actions && (
                <td className="actions-col" onClick={e => e.stopPropagation()}>
                  {actions(row)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

/**
 * Pagination Component
 */
export const Pagination = ({ page, limit, total, onPageChange }) => {
  const totalPages = Math.ceil(total / limit);
  
  if (totalPages <= 1) return null;

  return (
    <div className="admin-pagination">
      <button 
        disabled={page <= 1} 
        onClick={() => onPageChange(page - 1)}
        className="pagination-btn"
      >
        <i className="fas fa-chevron-left"></i>
      </button>
      <span className="pagination-info">
        Page {page} of {totalPages} ({total} items)
      </span>
      <button 
        disabled={page >= totalPages} 
        onClick={() => onPageChange(page + 1)}
        className="pagination-btn"
      >
        <i className="fas fa-chevron-right"></i>
      </button>
    </div>
  );
};

/**
 * Status Badge Component
 */
export const StatusBadge = ({ status, type = 'default' }) => {
  const statusColors = {
    // Status types
    active: 'success',
    approved: 'success',
    completed: 'success',
    confirmed: 'success',
    paid: 'success',
    visible: 'success',
    pending: 'warning',
    processing: 'warning',
    in_progress: 'warning',
    inactive: 'neutral',
    hidden: 'neutral',
    rejected: 'danger',
    cancelled: 'danger',
    failed: 'danger',
    suspended: 'danger',
    refunded: 'info',
    disputed: 'info'
  };

  const colorClass = statusColors[status?.toLowerCase()] || type;
  const displayStatus = status?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

  return (
    <span className={`admin-status-badge ${colorClass}`}>
      {displayStatus}
    </span>
  );
};

/**
 * Action Button Component
 */
export const ActionButton = ({ 
  icon, 
  label, 
  onClick, 
  variant = 'default', 
  size = 'medium',
  disabled = false,
  loading = false,
  title
}) => (
  <button
    className={`admin-action-btn ${variant} ${size} ${loading ? 'loading' : ''}`}
    onClick={onClick}
    disabled={disabled || loading}
    title={title || label}
  >
    {loading ? (
      <i className="fas fa-spinner fa-spin"></i>
    ) : icon ? (
      <i className={`fas ${icon}`}></i>
    ) : null}
    {label && <span>{label}</span>}
  </button>
);

/**
 * Action Buttons Group
 */
export const ActionButtons = ({ children }) => (
  <div className="admin-action-buttons">
    {children}
  </div>
);

/**
 * Card Component
 */
export const Card = ({ title, icon, children, actions, className = '' }) => (
  <div className={`admin-card ${className}`}>
    {(title || actions) && (
      <div className="card-header">
        {title && (
          <h3>
            {icon && <i className={`fas ${icon}`}></i>}
            {title}
          </h3>
        )}
        {actions && <div className="card-actions">{actions}</div>}
      </div>
    )}
    <div className="card-body">{children}</div>
  </div>
);

/**
 * Stats Card Component
 */
export const StatsCard = ({ icon, value, label, trend, color = 'default' }) => (
  <div className={`admin-stats-card ${color}`}>
    <div className="stats-icon">
      <i className={`fas ${icon}`}></i>
    </div>
    <div className="stats-content">
      <div className="stats-value">{value}</div>
      <div className="stats-label">{label}</div>
      {trend && (
        <div className={`stats-trend ${trend.direction}`}>
          <i className={`fas fa-arrow-${trend.direction === 'up' ? 'up' : 'down'}`}></i>
          {trend.value}
        </div>
      )}
    </div>
  </div>
);

/**
 * Tab Navigation Component
 */
export const TabNav = ({ tabs, activeTab, onTabChange }) => (
  <div className="admin-tab-nav">
    {tabs.map(tab => (
      <button
        key={tab.id}
        className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
        onClick={() => onTabChange(tab.id)}
      >
        {tab.icon && <i className={`fas ${tab.icon}`}></i>}
        <span>{tab.label}</span>
        {tab.count !== undefined && <span className="tab-count">{tab.count}</span>}
      </button>
    ))}
  </div>
);

/**
 * Detail Row Component for displaying key-value pairs
 */
export const DetailRow = ({ label, value, icon }) => (
  <div className="admin-detail-row">
    <label>
      {icon && <i className={`fas ${icon}`}></i>}
      {label}:
    </label>
    <span>{value || 'N/A'}</span>
  </div>
);

/**
 * Detail Section Component
 */
export const DetailSection = ({ title, icon, children }) => (
  <div className="admin-detail-section">
    {title && (
      <h4>
        {icon && <i className={`fas ${icon}`}></i>}
        {title}
      </h4>
    )}
    <div className="section-content">{children}</div>
  </div>
);

/**
 * Confirm Dialog Hook Helper
 */
export const useConfirmDialog = () => {
  const confirm = (message) => {
    return window.confirm(message);
  };
  return { confirm };
};
