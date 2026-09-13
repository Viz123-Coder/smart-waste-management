/*
  Every network call the frontend makes goes through this one file.
  If your Flask backend ever moves (different port, deployed URL), you
  only need to change VITE_API_BASE_URL in .env - no other file changes.
*/
import axios from 'axios'

const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api'

const client = axios.create({ baseURL: BASE_URL, timeout: 10000 })

export const api = {
  getBins: () => client.get('/bins').then(r => r.data),
  getBin: (binId) => client.get(`/bins/${binId}`).then(r => r.data),
  getReadings: (binId, limit = 50) => client.get(`/readings/${binId}`, { params: { limit } }).then(r => r.data),
  getPredictions: () => client.get('/predictions').then(r => r.data),
  getPrediction: (binId, refresh = false) =>
    client.get(`/predictions/${binId}`, { params: refresh ? { refresh: 'true' } : {} }).then(r => r.data),
  getAlerts: (status) => client.get('/alerts', { params: status ? { status } : {} }).then(r => r.data),
  resolveAlert: (id) => client.put(`/alerts/${id}/resolve`).then(r => r.data),
  getCollections: () => client.get('/collections').then(r => r.data),
  recordCollection: (payload) => client.post('/collections', payload).then(r => r.data),
  getDumpingReports: (status) => client.get('/dumping-reports', { params: status ? { status } : {} }).then(r => r.data),
  createDumpingReport: (payload) => client.post('/dumping-reports', payload).then(r => r.data),
  updateDumpingReport: (id, status) => client.put(`/dumping-reports/${id}`, { status }).then(r => r.data),
  getOptimizedRoute: (minStatus = 'full') => client.get('/route-optimize', { params: { min_status: minStatus } }).then(r => r.data),
  sendTestReading: (payload) => client.post('/sensor-data', payload).then(r => r.data),
}

export default api
