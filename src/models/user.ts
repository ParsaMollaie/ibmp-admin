import { login as loginAPI, logout as logoutAPI } from '@/services/auth';
import { history } from '@umijs/max';
import { message } from 'antd';
import Cookies from 'js-cookie';
import { useCallback } from 'react';
import { token } from 'stylis';

export default function useUserModel() {
  const login = useCallback(
    async (payload: { username: string; password: string }) => {
      const response = await loginAPI(payload);
      Cookies.set('token', response.data.access_token, { expires: 30 });
      history.push('/');
    },
    [],
  );

  const logout = useCallback(async () => {
    try {
      await logoutAPI();
      message.success('خروج با موفقیت انجام شد');
    } catch (error) {
      message.error('خطا در ارتباط با سرور');
    } finally {
      Cookies.remove('token');
      history.push('/auth');
    }
  }, []);

  return {
    token,
    login,
    logout,
  };
}
