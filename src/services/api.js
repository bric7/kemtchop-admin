const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000';
export const apiClient = axios.create({ baseURL: API_BASE });