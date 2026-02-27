import { request } from 'umi';

const API_BASE = '/api/v1/admin';

// Get all settings as key-value object
export async function getSettings() {
  return request<API.ApiResponse<API.SettingsData>>(`${API_BASE}/settings`, {
    method: 'GET',
  });
}

// Save (upsert) settings
export async function saveSettings(data: Partial<API.SettingsData>) {
  return request<API.ApiResponse<API.SettingsData>>(`${API_BASE}/settings`, {
    method: 'POST',
    data,
  });
}
