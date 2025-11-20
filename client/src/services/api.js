const API_BASE_URL = 'http://localhost:5000/api';

// Get auth token from localStorage
const getToken = () => {
  return localStorage.getItem('token');
};

// Get refresh token from localStorage
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken');
};

// Make authenticated API request
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken();
  
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const config = {
    ...options,
    headers,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    const data = await response.json();
    
    if (!response.ok) {
      throw new Error(data.message || `HTTP error! status: ${response.status}`);
    }
    
    return data;
  } catch (error) {
    console.error('API Request Error:', error);
    throw error;
  }
};

// User Profile APIs
export const getUserProfile = () => apiRequest('/user/profile');
export const getNGODashboardStats = () => apiRequest('/ngo/dashboard-stats');
export const getCorporateDashboardStats = () => apiRequest('/corporate/dashboard-stats');

// Auth APIs
export const logout = () => apiRequest('/auth/logout', { method: 'POST' });

// NGO Projects APIs
export const createNGOProject = (projectData) => 
  apiRequest('/ngo/projects', {
    method: 'POST',
    body: JSON.stringify(projectData),
  });

export const getNGOProjects = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/ngo/projects${queryString ? `?${queryString}` : ''}`);
};

export const updateNGOProject = (projectId, updates) =>
  apiRequest(`/ngo/projects/${projectId}`, {
    method: 'PUT',
    body: JSON.stringify(updates),
  });

export const deleteNGOProject = (projectId) =>
  apiRequest(`/ngo/projects/${projectId}`, {
    method: 'DELETE',
  });

// CSR Requests APIs (NGO side)
export const getNGORequests = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/ngo/csr-requests${queryString ? `?${queryString}` : ''}`);
};

export const acceptCSRRequest = (requestId, response = null) =>
  apiRequest(`/ngo/csr-requests/${requestId}/accept`, {
    method: 'POST',
    body: JSON.stringify({ response }),
  });

export const rejectCSRRequest = (requestId, reason = null) =>
  apiRequest(`/ngo/csr-requests/${requestId}/reject`, {
    method: 'POST',
    body: JSON.stringify({ reason }),
  });

// Active Partnerships APIs
export const getNGOPartnerships = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/ngo/partnerships${queryString ? `?${queryString}` : ''}`);
};

export const updatePartnershipProgress = (partnershipId, progress) =>
  apiRequest(`/partnerships/${partnershipId}/progress`, {
    method: 'PUT',
    body: JSON.stringify({ progress }),
  });

// Corporate Projects APIs
export const getCorporateProjects = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/corporate/projects${queryString ? `?${queryString}` : ''}`);
};

export const updateCorporateProjectStatus = (projectId, payload) =>
  apiRequest(`/corporate/projects/${projectId}/status`, {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });

export const getCorporateProjectMessages = (projectId) =>
  apiRequest(`/corporate/projects/${projectId}/messages`);

export const postCorporateProjectMessage = (projectId, message) =>
  apiRequest(`/corporate/projects/${projectId}/messages`, {
    method: 'POST',
    body: JSON.stringify(message),
  });

// Corporate Requests APIs
export const getCorporateRequests = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/corporate/requests${queryString ? `?${queryString}` : ''}`);
};

export const createCorporateRequest = (payload) =>
  apiRequest('/corporate/requests', {
    method: 'POST',
    body: JSON.stringify(payload),
  });

// Corporate Connections / Shortlist
export const getCorporateConnections = (params = {}) => {
  const queryString = new URLSearchParams(params).toString();
  return apiRequest(`/corporate/connections${queryString ? `?${queryString}` : ''}`);
};

export const saveCorporateNgo = (ngoId) =>
  apiRequest(`/corporate/connections/${ngoId}/save`, {
    method: 'POST',
  });

export const removeCorporateNgo = (ngoId) =>
  apiRequest(`/corporate/connections/${ngoId}/save`, {
    method: 'DELETE',
  });

// Corporate Activity
export const getCorporateActivity = () => apiRequest('/corporate/activity');





