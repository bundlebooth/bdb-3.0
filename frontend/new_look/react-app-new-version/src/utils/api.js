/**
 * Centralized API Helper
 * Single source of truth for API requests with authentication
 * Reduces duplicated fetch patterns across the codebase
 */

import { API_BASE_URL } from '../config';

/**
 * Get authorization headers with token
 * @returns {Object} Headers object with Authorization
 */
export function getAuthHeaders() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get authorization header only (for FormData requests)
 * @returns {Object} Headers object with Authorization only
 */
export function getAuthHeaderOnly() {
  const token = localStorage.getItem('token');
  return {
    'Authorization': `Bearer ${token}`
  };
}

/**
 * Make an authenticated GET request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiGet(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    method: 'GET',
    headers: getAuthHeaders(),
    ...options
  });
}

/**
 * Make an authenticated POST request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPost(endpoint, data = {}, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    method: 'POST',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    ...options
  });
}

/**
 * Make an authenticated PUT request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} data - Request body data
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPut(endpoint, data = {}, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    method: 'PUT',
    headers: getAuthHeaders(),
    body: JSON.stringify(data),
    ...options
  });
}

/**
 * Make an authenticated DELETE request
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiDelete(endpoint, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    method: 'DELETE',
    headers: getAuthHeaders(),
    ...options
  });
}

/**
 * Make an authenticated POST request with FormData (for file uploads)
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {FormData} formData - FormData object
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPostFormData(endpoint, formData, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    method: 'POST',
    headers: getAuthHeaderOnly(),
    body: formData,
    ...options
  });
}

/**
 * Make an authenticated PUT request with FormData (for file uploads)
 * @param {string} endpoint - API endpoint (without base URL)
 * @param {FormData} formData - FormData object
 * @param {Object} options - Additional fetch options
 * @returns {Promise<Response>} Fetch response
 */
export async function apiPutFormData(endpoint, formData, options = {}) {
  const url = endpoint.startsWith('http') ? endpoint : `${API_BASE_URL}${endpoint}`;
  return fetch(url, {
    method: 'PUT',
    headers: getAuthHeaderOnly(),
    body: formData,
    ...options
  });
}

/**
 * Helper to handle API response and extract JSON
 * @param {Response} response - Fetch response
 * @returns {Promise<Object>} Parsed JSON data
 * @throws {Error} If response is not ok
 */
export async function handleApiResponse(response) {
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.message || data.error || 'API request failed');
  }
  return data;
}

/**
 * Combined helper: Make GET request and parse response
 * @param {string} endpoint - API endpoint
 * @returns {Promise<Object>} Parsed JSON data
 */
export async function fetchApi(endpoint) {
  const response = await apiGet(endpoint);
  return handleApiResponse(response);
}

/**
 * Combined helper: Make POST request and parse response
 * @param {string} endpoint - API endpoint
 * @param {Object} data - Request body data
 * @returns {Promise<Object>} Parsed JSON data
 */
export async function postApi(endpoint, data) {
  const response = await apiPost(endpoint, data);
  return handleApiResponse(response);
}
