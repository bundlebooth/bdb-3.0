import React from 'react';

function DashboardSidebar({ menuItems, activeSection, onSectionChange, onLogout, sectionLabel, unified }) {
  return (
    <aside className="dashboard-sidebar">
      <div 
        className="logo" 
        style={{ 
          padding: '1rem 0', 
          borderBottom: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center' 
        }}
      >
        <img 
          src="/planhive_logo.svg" 
          alt="PlanHive" 
          style={{ height: '40px', width: 'auto' }} 
        />
      </div>
      <ul className="dashboard-menu">
        {unified ? (
          // Unified menu with CLIENT and VENDOR sections
          menuItems.map((section, idx) => (
            <React.Fragment key={idx}>
              <li className="menu-heading">
                {section.section}
              </li>
              {section.items.map(item => (
                <li key={item.id}>
                  <a 
                    href="#" 
                    className={activeSection === item.id ? 'active' : ''} 
                    data-section={item.id}
                    onClick={(e) => {
                      e.preventDefault();
                      onSectionChange(item.id);
                    }}
                  >
                    <i className={`fas ${item.icon}`}></i>
                    {item.label}
                  </a>
                </li>
              ))}
            </React.Fragment>
          ))
        ) : (
          // Single section menu (legacy)
          <>
            {sectionLabel && (
              <li className="menu-heading">
                {sectionLabel}
              </li>
            )}
            {menuItems.map(item => (
              <li key={item.id}>
                <a 
                  href="#" 
                  className={activeSection === item.id ? 'active' : ''} 
                  data-section={item.id}
                  onClick={(e) => {
                    e.preventDefault();
                    onSectionChange(item.id);
                  }}
                >
                  <i className={`fas ${item.icon}`}></i>
                  {item.label}
                </a>
              </li>
            ))}
          </>
        )}
        <li>
          <a 
            href="#" 
            id="logout-dashboard"
            onClick={(e) => {
              e.preventDefault();
              onLogout();
            }}
          >
            <i className="fas fa-sign-out-alt"></i>
            Log Out
          </a>
        </li>
      </ul>
    </aside>
  );
}

export default DashboardSidebar;
