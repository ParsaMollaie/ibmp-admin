import {
  getProfile,
  login as loginAPI,
  logout as logoutAPI,
} from '@/services/auth';
import { history } from '@umijs/max';
import { message } from 'antd';
import Cookies from 'js-cookie';
import { useCallback, useState } from 'react';

export default function useUserModel() {
  // State to hold the current user's profile information
  const [currentUser, setCurrentUser] = useState<API.UserInfo | null>(null);
  const [loading, setLoading] = useState(false);

  // Fetch the current user's profile from the server
  const fetchUserProfile = useCallback(async () => {
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

  // Handle user login: authenticate, store token, fetch profile, redirect
  const login = useCallback(
    async (payload: { username: string; password: string }) => {
      setLoading(true);
      try {
        const response = await loginAPI(payload);

        if (response.success) {
          // Store the access token in a cookie (expires in 30 days)
          Cookies.set('token', response.data.access_token, { expires: 30 });

          // Fetch the user's profile immediately after login
          await fetchUserProfile();

          // Redirect to home page
          history.push('/');
        } else {
          throw new Error(response.message || 'Login failed');
        }
      } finally {
        setLoading(false);
      }
    },
    [fetchUserProfile],
  );

  // Handle user logout: call API, clear token, reset state, redirect
  const logout = useCallback(async () => {
    try {
      await logoutAPI();
      message.success('خروج با موفقیت انجام شد');
    } catch (error) {
      // Even if the API call fails, we still want to clear local state
      message.error('خطا در ارتباط با سرور');
    } finally {
      // Always clear the token and redirect, regardless of API success
      Cookies.remove('token');
      setCurrentUser(null);
      history.push('/auth');
    }
  }, []);

  return {
    currentUser,
    loading,
    login,
    logout,
    fetchUserProfile,
  };
}
