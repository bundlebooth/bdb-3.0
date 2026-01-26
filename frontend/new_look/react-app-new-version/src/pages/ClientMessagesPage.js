import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import Header from '../components/Header';
import UnifiedMessagesSection from '../components/Dashboard/sections/UnifiedMessagesSection';
import MobileBottomNav from '../components/MobileBottomNav';
import './ClientPage.css';

function ClientMessagesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  
  const navItems = [
    { path: '/client/bookings', label: 'My Bookings', icon: 'fas fa-calendar-check' },
    { path: '/client/messages', label: 'Messages', icon: 'fas fa-comments' },
    { path: '/client/favorites', label: 'Favorites', icon: 'fas fa-heart' },
    { path: '/client/reviews', label: 'Reviews', icon: 'fas fa-star' },
    { path: '/client/invoices', label: 'Invoices', icon: 'fas fa-file-invoice' },
    { path: '/client/settings', label: 'Settings', icon: 'fas fa-cog' },
  ];

  return (
    <div className="client-page">
      <Header />
      <div className="client-page-container">
        <aside className="client-page-sidebar">
          <h1 className="client-page-sidebar-title">Messages</h1>
          <nav className="client-page-sidebar-nav">
            {navItems.map(item => (
              <button
                key={item.path}
                className={`client-page-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                onClick={() => navigate(item.path)}
              >
                <i className={item.icon}></i>
                {item.label}
              </button>
            ))}
          </nav>
        </aside>
        <main className="client-page-main">
          <div className="client-page-content">
            <UnifiedMessagesSection />
          </div>
        </main>
      </div>
      <MobileBottomNav />
    </div>
  );
}

export default ClientMessagesPage;
