import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token && config.headers) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export interface RegisterPayload {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

export interface LoginPayload {
  email: string;
  password: string;
}

export interface UserProfileBasics {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
}


export const registerUser = async (payload: RegisterPayload) => {
  const response = await api.post('/auth/register', payload);
  return response.data as {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
  };
};

export const loginUser = async (payload: LoginPayload) => {
  const response = await api.post('/auth/login', payload);
  return response.data as { access_token: string };
};

export const getMyProfile = async () => {
  const response = await api.get('/users/me');
  return response.data as UserProfileBasics;
};

export default api;
