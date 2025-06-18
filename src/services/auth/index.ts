import Cookies from 'js-cookie';
import { request } from 'umi';

const API_BASE = '/api/v1/admin';

export async function login(data: { username: string; password: string }) {
  return request(`${API_BASE}/login`, {
    method: 'POST',
    data,
  });
}

export async function logout() {
  return request(`${API_BASE}/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${Cookies.get('token')}` },
  });
}

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
  return request(`${API_BASE}/users/${id}`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${Cookies.get('token')}`,
    },
    data,
  });
}

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
