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

export const buildVendorProfileUrl = (vendor, options = {}) => {
  const vendorId = vendor.VendorProfileID || vendor.id;
  const businessName = vendor.BusinessName || vendor.name || 'vendor';
  const slug = createSlug(businessName);
  const baseUrl = '/vendor/' + slug + '-' + vendorId;
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

export const buildBookingUrl = (vendor, options = {}) => {
  const vendorId = vendor.VendorProfileID || vendor.id;
  const businessName = vendor.BusinessName || vendor.name || 'vendor';
  const slug = createSlug(businessName);
  const baseUrl = '/booking/' + slug + '-' + vendorId;
  const params = new URLSearchParams();
  if (options.checkIn) params.append('check_in', options.checkIn);
  if (options.guests) params.append('guests', options.guests);
  if (options.serviceId) params.append('service_id', options.serviceId);
  if (options.source) params.append('source', options.source);
  params.append('impression_id', generateImpressionId());
  const queryString = params.toString();
  return queryString ? baseUrl + '?' + queryString : baseUrl;
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

export const extractVendorIdFromSlug = (slugWithId) => {
  if (!slugWithId) return null;
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
  console.log('Page View:', pageName, params);
};

export const trackEvent = (eventName, params = {}) => {
  console.log('Event:', eventName, params);
};
