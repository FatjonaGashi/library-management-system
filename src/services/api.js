// api.js

// Base API URL
const API_BASE_URL = process.env.REACT_APP_API_URL || '/api';

// Get default headers (with optional auth)
const getHeaders = () => {
  const token = localStorage.getItem('token');
  return {
    'Content-Type': 'application/json',
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};

// Handle API responses
const handleResponse = async (response) => {
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.message || `HTTP error ${response.status}`);
  return data;
};

// --- Auth API ---
const authAPI = {
  login: async (email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ email, password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  register: async (name, email, password) => {
    const res = await fetch(`${API_BASE_URL}/auth/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ name, email, password }),
    });
    const data = await handleResponse(res);
    if (data.token) {
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
    }
    return data;
  },

  update: async (userData) => {
    const res = await fetch(`${API_BASE_URL}/auth/update`, {
      method: 'PUT',
      headers: getHeaders(),
      body: JSON.stringify(userData),
    });
    const data = await handleResponse(res);
    if (data.user) localStorage.setItem('user', JSON.stringify(data.user));
    return data;
  },

  logout: () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser: () => {
    const user = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    return user && token ? { ...JSON.parse(user), token } : null;
  },
};

// --- Books API ---
const booksAPI = {
  getAll: () => fetch(`${API_BASE_URL}/books`, { headers: getHeaders() }).then(handleResponse),
  getById: (id) => fetch(`${API_BASE_URL}/books/${id}`, { headers: getHeaders() }).then(handleResponse),
  create: (bookData) =>
    fetch(`${API_BASE_URL}/books`, { method: 'POST', headers: getHeaders(), body: JSON.stringify(bookData) }).then(handleResponse),
  update: (id, bookData) =>
    fetch(`${API_BASE_URL}/books/${id}`, { method: 'PUT', headers: getHeaders(), body: JSON.stringify(bookData) }).then(handleResponse),
  delete: (id) => fetch(`${API_BASE_URL}/books/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

// --- Users API ---
const usersAPI = {
  getAll: () => fetch(`${API_BASE_URL}/users`, { headers: getHeaders() }).then(handleResponse),
  delete: (id) => fetch(`${API_BASE_URL}/users/${id}`, { method: 'DELETE', headers: getHeaders() }).then(handleResponse),
};

// --- AI API ---
const aiAPI = {
  query: (query) =>
    fetch(`${API_BASE_URL}/ai/query`, { method: 'POST', headers: getHeaders(), body: JSON.stringify({ query }) }).then(handleResponse),
};

// --- Export all APIs ---
const apiService = {
  auth: authAPI,
  books: booksAPI,
  users: usersAPI,
  ai: aiAPI,
};

export default apiService;
