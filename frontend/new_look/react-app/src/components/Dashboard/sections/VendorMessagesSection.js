import React from 'react';
import ClientMessagesSection from './ClientMessagesSection';

// Vendor messages work the same as client messages
function VendorMessagesSection({ onSectionChange }) {
  return <ClientMessagesSection onSectionChange={onSectionChange} />;
}

export default VendorMessagesSection;
