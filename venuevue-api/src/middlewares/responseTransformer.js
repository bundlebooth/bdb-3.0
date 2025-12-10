/**
 * Response Transformer Middleware
 * 
 * Automatically transforms API responses to include public IDs
 * and optionally remove internal numeric IDs from responses.
 */

const {
  encodeVendorId,
  encodeUserId,
  encodeBookingId,
  encodeInvoiceId,
  encodeServiceId,
  encodeCategoryId,
  encodeConversationId,
  encodeMessageId,
  encodeNotificationId,
  encodeReviewId,
  encodeTransactionId,
  encodePackageId,
  encodeAnnouncementId,
  encodeFaqId,
  encodeImageId,
} = require('../utils/hashIds');

/**
 * Map of internal ID field names to their encode functions and public ID field names
 */
const idFieldMappings = {
  // Vendor IDs
  VendorProfileID: { encode: encodeVendorId, publicField: 'vendorPublicId' },
  vendorProfileId: { encode: encodeVendorId, publicField: 'vendorPublicId' },
  VendorID: { encode: encodeVendorId, publicField: 'vendorPublicId' },
  vendorId: { encode: encodeVendorId, publicField: 'vendorPublicId' },
  
  // User IDs
  UserID: { encode: encodeUserId, publicField: 'userPublicId' },
  userId: { encode: encodeUserId, publicField: 'userPublicId' },
  ClientUserID: { encode: encodeUserId, publicField: 'clientPublicId' },
  
  // Booking IDs
  BookingID: { encode: encodeBookingId, publicField: 'bookingPublicId' },
  bookingId: { encode: encodeBookingId, publicField: 'bookingPublicId' },
  
  // Invoice IDs
  InvoiceID: { encode: encodeInvoiceId, publicField: 'invoicePublicId' },
  invoiceId: { encode: encodeInvoiceId, publicField: 'invoicePublicId' },
  
  // Service IDs
  ServiceID: { encode: encodeServiceId, publicField: 'servicePublicId' },
  serviceId: { encode: encodeServiceId, publicField: 'servicePublicId' },
  
  // Category IDs
  CategoryID: { encode: encodeCategoryId, publicField: 'categoryPublicId' },
  categoryId: { encode: encodeCategoryId, publicField: 'categoryPublicId' },
  
  // Conversation IDs
  ConversationID: { encode: encodeConversationId, publicField: 'conversationPublicId' },
  conversationId: { encode: encodeConversationId, publicField: 'conversationPublicId' },
  
  // Message IDs
  MessageID: { encode: encodeMessageId, publicField: 'messagePublicId' },
  messageId: { encode: encodeMessageId, publicField: 'messagePublicId' },
  
  // Notification IDs
  NotificationID: { encode: encodeNotificationId, publicField: 'notificationPublicId' },
  notificationId: { encode: encodeNotificationId, publicField: 'notificationPublicId' },
  
  // Review IDs
  ReviewID: { encode: encodeReviewId, publicField: 'reviewPublicId' },
  reviewId: { encode: encodeReviewId, publicField: 'reviewPublicId' },
  
  // Transaction IDs
  TransactionID: { encode: encodeTransactionId, publicField: 'transactionPublicId' },
  transactionId: { encode: encodeTransactionId, publicField: 'transactionPublicId' },
  
  // Package IDs
  PackageID: { encode: encodePackageId, publicField: 'packagePublicId' },
  packageId: { encode: encodePackageId, publicField: 'packagePublicId' },
  
  // Announcement IDs
  AnnouncementID: { encode: encodeAnnouncementId, publicField: 'announcementPublicId' },
  announcementId: { encode: encodeAnnouncementId, publicField: 'announcementPublicId' },
  
  // FAQ IDs
  FAQID: { encode: encodeFaqId, publicField: 'faqPublicId' },
  faqId: { encode: encodeFaqId, publicField: 'faqPublicId' },
  
  // Image IDs
  ImageID: { encode: encodeImageId, publicField: 'imagePublicId' },
  imageId: { encode: encodeImageId, publicField: 'imagePublicId' },
  PhotoID: { encode: encodeImageId, publicField: 'photoPublicId' },
  photoId: { encode: encodeImageId, publicField: 'photoPublicId' },
  VendorImageID: { encode: encodeImageId, publicField: 'imagePublicId' },
};

/**
 * Primary ID fields that should get a 'publicId' field (the main entity ID)
 */
const primaryIdFields = [
  'VendorProfileID', 'vendorProfileId',
  'UserID', 'userId',
  'BookingID', 'bookingId',
  'InvoiceID', 'invoiceId',
  'ServiceID', 'serviceId',
  'CategoryID', 'categoryId',
  'ConversationID', 'conversationId',
  'MessageID', 'messageId',
  'NotificationID', 'notificationId',
  'ReviewID', 'reviewId',
  'TransactionID', 'transactionId',
  'PackageID', 'packageId',
  'AnnouncementID', 'announcementId',
  'FAQID', 'faqId',
  'ImageID', 'imageId', 'PhotoID', 'photoId', 'VendorImageID',
];

/**
 * Recursively transform an object to add public IDs
 */
function transformObject(obj, options = {}) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  // Handle arrays
  if (Array.isArray(obj)) {
    return obj.map(item => transformObject(item, options));
  }
  
  // Handle objects
  const transformed = { ...obj };
  let hasPrimaryId = false;
  let primaryPublicId = null;
  
  for (const [key, value] of Object.entries(obj)) {
    // Check if this is an ID field we need to transform
    const mapping = idFieldMappings[key];
    if (mapping && value !== null && value !== undefined) {
      const publicId = mapping.encode(value);
      if (publicId) {
        // Add the public ID field
        transformed[mapping.publicField] = publicId;
        
        // Check if this is a primary ID field
        if (primaryIdFields.includes(key) && !hasPrimaryId) {
          transformed.publicId = publicId;
          primaryPublicId = publicId;
          hasPrimaryId = true;
        }
        
        // Optionally remove the internal ID
        if (options.removeInternalIds) {
          delete transformed[key];
        }
      }
    }
    
    // Recursively transform nested objects
    if (value && typeof value === 'object') {
      transformed[key] = transformObject(value, options);
    }
  }
  
  return transformed;
}

/**
 * Middleware that intercepts res.json() to transform responses
 */
function responseTransformer(options = {}) {
  return (req, res, next) => {
    // Store the original json method
    const originalJson = res.json.bind(res);
    
    // Override res.json to transform the response
    res.json = function(data) {
      try {
        // Transform the response data
        const transformed = transformObject(data, options);
        return originalJson(transformed);
      } catch (error) {
        console.error('Error transforming response:', error);
        // If transformation fails, send original data
        return originalJson(data);
      }
    };
    
    next();
  };
}

/**
 * Helper function to transform a single vendor object
 */
function transformVendor(vendor, options = {}) {
  return transformObject(vendor, options);
}

/**
 * Helper function to transform a list of vendors
 */
function transformVendorList(vendors, options = {}) {
  if (!Array.isArray(vendors)) return vendors;
  return vendors.map(v => transformObject(v, options));
}

/**
 * Helper function to transform a booking object
 */
function transformBooking(booking, options = {}) {
  return transformObject(booking, options);
}

/**
 * Helper function to transform a user object
 */
function transformUser(user, options = {}) {
  return transformObject(user, options);
}

module.exports = {
  responseTransformer,
  transformObject,
  transformVendor,
  transformVendorList,
  transformBooking,
  transformUser,
};
