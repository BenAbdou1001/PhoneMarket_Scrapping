import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30000,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response.data;
  },
  (error) => {
    const message = error.response?.data?.error?.message || error.message || 'An error occurred';
    return Promise.reject(new Error(message));
  }
);

// Phone API
export const phoneAPI = {
  getPhones: (params) => api.get('/phones', { params }),
  getPhoneById: (id) => api.get(`/phones/${id}`),
  getPhoneListings: (id) => api.get(`/phones/${id}/listings`),
  getPriceHistory: (id, days = 30) => api.get(`/phones/${id}/price-history`, { params: { days } }),
  getBrands: () => api.get('/phones/meta/brands'),
  getPriceRange: () => api.get('/phones/meta/price-range')
};

// Analytics API
export const analyticsAPI = {
  getMarketplaceStats: () => api.get('/analytics/marketplace-stats'),
  getTrending: (limit = 10) => api.get('/analytics/trending', { params: { limit } }),
  getPriceTrends: (days = 30) => api.get('/analytics/price-trends', { params: { days } }),
  getPopularity: (limit = 20) => api.get('/analytics/popularity', { params: { limit } }),
  getCategoryDistribution: () => api.get('/analytics/category-distribution'),
  getBrandDistribution: () => api.get('/analytics/brand-distribution'),
  getStockAnalysis: () => api.get('/analytics/stock-analysis'),
  getScrapingPerformance: (days = 7) => api.get('/analytics/scraping-performance', { params: { days } }),
  getDashboardStats: () => api.get('/analytics/dashboard-stats'),
  comparePhones: (ids) => api.get('/analytics/compare', { params: { ids: ids.join(',') } })
};

// Admin API
export const adminAPI = {
  getJobs: () => api.get('/admin/jobs'),
  triggerJob: (marketplace) => api.post(`/admin/jobs/${marketplace}/trigger`),
  updateJobSchedule: (marketplace, hours) => api.put(`/admin/jobs/${marketplace}/schedule`, { hours }),
  getLogs: (params) => api.get('/admin/logs', { params }),
  getDatabaseStats: () => api.get('/admin/database-stats'),
  getHealth: () => api.get('/admin/health'),
  cleanup: (days) => api.post('/admin/cleanup', { days })
};

export default api;
