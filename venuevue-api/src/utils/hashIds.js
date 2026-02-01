/**
 * HashID Utility Module
 * 
 * Provides obfuscated public IDs for all database entities.
 * Uses different salts for each entity type to ensure unique encodings.
 * 
 * Usage:
 *   const { encodeVendorId, decodeVendorId } = require('./utils/hashIds');
 *   const publicId = encodeVendorId(28);  // Returns something like "XzA91Qb3"
 *   const internalId = decodeVendorId("XzA91Qb3");  // Returns 28
 */

const Hashids = require('hashids');

// Configuration - Use environment variable or default salt
// IMPORTANT: In production, set HASHID_SALT environment variable
const BASE_SALT = process.env.HASHID_SALT || 'd4f1b8c0e7a24f56a9c3e1b77f08d92c4eb1a6f53d7e9c0fa2b14ce8f937ab10';
const MIN_LENGTH = 14; // Minimum length for generated IDs (increased from 8 for better security)
const ALPHABET = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

// Create separate Hashids instances for each entity type
// Using different salts ensures the same numeric ID produces different public IDs for different entities
const hashids = {
  vendor: new Hashids(`${BASE_SALT}_vendor`, MIN_LENGTH, ALPHABET),
  user: new Hashids(`${BASE_SALT}_user`, MIN_LENGTH, ALPHABET),
  booking: new Hashids(`${BASE_SALT}_booking`, MIN_LENGTH, ALPHABET),
  invoice: new Hashids(`${BASE_SALT}_invoice`, MIN_LENGTH, ALPHABET),
  service: new Hashids(`${BASE_SALT}_service`, MIN_LENGTH, ALPHABET),
  category: new Hashids(`${BASE_SALT}_category`, MIN_LENGTH, ALPHABET),
  conversation: new Hashids(`${BASE_SALT}_conversation`, MIN_LENGTH, ALPHABET),
  message: new Hashids(`${BASE_SALT}_message`, MIN_LENGTH, ALPHABET),
  notification: new Hashids(`${BASE_SALT}_notification`, MIN_LENGTH, ALPHABET),
  review: new Hashids(`${BASE_SALT}_review`, MIN_LENGTH, ALPHABET),
  transaction: new Hashids(`${BASE_SALT}_transaction`, MIN_LENGTH, ALPHABET),
  package: new Hashids(`${BASE_SALT}_package`, MIN_LENGTH, ALPHABET),
  announcement: new Hashids(`${BASE_SALT}_announcement`, MIN_LENGTH, ALPHABET),
  faq: new Hashids(`${BASE_SALT}_faq`, MIN_LENGTH, ALPHABET),
  image: new Hashids(`${BASE_SALT}_image`, MIN_LENGTH, ALPHABET),
};

// ============================================
// ENCODING FUNCTIONS (Internal ID -> Public ID)
// ============================================

function encodeVendorId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.vendor.encode(parseInt(id));
}

function encodeUserId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.user.encode(parseInt(id));
}

function encodeBookingId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.booking.encode(parseInt(id));
}

function encodeInvoiceId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.invoice.encode(parseInt(id));
}

function encodeServiceId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.service.encode(parseInt(id));
}

function encodeCategoryId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.category.encode(parseInt(id));
}

function encodeConversationId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.conversation.encode(parseInt(id));
}

function encodeMessageId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.message.encode(parseInt(id));
}

function encodeNotificationId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.notification.encode(parseInt(id));
}

function encodeReviewId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.review.encode(parseInt(id));
}

function encodeTransactionId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.transaction.encode(parseInt(id));
}

function encodePackageId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.package.encode(parseInt(id));
}

function encodeAnnouncementId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.announcement.encode(parseInt(id));
}

function encodeFaqId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.faq.encode(parseInt(id));
}

function encodeImageId(id) {
  if (!id || isNaN(parseInt(id))) return null;
  return hashids.image.encode(parseInt(id));
}

// ============================================
// DECODING FUNCTIONS (Public ID -> Internal ID)
// ============================================

// Strict decode helper - verifies the ID re-encodes to the same value (prevents tampering)
function strictDecode(hashidInstance, publicId) {
  if (!publicId) return null;
  const decoded = hashidInstance.decode(publicId);
  if (decoded.length === 0) return null;
  // Re-encode and verify it matches exactly (prevents padded/tampered IDs)
  const reEncoded = hashidInstance.encode(decoded[0]);
  if (reEncoded !== publicId) return null;
  return decoded[0];
}

function decodeVendorId(publicId) {
  return strictDecode(hashids.vendor, publicId);
}

function decodeUserId(publicId) {
  return strictDecode(hashids.user, publicId);
}

function decodeBookingId(publicId) {
  return strictDecode(hashids.booking, publicId);
}

function decodeInvoiceId(publicId) {
  return strictDecode(hashids.invoice, publicId);
}

function decodeServiceId(publicId) {
  return strictDecode(hashids.service, publicId);
}

function decodeCategoryId(publicId) {
  return strictDecode(hashids.category, publicId);
}

function decodeConversationId(publicId) {
  return strictDecode(hashids.conversation, publicId);
}

function decodeMessageId(publicId) {
  return strictDecode(hashids.message, publicId);
}

function decodeNotificationId(publicId) {
  return strictDecode(hashids.notification, publicId);
}

function decodeReviewId(publicId) {
  return strictDecode(hashids.review, publicId);
}

function decodeTransactionId(publicId) {
  return strictDecode(hashids.transaction, publicId);
}

function decodePackageId(publicId) {
  return strictDecode(hashids.package, publicId);
}

function decodeAnnouncementId(publicId) {
  return strictDecode(hashids.announcement, publicId);
}

function decodeFaqId(publicId) {
  return strictDecode(hashids.faq, publicId);
}

function decodeImageId(publicId) {
  return strictDecode(hashids.image, publicId);
}

// ============================================
// GENERIC ENCODE/DECODE BY TYPE
// ============================================

function encodeId(type, id) {
  if (!hashids[type]) {
    console.warn(`Unknown entity type for encoding: ${type}`);
    return null;
  }
  if (!id || isNaN(parseInt(id))) return null;
  return hashids[type].encode(parseInt(id));
}

function decodeId(type, publicId) {
  if (!hashids[type]) {
    console.warn(`Unknown entity type for decoding: ${type}`);
    return null;
  }
  return strictDecode(hashids[type], publicId);
}

// ============================================
// HELPER: Check if a string looks like a public ID vs numeric ID
// ============================================

function isPublicId(idString) {
  if (!idString) return false;
  // If it's purely numeric, it's likely an internal ID
  if (/^\d+$/.test(idString)) return false;
  // If it contains only valid hashid characters and is at least MIN_LENGTH, it's likely a public ID
  return /^[a-zA-Z0-9]+$/.test(idString) && idString.length >= MIN_LENGTH;
}

// ============================================
// HELPER: Extract ID from slug (e.g., "business-name-XzA91Qb3" -> "XzA91Qb3")
// ============================================

function extractPublicIdFromSlug(slug) {
  if (!slug) return null;
  // Try to extract the last segment after the last hyphen
  const parts = slug.split('-');
  if (parts.length > 0) {
    const lastPart = parts[parts.length - 1];
    // Check if it looks like a public ID (not purely numeric)
    if (isPublicId(lastPart)) {
      return lastPart;
    }
  }
  // If the entire slug is a public ID
  if (isPublicId(slug)) {
    return slug;
  }
  return null;
}

// ============================================
// HELPER: Transform object to replace internal IDs with public IDs
// ============================================

function transformVendorResponse(vendor) {
  if (!vendor) return vendor;
  
  const transformed = { ...vendor };
  
  // Add public IDs
  if (vendor.VendorProfileID) {
    transformed.publicId = encodeVendorId(vendor.VendorProfileID);
  }
  if (vendor.UserID) {
    transformed.userPublicId = encodeUserId(vendor.UserID);
  }
  
  // Transform nested services
  if (vendor.services && Array.isArray(vendor.services)) {
    transformed.services = vendor.services.map(service => ({
      ...service,
      publicId: encodeServiceId(service.ServiceID),
    }));
  }
  
  // Transform nested categories
  if (vendor.categories && Array.isArray(vendor.categories)) {
    transformed.categories = vendor.categories.map(cat => ({
      ...cat,
      publicId: encodeCategoryId(cat.CategoryID),
    }));
  }
  
  return transformed;
}

function transformBookingResponse(booking) {
  if (!booking) return booking;
  
  const transformed = { ...booking };
  
  if (booking.BookingID) {
    transformed.publicId = encodeBookingId(booking.BookingID);
  }
  if (booking.VendorProfileID) {
    transformed.vendorPublicId = encodeVendorId(booking.VendorProfileID);
  }
  if (booking.UserID) {
    transformed.userPublicId = encodeUserId(booking.UserID);
  }
  if (booking.ServiceID) {
    transformed.servicePublicId = encodeServiceId(booking.ServiceID);
  }
  
  return transformed;
}

function transformUserResponse(user) {
  if (!user) return user;
  
  const transformed = { ...user };
  
  if (user.UserID) {
    transformed.publicId = encodeUserId(user.UserID);
  }
  if (user.VendorProfileID) {
    transformed.vendorPublicId = encodeVendorId(user.VendorProfileID);
  }
  
  return transformed;
}

function transformInvoiceResponse(invoice) {
  if (!invoice) return invoice;
  
  const transformed = { ...invoice };
  
  if (invoice.InvoiceID) {
    transformed.publicId = encodeInvoiceId(invoice.InvoiceID);
  }
  if (invoice.BookingID) {
    transformed.bookingPublicId = encodeBookingId(invoice.BookingID);
  }
  if (invoice.VendorProfileID) {
    transformed.vendorPublicId = encodeVendorId(invoice.VendorProfileID);
  }
  if (invoice.UserID) {
    transformed.userPublicId = encodeUserId(invoice.UserID);
  }
  
  return transformed;
}

function transformServiceResponse(service) {
  if (!service) return service;
  
  const transformed = { ...service };
  
  if (service.ServiceID) {
    transformed.publicId = encodeServiceId(service.ServiceID);
  }
  if (service.VendorProfileID) {
    transformed.vendorPublicId = encodeVendorId(service.VendorProfileID);
  }
  if (service.CategoryID) {
    transformed.categoryPublicId = encodeCategoryId(service.CategoryID);
  }
  
  return transformed;
}

// ============================================
// EXPORTS
// ============================================

module.exports = {
  // Individual encode functions
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
  
  // Individual decode functions
  decodeVendorId,
  decodeUserId,
  decodeBookingId,
  decodeInvoiceId,
  decodeServiceId,
  decodeCategoryId,
  decodeConversationId,
  decodeMessageId,
  decodeNotificationId,
  decodeReviewId,
  decodeTransactionId,
  decodePackageId,
  decodeAnnouncementId,
  decodeFaqId,
  decodeImageId,
  
  // Generic functions
  encodeId,
  decodeId,
  
  // Helpers
  isPublicId,
  extractPublicIdFromSlug,
  
  // Transform functions
  transformVendorResponse,
  transformBookingResponse,
  transformUserResponse,
  transformInvoiceResponse,
  transformServiceResponse,
};
