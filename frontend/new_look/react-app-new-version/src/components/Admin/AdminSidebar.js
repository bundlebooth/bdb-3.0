/**
 * Admin Sidebar Component
 * Navigation for 8 admin sections with mobile responsiveness
 * Follows existing DashboardSidebar patterns
 */

import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: 'fa-chart-pie' },
  { id: 'analytics', label: 'Analytics & Reports', icon: 'fa-chart-bar' },
  { id: 'users', label: 'User Management', icon: 'fa-users' },
  { id: 'vendors', label: 'Vendor Management', icon: 'fa-store' },
  { id: 'bookings', label: 'Bookings', icon: 'fa-calendar-check' },
  { id: 'payments', label: 'Payments & Payouts', icon: 'fa-credit-card' },
  { id: 'reviews', label: 'Reviews & Moderation', icon: 'fa-star' },
  { id: 'content', label: 'Content Management', icon: 'fa-newspaper' },
  { id: 'support', label: 'Support Tickets', icon: 'fa-ticket-alt' },
  { id: 'chat', label: 'Live Chat', icon: 'fa-comments' },
  { id: 'security', label: 'Security & Audit', icon: 'fa-shield-alt' },
  { id: 'settings', label: 'Platform Settings', icon: 'fa-cog' },
  { id: 'automation', label: 'Automation & Email', icon: 'fa-robot' },
  { id: 'tools', label: 'Search & Impersonation', icon: 'fa-user-secret' }
];

function AdminSidebar({ 
  activeSection, 
  onSectionChange, 
  onLogout,
  mobileMenuOpen,
  setMobileMenuOpen 
}) {
  const { currentUser } = useAuth();
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
      if (window.innerWidth > 768) {
        setMobileMenuOpen?.(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [setMobileMenuOpen]);

  // Prevent background scrolling when mobile menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [mobileMenuOpen]);

  const handleMenuItemClick = (itemId) => {
    onSectionChange(itemId);
    if (isMobile) {
      setMobileMenuOpen?.(false);
    }
  };

  // Mobile sidebar view
  if (isMobile) {
    return (
      <>
        {/* Slide-out menu overlay */}
        {mobileMenuOpen && (
          <div
            onClick={() => setMobileMenuOpen?.(false)}
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: 'rgba(0,0,0,0.5)',
              zIndex: 1100
            }}
          />
        )}

        {/* Slide-out menu panel */}
        <aside
          style={{
            position: 'fixed',
            top: 0,
            left: mobileMenuOpen ? 0 : '-300px',
            width: '300px',
            height: '100vh',
            background: 'white',
            zIndex: 1101,
            transition: 'left 0.3s ease',
            boxShadow: mobileMenuOpen ? '4px 0 20px rgba(0,0,0,0.15)' : 'none',
            display: 'flex',
            flexDirection: 'column',
            overflowY: 'auto'
          }}
        >
          {/* Header with admin info */}
          <div style={{
            padding: '1.25rem',
            borderBottom: '1px solid #e5e7eb',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{
                width: '44px',
                height: '44px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #5086E8 0%, #3d6bc7 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
                fontSize: '18px',
                fontWeight: 600
              }}>
                {currentUser?.name?.charAt(0)?.toUpperCase() || 'A'}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
                  {currentUser?.name || 'Admin'}
                </span>
                <span style={{
                  fontSize: '11px',
                  fontWeight: 500,
                  color: '#5086E8',
                  background: 'rgba(80, 134, 232, 0.1)',
                  padding: '2px 8px',
                  borderRadius: '10px',
                  display: 'inline-block'
                }}>
                  Administrator
                </span>
              </div>
            </div>
            <button
              onClick={() => setMobileMenuOpen?.(false)}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '50%',
                border: 'none',
                background: '#f3f4f6',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                fontSize: '20px',
                color: '#6b7280'
              }}
            >
              ×
            </button>
          </div>

          {/* Menu items */}
          <ul style={{ padding: '1rem', margin: 0, listStyle: 'none', flex: 1 }}>
            <li style={{
              margin: '0 0 0.5rem',
              padding: '0 0.5rem',
              fontSize: '0.7rem',
              color: '#6b7280',
              textTransform: 'uppercase',
              letterSpacing: '0.05em'
            }}>
              Admin Panel
            </li>
            {adminMenuItems.map(item => (
              <li key={item.id} style={{ marginBottom: '0.25rem' }}>
                <a 
                  href="#" 
                  onClick={(e) => {
                    e.preventDefault();
                    handleMenuItemClick(item.id);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    padding: '0.75rem 1rem',
                    borderRadius: '8px',
                    color: activeSection === item.id ? 'white' : '#4b5563',
                    background: activeSection === item.id ? '#5086E8' : 'transparent',
                    textDecoration: 'none',
                    fontSize: '0.95rem',
                    fontWeight: activeSection === item.id ? '500' : '400',
                    transition: 'all 0.15s'
                  }}
                >
                  <i className={`fas ${item.icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
                  {item.label}
                </a>
              </li>
            ))}
            <li style={{ marginTop: '1rem', borderTop: '1px solid #e5e7eb', paddingTop: '1rem' }}>
              <a 
                href="#" 
                onClick={(e) => {
                  e.preventDefault();
                  onLogout?.();
                }}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.75rem 1rem',
                  borderRadius: '8px',
                  color: '#ef4444',
                  textDecoration: 'none',
                  fontSize: '0.95rem'
                }}
              >
                <i className="fas fa-sign-out-alt" style={{ width: '20px', textAlign: 'center' }}></i>
                Log Out
              </a>
            </li>
          </ul>
        </aside>
      </>
    );
  }

  // Desktop sidebar view
  return (
    <aside className="admin-sidebar" style={{
      width: '260px',
      minWidth: '260px',
      background: 'white',
      borderRight: '1px solid #e5e7eb',
      height: '100vh',
      position: 'sticky',
      top: 0,
      display: 'flex',
      flexDirection: 'column',
      overflowY: 'auto'
    }}>
      {/* Admin header */}
      <div style={{ 
        padding: '1.25rem 1rem', 
        borderBottom: '1px solid #e5e7eb', 
        display: 'flex', 
        alignItems: 'center', 
        gap: '12px'
      }}>
        <div style={{
          width: '44px',
          height: '44px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #5086E8 0%, #3d6bc7 100%)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontSize: '18px',
          fontWeight: 600
        }}>
          {currentUser?.name?.charAt(0)?.toUpperCase() || 'A'}
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          <span style={{ fontSize: '14px', fontWeight: 600, color: '#111827' }}>
            {currentUser?.name || 'Admin'}
          </span>
          <span style={{
            fontSize: '11px',
            fontWeight: 500,
            color: '#5086E8',
            background: 'rgba(80, 134, 232, 0.1)',
            padding: '2px 8px',
            borderRadius: '10px',
            display: 'inline-block'
          }}>
            Administrator
          </span>
        </div>
      </div>

      {/* Menu items */}
      <ul style={{ padding: '1rem', margin: 0, listStyle: 'none', flex: 1 }}>
        <li style={{
          margin: '0 0 0.75rem',
          padding: '0 0.5rem',
          fontSize: '0.7rem',
          color: '#6b7280',
          textTransform: 'uppercase',
          letterSpacing: '0.05em'
        }}>
          Admin Panel
        </li>
        {adminMenuItems.map(item => (
          <li key={item.id} style={{ marginBottom: '0.25rem' }}>
            <a 
              href="#" 
              onClick={(e) => {
                e.preventDefault();
                handleMenuItemClick(item.id);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '0.75rem 1rem',
                borderRadius: '8px',
                color: activeSection === item.id ? 'white' : '#4b5563',
                background: activeSection === item.id ? '#5086E8' : 'transparent',
                textDecoration: 'none',
                fontSize: '0.9rem',
                fontWeight: activeSection === item.id ? '500' : '400',
                transition: 'all 0.15s'
              }}
            >
              <i className={`fas ${item.icon}`} style={{ width: '20px', textAlign: 'center' }}></i>
              {item.label}
            </a>
          </li>
        ))}
      </ul>

      {/* Footer with logout */}
      <div style={{ 
        padding: '1rem', 
        borderTop: '1px solid #e5e7eb',
        marginTop: 'auto'
      }}>
        <a 
          href="#" 
          onClick={(e) => {
            e.preventDefault();
            onLogout?.();
          }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.75rem',
            padding: '0.75rem 1rem',
            borderRadius: '8px',
            color: '#ef4444',
            textDecoration: 'none',
            fontSize: '0.9rem',
            transition: 'background 0.15s'
          }}
          onMouseEnter={(e) => e.target.style.background = 'rgba(239, 68, 68, 0.08)'}
          onMouseLeave={(e) => e.target.style.background = 'transparent'}
        >
          <i className="fas fa-sign-out-alt" style={{ width: '20px', textAlign: 'center' }}></i>
          Log Out
        </a>
      </div>
    </aside>
  );
}

export default AdminSidebar;
