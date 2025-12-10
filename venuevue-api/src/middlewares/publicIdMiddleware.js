/**
 * Public ID Middleware
 * 
 * Automatically resolves public IDs in route parameters to internal numeric IDs.
 * This middleware intercepts requests and decodes any public IDs found in common parameter names.
 */

const {
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
  decodePackageId,
  decodeImageId,
  isPublicId,
  extractPublicIdFromSlug,
} = require('../utils/hashIds');

/**
 * Map of parameter names to their decode functions
 */
const paramDecoders = {
  // Vendor IDs
  vendorId: decodeVendorId,
  vendorProfileId: decodeVendorId,
  vendorSlug: (slug) => {
    // Handle slug format: "business-name-publicId"
    const publicId = extractPublicIdFromSlug(slug);
    if (publicId) {
      return decodeVendorId(publicId);
    }
    // Fallback: try to decode the entire slug
    return decodeVendorId(slug);
  },
  
  // User IDs
  userId: decodeUserId,
  
  // Booking IDs
  bookingId: decodeBookingId,
  
  // Invoice IDs
  invoiceId: decodeInvoiceId,
  
  // Service IDs
  serviceId: decodeServiceId,
  
  // Category IDs
  categoryId: decodeCategoryId,
  
  // Conversation IDs
  conversationId: decodeConversationId,
  
  // Message IDs
  messageId: decodeMessageId,
  
  // Notification IDs
  notificationId: decodeNotificationId,
  
  // Review IDs
  reviewId: decodeReviewId,
  
  // Package IDs
  packageId: decodePackageId,
  
  // Image IDs
  imageId: decodeImageId,
  photoId: decodeImageId,
};

/**
 * Middleware to resolve public IDs in route parameters
 */
function resolvePublicIds(req, res, next) {
  // Store original params for reference
  req.originalParams = { ...req.params };
  
  // Process each parameter
  for (const [paramName, value] of Object.entries(req.params)) {
    if (!value) continue;
    
    // Check if we have a decoder for this parameter
    const decoder = paramDecoders[paramName];
    if (decoder) {
      // Only decode if it looks like a public ID (not a numeric ID)
      if (isPublicId(value) || paramName === 'vendorSlug') {
        const decodedId = decoder(value);
        if (decodedId !== null) {
          req.params[paramName] = decodedId;
          // Also store the resolved internal ID with a standard name
          req.params[`${paramName}Internal`] = decodedId;
        }
      } else if (/^\d+$/.test(value)) {
        // It's a numeric ID - keep as is but parse to int
        req.params[paramName] = parseInt(value, 10);
      }
    }
    
    // Handle generic 'id' parameter based on route context
    if (paramName === 'id') {
      // Try to determine the entity type from the route path
      const path = req.baseUrl + req.path;
      let decoder = null;
      
      if (path.includes('/vendor')) decoder = decodeVendorId;
      else if (path.includes('/booking')) decoder = decodeBookingId;
      else if (path.includes('/user')) decoder = decodeUserId;
      else if (path.includes('/invoice')) decoder = decodeInvoiceId;
      else if (path.includes('/service')) decoder = decodeServiceId;
      else if (path.includes('/message')) decoder = decodeMessageId;
      else if (path.includes('/conversation')) decoder = decodeConversationId;
      else if (path.includes('/notification')) decoder = decodeNotificationId;
      else if (path.includes('/review')) decoder = decodeReviewId;
      
      if (decoder && isPublicId(value)) {
        const decodedId = decoder(value);
        if (decodedId !== null) {
          req.params.id = decodedId;
          req.params.idInternal = decodedId;
        }
      } else if (/^\d+$/.test(value)) {
        req.params.id = parseInt(value, 10);
      }
    }
  }
  
  // Also process query parameters for common ID fields
  if (req.query) {
    for (const [queryName, value] of Object.entries(req.query)) {
      if (!value) continue;
      
      const decoder = paramDecoders[queryName];
      if (decoder && isPublicId(value)) {
        const decodedId = decoder(value);
        if (decodedId !== null) {
          req.query[queryName] = decodedId;
        }
      } else if (decoder && /^\d+$/.test(value)) {
        req.query[queryName] = parseInt(value, 10);
      }
    }
  }
  
  // Process request body for common ID fields
  if (req.body && typeof req.body === 'object') {
    for (const [bodyKey, value] of Object.entries(req.body)) {
      if (!value || typeof value !== 'string') continue;
      
      const decoder = paramDecoders[bodyKey];
      if (decoder && isPublicId(value)) {
        const decodedId = decoder(value);
        if (decodedId !== null) {
          req.body[bodyKey] = decodedId;
        }
      }
    }
  }
  
  next();
}

/**
 * Middleware specifically for vendor routes with slug format
 */
function resolveVendorSlug(req, res, next) {
  const { vendorSlug } = req.params;
  
  if (vendorSlug) {
    // Store original slug
    req.originalVendorSlug = vendorSlug;
    
    // Try to extract public ID from slug (format: "business-name-publicId")
    const publicId = extractPublicIdFromSlug(vendorSlug);
    
    if (publicId) {
      const internalId = decodeVendorId(publicId);
      if (internalId !== null) {
        req.params.vendorId = internalId;
        req.vendorPublicId = publicId;
      }
    } else if (/^\d+$/.test(vendorSlug)) {
      // Fallback: if it's just a numeric ID (legacy support)
      req.params.vendorId = parseInt(vendorSlug, 10);
    } else {
      // Try decoding the entire slug as a public ID
      const internalId = decodeVendorId(vendorSlug);
      if (internalId !== null) {
        req.params.vendorId = internalId;
        req.vendorPublicId = vendorSlug;
      }
    }
  }
  
  next();
}

/**
 * Middleware specifically for booking routes
 */
function resolveBookingId(req, res, next) {
  const { bookingId, id } = req.params;
  const idValue = bookingId || id;
  
  if (idValue) {
    req.originalBookingId = idValue;
    
    if (isPublicId(idValue)) {
      const internalId = decodeBookingId(idValue);
      if (internalId !== null) {
        req.params.bookingId = internalId;
        req.params.id = internalId;
        req.bookingPublicId = idValue;
      }
    } else if (/^\d+$/.test(idValue)) {
      req.params.bookingId = parseInt(idValue, 10);
      req.params.id = parseInt(idValue, 10);
    }
  }
  
  next();
}

/**
 * Middleware specifically for invoice routes
 */
function resolveInvoiceId(req, res, next) {
  const { invoiceId, id } = req.params;
  const idValue = invoiceId || id;
  
  if (idValue) {
    req.originalInvoiceId = idValue;
    
    if (isPublicId(idValue)) {
      const internalId = decodeInvoiceId(idValue);
      if (internalId !== null) {
        req.params.invoiceId = internalId;
        req.params.id = internalId;
        req.invoicePublicId = idValue;
      }
    } else if (/^\d+$/.test(idValue)) {
      req.params.invoiceId = parseInt(idValue, 10);
      req.params.id = parseInt(idValue, 10);
    }
  }
  
  next();
}

module.exports = {
  resolvePublicIds,
  resolveVendorSlug,
  resolveBookingId,
  resolveInvoiceId,
};
