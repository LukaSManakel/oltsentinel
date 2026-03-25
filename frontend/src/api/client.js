import axios from 'axios';
const api = axios.create({ baseURL: '/api' });
export const getStats = () => api.get('/dashboard/stats').then(r => r.data);
export const getOffline = (params) => api.get('/dashboard/offline', { params }).then(r => r.data);
export const getPowerIssues = () => api.get('/dashboard/power-issues').then(r => r.data);
export const getRankingOLTs = () => api.get('/dashboard/ranking-olts').then(r => r.data);
export const getTrend = () => api.get('/dashboard/trend').then(r => r.data);
