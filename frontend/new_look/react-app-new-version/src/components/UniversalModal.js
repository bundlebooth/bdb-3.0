import React, { useEffect } from 'react';
import './UniversalModal.css';

/**
 * Universal Modal Component
 * Provides consistent modal styling across the application
 * 
 * Props:
 * - isOpen: boolean - controls modal visibility
 * - onClose: function - called when modal should close
 * - title: string - modal header title
 * - children: React nodes - modal body content
 * - footer: React nodes - custom footer content (optional)
 * - primaryAction: { label: string, onClick: function, loading?: boolean } - primary button config
 * - secondaryAction: { label: string, onClick: function } - secondary button config (optional, defaults to Cancel)
 * - size: 'small' | 'medium' | 'large' - modal width (default: medium)
 * - showFooter: boolean - whether to show footer (default: true)
 * - variant: 'default' | 'warning' | 'success' | 'danger' - modal style variant
 * - icon: React node - optional icon to show in header area
 */

const UniversalModal = ({
  isOpen,
  onClose,
  title,
  children,
  footer,
  primaryAction,
  secondaryAction,
  size = 'medium',
  showFooter = true,
  variant = 'default',
  icon,
  footerCentered = false
}) => {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }
    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    small: 'um-modal-small',
    medium: 'um-modal-medium',
    large: 'um-modal-large'
  };

  // Removed backdrop click to close - modals can only be closed via X button or explicit actions

  return (
    <div className="um-backdrop">
      <div className={`um-modal ${sizeClasses[size] || sizeClasses.medium}`}>
        {/* Modal Header */}
        <div className="um-header">
          <div className="um-header-content">
            {icon && <div className="um-header-icon">{icon}</div>}
            <h3 className="um-title">{title}</h3>
          </div>
          <button className="um-close-btn" onClick={onClose} aria-label="Close modal">
            <span>×</span>
          </button>
        </div>

        {/* Modal Body */}
        <div className="um-body">
          {children}
        </div>

        {/* Modal Footer */}
        {showFooter && (
          <div className={`um-footer ${footerCentered ? 'um-footer-centered' : ''}`}>
            {footer ? (
              footer
            ) : (
              <>
                {secondaryAction !== false && (
                  <button
                    type="button"
                    className="um-btn um-btn-secondary"
                    onClick={secondaryAction?.onClick || onClose}
                  >
                    {secondaryAction?.label || 'Cancel'}
                  </button>
                )}
                {primaryAction && (
                  <button
                    type="button"
                    className={`um-btn um-btn-primary ${primaryAction.loading ? 'um-btn-loading' : ''}`}
                    onClick={primaryAction.onClick}
                    disabled={primaryAction.loading}
                  >
                    {primaryAction.loading ? (
                      <>
                        <i className="fas fa-spinner fa-spin"></i>
                        <span>Loading...</span>
                      </>
                    ) : (
                      primaryAction.label
                    )}
                  </button>
                )}
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

/**
 * Confirmation Modal - A preset modal for confirmations/warnings
 */
export const ConfirmationModal = ({
  isOpen,
  onClose,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  onConfirm,
  variant = 'warning',
  icon
}) => {
  const variantIcons = {
    warning: <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '28px' }}></i>,
    danger: <i className="fas fa-exclamation-circle" style={{ color: '#ef4444', fontSize: '28px' }}></i>,
    success: <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '28px' }}></i>,
    info: <i className="fas fa-info-circle" style={{ color: '#5086E8', fontSize: '28px' }}></i>
  };

  const variantColors = {
    warning: '#fef3c7',
    danger: '#fee2e2',
    success: '#d1fae5',
    info: '#dbeafe'
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      primaryAction={{ label: confirmLabel, onClick: onConfirm }}
      secondaryAction={{ label: cancelLabel, onClick: onClose }}
    >
      <div className="um-confirmation-content">
        <div 
          className="um-confirmation-icon"
          style={{ background: variantColors[variant] || variantColors.warning }}
        >
          {icon || variantIcons[variant] || variantIcons.warning}
        </div>
        <p className="um-confirmation-message">{message}</p>
      </div>
    </UniversalModal>
  );
};

/**
 * Detail Modal - For viewing details with sections
 */
export const DetailModal = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'large',
  actions
}) => {
  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      footer={
        <div className="um-footer-actions">
          {actions}
          <button type="button" className="um-btn um-btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      }
    >
      {children}
    </UniversalModal>
  );
};

/**
 * Form Modal - For forms with save/cancel actions
 */
export const FormModal = ({
  isOpen,
  onClose,
  title,
  children,
  onSave,
  saving = false,
  saveLabel = 'Save',
  cancelLabel = 'Cancel',
  size = 'medium',
  disabled = false
}) => {
  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size={size}
      primaryAction={{
        label: saving ? 'Saving...' : saveLabel,
        onClick: onSave,
        loading: saving,
        disabled: disabled || saving
      }}
      secondaryAction={{ label: cancelLabel, onClick: onClose }}
    >
      {children}
    </UniversalModal>
  );
};

/**
 * Delete Confirmation Modal - Preset for delete confirmations
 */
export const DeleteModal = ({
  isOpen,
  onClose,
  title = 'Confirm Delete',
  itemName,
  onConfirm,
  loading = false
}) => {
  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      primaryAction={{
        label: loading ? 'Deleting...' : 'Delete',
        onClick: onConfirm,
        loading
      }}
      secondaryAction={{ label: 'Cancel', onClick: onClose }}
    >
      <div className="um-confirmation-content">
        <div className="um-confirmation-icon" style={{ background: '#fee2e2' }}>
          <i className="fas fa-trash-alt" style={{ color: '#ef4444', fontSize: '28px' }}></i>
        </div>
        <p className="um-confirmation-message">
          Are you sure you want to delete {itemName ? <strong>{itemName}</strong> : 'this item'}? 
          This action cannot be undone.
        </p>
      </div>
    </UniversalModal>
  );
};

/**
 * Alert Modal - For showing alerts/info
 */
export const AlertModal = ({
  isOpen,
  onClose,
  title,
  message,
  variant = 'info',
  buttonLabel = 'OK'
}) => {
  const variantIcons = {
    warning: <i className="fas fa-exclamation-triangle" style={{ color: '#f59e0b', fontSize: '28px' }}></i>,
    danger: <i className="fas fa-exclamation-circle" style={{ color: '#ef4444', fontSize: '28px' }}></i>,
    success: <i className="fas fa-check-circle" style={{ color: '#10b981', fontSize: '28px' }}></i>,
    info: <i className="fas fa-info-circle" style={{ color: '#5086E8', fontSize: '28px' }}></i>
  };

  const variantColors = {
    warning: '#fef3c7',
    danger: '#fee2e2',
    success: '#d1fae5',
    info: '#dbeafe'
  };

  return (
    <UniversalModal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="small"
      primaryAction={{ label: buttonLabel, onClick: onClose }}
      secondaryAction={false}
      footerCentered
    >
      <div className="um-confirmation-content">
        <div 
          className="um-confirmation-icon"
          style={{ background: variantColors[variant] }}
        >
          {variantIcons[variant]}
        </div>
        <p className="um-confirmation-message">{message}</p>
      </div>
    </UniversalModal>
  );
};

export default UniversalModal;
