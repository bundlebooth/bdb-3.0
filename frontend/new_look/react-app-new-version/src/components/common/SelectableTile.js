import React from 'react';

/**
 * Universal SelectableTile component for consistent tile selection UI
 * Used for multi-select options like Service Location, Features, etc.
 * 
 * Style: White with grey border when unselected, grey background when selected
 * 
 * @param {string} label - Display text for the tile
 * @param {boolean} isSelected - Whether the tile is currently selected
 * @param {function} onClick - Click handler
 * @param {string} icon - Optional FontAwesome icon class (e.g., 'fa-check')
 * @param {string} iconColor - Color for the icon (default: type-specific color)
 * @param {boolean} showCheckmark - Show checkmark icon when selected (default: true)
 * @param {string} size - 'small' | 'medium' | 'large' (default: 'medium')
 */
function SelectableTile({ 
  label, 
  isSelected, 
  onClick, 
  icon,
  iconColor = '#6b7280',
  showCheckmark = true,
  size = 'medium',
  disabled = false
}) {
  const sizeStyles = {
    small: { padding: '0.5rem 0.75rem', fontSize: '0.8rem' },
    medium: { padding: '0.75rem 1rem', fontSize: '0.875rem' },
    large: { padding: '1rem 1.25rem', fontSize: '0.95rem' }
  };

  const baseStyle = {
    ...sizeStyles[size],
    borderRadius: '8px',
    cursor: disabled ? 'not-allowed' : 'pointer',
    transition: 'all 0.15s ease',
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.5rem',
    background: isSelected ? '#f3f4f6' : 'white',
    border: isSelected ? 'none' : '1px solid #d1d5db',
    color: '#374151',
    fontWeight: 400,
    opacity: disabled ? 0.5 : 1
  };

  return (
    <div
      onClick={disabled ? undefined : onClick}
      style={baseStyle}
      role="button"
      tabIndex={disabled ? -1 : 0}
      onKeyPress={(e) => {
        if (!disabled && (e.key === 'Enter' || e.key === ' ')) {
          onClick();
        }
      }}
    >
      {icon && (
        <i className={`fas ${icon}`} style={{ color: iconColor, fontSize: '0.9em' }}></i>
      )}
      <span>{label}</span>
      {showCheckmark && isSelected && (
        <i className="fas fa-check" style={{ color: '#6b7280', fontSize: '0.8em' }}></i>
      )}
    </div>
  );
}

/**
 * Container for SelectableTile components with consistent spacing
 */
export function SelectableTileGroup({ children, style }) {
  return (
    <div style={{ 
      display: 'flex', 
      flexWrap: 'wrap', 
      gap: '0.625rem',
      ...style 
    }}>
      {children}
    </div>
  );
}

export default SelectableTile;
