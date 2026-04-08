export const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://university-event-club-management-system.onrender.com';

export const getApiUrl = (path) => `${API_BASE_URL}${path.startsWith('/') ? '' : '/'}${path}`;

// For local dev
if (process.env.NODE_ENV === 'development') {
  console.log('Using API_BASE_URL:', API_BASE_URL);
}
