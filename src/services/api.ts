import axios, { AxiosResponse } from 'axios';
import { 
  AuthResponse, 
  LoginRequest, 
  CreateUserRequest, 
  User, 
  Meter, 
  MeterReading, 
  Bill, 
  BillingSummary,
  PaginatedResponse
} from '../types';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

console.log('API Base URL:', API_BASE_URL);

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth-token');
  if (token) {
    (config.headers as any).Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth-token');
      localStorage.removeItem('user-data');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (data: LoginRequest): Promise<AuthResponse> => {
    const response: AxiosResponse<AuthResponse> = await api.post('/auth/login', data);
    return response.data;
  },
  
  getProfile: async (): Promise<{ user: User }> => {
    const response: AxiosResponse<{ user: User }> = await api.get('/auth/profile');
    return response.data;
  },
  
  createUser: async (data: CreateUserRequest): Promise<{ message: string; user: User; generatedPassword?: string }> => {
    const response = await api.post('/auth/users', data);
    return response.data;
  },
  
  getAllUsers: async (): Promise<{ users: User[] }> => {
    const response: AxiosResponse<{ users: User[] }> = await api.get('/auth/users');
    return response.data;
  },
  
  resetUserPassword: async (userId: string): Promise<{ message: string; newPassword: string; user: any }> => {
    const response = await api.post(`/auth/users/${userId}/reset-password`);
    return response.data;
  },
  
  updateUser: async (userId: string, data: { name?: string; role?: string }): Promise<{ message: string; user: User }> => {
    const response = await api.put(`/auth/users/${userId}`, data);
    return response.data;
  },
  
  deleteUser: async (userId: string): Promise<{ message: string }> => {
    const response = await api.delete(`/auth/users/${userId}`);
    return response.data;
  },
};

// Meters API
export const metersAPI = {
  getAll: async (landlordId?: string): Promise<{ meters: Meter[] }> => {
    const params = landlordId ? { landlordId } : {};
    const response = await api.get('/meters', { params });
    return response.data;
  },
  
  getById: async (id: string): Promise<{ meter: Meter }> => {
    const response = await api.get(`/meters/${id}`);
    return response.data;
  },
  
  create: async (data: {
    meterNumber: string;
    plotNumber: string;
    landlordId: string;
    coordinates?: string;
    location?: string;
  }): Promise<{ message: string; meter: Meter }> => {
    const response = await api.post('/meters', data);
    return response.data;
  },
  
  update: async (id: string, data: {
    plotNumber?: string;
    coordinates?: string;
    location?: string;
    isActive?: boolean;
  }): Promise<{ message: string; meter: Meter }> => {
    const response = await api.put(`/meters/${id}`, data);
    return response.data;
  },
};

// Readings API
export const readingsAPI = {
  getAll: async (meterId?: string, page = 1, limit = 20): Promise<PaginatedResponse<MeterReading>> => {
    const params = { 
      ...(meterId && { meterId }), 
      page: page.toString(), 
      limit: limit.toString() 
    };
    const response = await api.get('/readings', { params });
    return {
      data: response.data.readings,
      pagination: response.data.pagination,
    };
  },
  
  getById: async (id: string): Promise<{ reading: MeterReading }> => {
    const response = await api.get(`/readings/${id}`);
    return response.data;
  },
  
  create: async (data: { meterId: string; reading: number; photo: File }): Promise<{ message: string; reading: MeterReading; bill?: any }> => {
    const form = new FormData();
    form.append('meterId', data.meterId);
    form.append('reading', data.reading.toString());
    form.append('photo', data.photo);
    const response = await api.post('/readings', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  },
};

// Bills API
export const billsAPI = {
  getAll: async (status?: string, landlordId?: string, page = 1, limit = 20): Promise<PaginatedResponse<Bill>> => {
    const params = { 
      ...(status && { status }), 
      ...(landlordId && { landlordId }), 
      page: page.toString(), 
      limit: limit.toString() 
    };
    const response = await api.get('/bills', { params });
    return {
      data: response.data.bills,
      pagination: response.data.pagination,
    };
  },
  
  getById: async (id: string): Promise<{ bill: Bill }> => {
    const response = await api.get(`/bills/${id}`);
    return response.data;
  },
  
  markAsPaid: async (id: string): Promise<{ message: string; bill: Bill }> => {
    const response = await api.patch(`/bills/${id}/pay`);
    return response.data;
  },
  
  getSummary: async (): Promise<{ summary: BillingSummary }> => {
    const response = await api.get('/bills/summary');
    return response.data;
  },
  
  updateOverdue: async (): Promise<{ message: string; updatedCount: number }> => {
    const response = await api.post('/bills/update-overdue');
    return response.data;
  },
};

// Settings API
export const settingsAPI = {
  getKwhRate: async (): Promise<{ key: string; value: string }> => {
    const response = await api.get('/settings/kwh-rate');
    return response.data;
  },
  updateKwhRate: async (value: number, password: string): Promise<{ message: string; key: string; value: string }> => {
    const response = await api.put('/settings/kwh-rate', { value, password });
    return response.data;
  },
};

export default api;