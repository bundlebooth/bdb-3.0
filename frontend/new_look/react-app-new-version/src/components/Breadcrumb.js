import React from 'react';

const Breadcrumb = ({ items }) => {
  return (
    <nav style={{
      padding: '1rem 0',
      fontSize: '0.875rem',
      color: '#6b7280'
    }}>
      <div style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        flexWrap: 'wrap'
      }}>
        {items.map((item, index) => (
          <React.Fragment key={index}>
            <span style={{
              color: index === items.length - 1 ? '#111827' : '#6b7280',
              fontWeight: index === items.length - 1 ? '600' : '400'
            }}>
              {item}
            </span>
            {index < items.length - 1 && (
              <span style={{ color: '#d1d5db' }}>{'>'}</span>
            )}
          </React.Fragment>
        ))}
      </div>
    </nav>
  );
};

export default Breadcrumb;
