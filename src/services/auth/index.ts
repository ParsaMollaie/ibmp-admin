import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Auth endpoints
export async function login(data: { username: string; password: string }) {
  return request<API.ApiResponse<API.LoginResponse>>(`${API_BASE}/login`, {
    method: 'POST',
    data,
  });
}

export async function logout() {
  // No need for manual Authorization header - interceptor handles it
  return request<API.ApiResponse<[]>>(`${API_BASE}/logout`, {
    method: 'POST',
  });
}

export async function getProfile() {
  return request<API.ApiResponse<API.UserInfo>>(`${API_BASE}/profile`, {
    method: 'GET',
  });
}

// User management endpoints
export async function getUsers(params?: any) {
  return request(`${API_BASE}/users`, {
    method: 'GET',
    params,
  });
}

export async function addUser(data: {
  username: string;
  password: string;
  user_type: 'admin' | 'client';
  email: string;
  first_name: string;
  last_name: string;
  avatar?: string | null;
}) {
  return request(`${API_BASE}/users`, {
    method: 'POST',
    data,
  });
}

export async function updateUser(
  id: string | number,
  data: {
    first_name?: string;
    last_name?: string;
    avatar?: string | null;
  },
) {
  // No need for manual Authorization header - interceptor handles it
  return request(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    data,
  });
}

// Slider endpoints
export async function getSliders(params?: any) {
  return request(`${API_BASE}/sliders`, {
    method: 'GET',
    params,
  });
}

export async function createSlider(data: FormData) {
  return request(`${API_BASE}/sliders`, {
    method: 'POST',
    data,
  });
}

export async function updateSlider(id: string, data: FormData) {
  return request(`${API_BASE}/sliders/${id}`, {
    method: 'PUT',
    data,
  });
}

// Social Networks endpoints
export async function getSocialNetworks(params?: any) {
  return request(`${API_BASE}/social-networks`, {
    method: 'GET',
    params,
  });
}

export async function createSocialNetwork(data: FormData) {
  return request(`${API_BASE}/social-networks`, {
    method: 'POST',
    data,
  });
}

export async function updateSocialNetwork(id: string, data: FormData) {
  return request(`${API_BASE}/social-networks/${id}`, {
    method: 'PUT',
    data,
  });
}

// News endpoints
export async function getNewsList(params?: any) {
  return request(`${API_BASE}/news`, {
    method: 'GET',
    params,
  });
}

export async function createNews(data: FormData) {
  return request(`${API_BASE}/news`, {
    method: 'POST',
    data,
  });
}

export async function updateNews(id: string, data: FormData) {
  return request(`${API_BASE}/news/${id}`, {
    method: 'PUT',
    data,
  });
}
