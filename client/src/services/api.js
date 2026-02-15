import axios from 'axios';

const API_BASE = '/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// Request interceptor to add auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/vote')) {
        window.location.href = '/admin/login';
      }
    }
    return Promise.reject(error);
  }
);

// Auth
export const adminLogin = (data) => api.post('/auth/login', data);
export const adminRegister = (data) => api.post('/auth/register', data);
export const voterLogin = (data) => api.post('/auth/voter-login', data);
export const getMe = () => api.get('/auth/me');

// Elections
export const getElections = () => api.get('/elections');
export const getElection = (id) => api.get(`/elections/${id}`);
export const createElection = (data) => api.post('/elections', data);
export const updateElection = (id, data) => api.put(`/elections/${id}`, data);
export const deleteElection = (id) => api.delete(`/elections/${id}`);
export const getElectionBallot = (id) => api.get(`/elections/${id}/ballot`);

// Candidates & Positions
export const addPosition = (data) => api.post('/candidates/positions', data);
export const updatePosition = (id, data) => api.put(`/candidates/positions/${id}`, data);
export const deletePosition = (id) => api.delete(`/candidates/positions/${id}`);
export const addCandidate = (data) => api.post('/candidates', data);
export const updateCandidate = (id, data) => api.put(`/candidates/${id}`, data);
export const deleteCandidate = (id) => api.delete(`/candidates/${id}`);

// Voters
export const getVoters = (electionId) => api.get(`/voters/${electionId}`);
export const addVoter = (data) => api.post('/voters', data);
export const bulkAddVoters = (data) => api.post('/voters/bulk', data);
export const deleteVoter = (id) => api.delete(`/voters/${id}`);
export const regenerateCode = (id) => api.post(`/voters/${id}/regenerate-code`);

// Votes
export const castVote = (data) => api.post('/votes', data);
export const getVoteStatus = () => api.get('/votes/status');

// Analytics
export const getElectionResults = (id) => api.get(`/analytics/${id}/results`);
export const getElectionStats = (id) => api.get(`/analytics/${id}/stats`);
export const getPublicResults = (id) => api.get(`/analytics/${id}/public-results`);

export default api;
