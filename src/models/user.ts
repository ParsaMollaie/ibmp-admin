import {
  getProfile,
  login as loginAPI,
  logout as logoutAPI,
} from '@/services/auth';
import { history, useModel } from '@umijs/max';
import { message } from 'antd';
import Cookies from 'js-cookie';
import { useCallback, useState } from 'react';

/* ---------- Types ---------- */

interface LoginPayload {
  username: string;
  password: string;
}

interface UseUserModelReturn {
  currentUser: API.UserInfo | null;
  loading: boolean;
  login: (payload: LoginPayload) => Promise<void>;
  logout: () => Promise<void>;
  fetchUserProfile: () => Promise<API.UserInfo | null>;
}

/* ---------- Hook ---------- */

export default function useUserModel(): UseUserModelReturn {
  const [currentUser, setCurrentUser] = useState<API.UserInfo | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  // ✅ Explicitly type refresh
  const { refresh }: { refresh: () => Promise<void> } =
    useModel('@@initialState');

  const fetchUserProfile =
    useCallback(async (): Promise<API.UserInfo | null> => {
      try {
        const response = await getProfile();
        if (response.success) {
          setCurrentUser(response.data);
          return response.data;
        }
        return null;
      } catch (error) {
        console.error('Failed to fetch user profile:', error);
        return null;
      }
    }, []);

  const login = useCallback(
    async (payload: LoginPayload): Promise<void> => {
      setLoading(true);
      try {
        const response = await loginAPI(payload);

        if (!response.success) {
          throw new Error(response.message || 'Login failed');
        }

        Cookies.set('token', response.data.access_token, { expires: 30 });
        await fetchUserProfile();
        history.push('/');
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile],
  );

  const logout = useCallback(async (): Promise<void> => {
    try {
      await logoutAPI();
      message.success('خروج با موفقیت انجام شد');
    } catch {
      message.error('خطا در ارتباط با سرور');
    } finally {
      Cookies.remove('token');
      setCurrentUser(null);
      await refresh();
      history.replace('/auth');
    }
  }, [refresh]);

  return {
    currentUser,
    loading,
    login,
    logout,
    fetchUserProfile,
  };
}
