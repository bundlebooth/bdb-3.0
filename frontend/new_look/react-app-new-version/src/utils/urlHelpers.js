import { 
  encodeVendorId, 
  encodeBookingId, 
  encodeInvoiceId,
  encodeServiceId,
  getVendorPublicId,
  extractVendorIdFromSlug as hashExtractVendorId
} from './hashIds';

export const createSlug = (text) => {
  if (!text) return '';
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const generateImpressionId = () => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 15);
  return 'p3_' + timestamp + '_' + random;
};

/**
 * Build vendor profile URL using obfuscated public ID
 * Format: /vendor/business-name-XzA91Qb3
 */
export const buildVendorProfileUrl = (vendor, options = {}) => {
  // Get the public ID (either from vendor object or encode the internal ID)
  const publicId = getVendorPublicId(vendor);
  if (!publicId) {
    console.warn('Could not generate public ID for vendor:', vendor);
    return '/vendor/unknown';
  }
  
  const businessName = vendor.BusinessName || vendor.name || 'vendor';
  const slug = createSlug(businessName);
  const baseUrl = '/vendor/' + slug + '-' + publicId;
  
  const params = new URLSearchParams();
  if (options.source) params.append('source', options.source);
  if (options.category) params.append('category', options.category);
  if (options.photoId) params.append('photo_id', options.photoId);
  if (options.previousSection) params.append('previous_page_section_name', options.previousSection);
  params.append('impression_id', generateImpressionId());
  if (options.searchQuery) params.append('search_query', options.searchQuery);
  if (options.location) params.append('location', options.location);
  if (options.date) params.append('date', options.date);
  const queryString = params.toString();
  return queryString ? baseUrl + '?' + queryString : baseUrl;
};

/**
 * Build booking URL using obfuscated public ID
 * Format: /booking/business-name-XzA91Qb3
 */
export const buildBookingUrl = (vendor, options = {}) => {
  // Get the public ID (either from vendor object or encode the internal ID)
  const publicId = getVendorPublicId(vendor);
  if (!publicId) {
    console.warn('Could not generate public ID for vendor:', vendor);
    return '/booking/unknown';
  }
  
  const businessName = vendor.BusinessName || vendor.name || 'vendor';
  const slug = createSlug(businessName);
  const baseUrl = '/booking/' + slug + '-' + publicId;
  
  const params = new URLSearchParams();
  if (options.checkIn) params.append('check_in', options.checkIn);
  if (options.guests) params.append('guests', options.guests);
  // Encode service ID if provided
  if (options.serviceId) {
    const servicePublicId = encodeServiceId(options.serviceId);
    if (servicePublicId) {
      params.append('service_id', servicePublicId);
    }
  }
  if (options.source) params.append('source', options.source);
  params.append('impression_id', generateImpressionId());
  const queryString = params.toString();
  return queryString ? baseUrl + '?' + queryString : baseUrl;
};

/**
 * Build invoice URL using obfuscated public ID
 * Format: /invoice/XzA91Qb3 or /invoice/booking/XzA91Qb3
 */
export const buildInvoiceUrl = (invoiceOrBookingId, isBookingId = false) => {
  if (isBookingId) {
    const publicId = encodeBookingId(invoiceOrBookingId);
    return publicId ? `/invoice/booking/${publicId}` : '/invoice/unknown';
  }
  const publicId = encodeInvoiceId(invoiceOrBookingId);
  return publicId ? `/invoice/${publicId}` : '/invoice/unknown';
};

export const buildBecomeVendorUrl = (options = {}) => {
  const baseUrl = '/become-a-vendor';
  const params = new URLSearchParams();
  if (options.source) params.append('source', options.source);
  if (options.ref) params.append('ref', options.ref);
  if (options.step) params.append('step', options.step);
  params.append('impression_id', generateImpressionId());
  const queryString = params.toString();
  return queryString ? baseUrl + '?' + queryString : baseUrl;
};

/**
 * Extract vendor ID from slug - supports both old numeric format and new public ID format
 * Old format: "business-name-28" -> 28
 * New format: "business-name-XzA91Qb3" -> decoded internal ID
 */
export const extractVendorIdFromSlug = (slugWithId) => {
  if (!slugWithId) return null;
  
  // Use the hashIds utility which handles both formats
  const decodedId = hashExtractVendorId(slugWithId);
  if (decodedId !== null) {
    return decodedId;
  }
  
  // Fallback: try old numeric format
  const match = slugWithId.match(/-(\d+)$/);
  return match ? parseInt(match[1], 10) : null;
};

export const parseQueryParams = (search) => {
  const params = new URLSearchParams(search);
  const result = {};
  for (const [key, value] of params.entries()) {
    result[key] = value;
  }
  return result;
};

export const updateUrlParams = (params) => {
  const url = new URL(window.location);
  Object.entries(params).forEach(([key, value]) => {
    if (value === null || value === undefined) {
      url.searchParams.delete(key);
    } else {
      url.searchParams.set(key, value);
    }
  });
  window.history.replaceState({}, '', url);
};

export const trackPageView = (pageName, params = {}) => {
};

export const trackEvent = (eventName, params = {}) => {
};
