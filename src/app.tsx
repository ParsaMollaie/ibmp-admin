import { getProfile } from '@/services/auth';
import { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { ConfigProvider, theme as antdTheme } from 'antd';
import faIR from 'antd/locale/fa_IR';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import { StyleSheetManager } from 'styled-components';
import rtlPlugin from 'stylis-plugin-rtl';
import type { RuntimeConfig } from 'umi';
import { history } from 'umi';
import logo from './assets/images/logo.svg';
import UserAvatar from './components/UserAvatar';
import './global.less';

dayjs.locale('fa');

// Define pages that don't require authentication
const PUBLIC_PATHS = ['/auth'];

/**
 * getInitialState runs once when the app first loads.
 * It checks for an existing token and fetches the user's profile.
 * The returned data becomes available via useModel('@@initialState').
 */
export async function getInitialState(): Promise<{
  currentUser?: API.UserInfo;
}> {
  const token = Cookies.get('token');
  const currentPath = history.location.pathname;

  // If no token and not on a public page, redirect to auth
  if (!token) {
    if (!PUBLIC_PATHS.includes(currentPath)) {
      history.push('/auth');
    }
    return { currentUser: undefined };
  }

  // Token exists, try to fetch the user's profile
  try {
    const response = await getProfile();
    if (response.success) {
      return { currentUser: response.data };
    }
    // If profile fetch fails (e.g., invalid token), clear and redirect
    Cookies.remove('token');
    if (!PUBLIC_PATHS.includes(currentPath)) {
      history.push('/auth');
    }
    return { currentUser: undefined };
  } catch (error) {
    // Network error or server error - clear token and redirect
    Cookies.remove('token');
    if (!PUBLIC_PATHS.includes(currentPath)) {
      history.push('/auth');
    }
    return { currentUser: undefined };
  }
}

export const request: RequestConfig = {
  timeout: 30000,
  errorConfig: {
    errorHandler: (error: any) => {
      const { response } = error;
      if (response && response.status === 401) {
        Cookies.remove('token');
        window.location.href = '/auth';
      }
      throw error;
    },
  },
  requestInterceptors: [
    (url, options) => {
      const token = Cookies.get('token');
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`,
        };
      }
      return { url, options };
    },
  ],
  responseInterceptors: [
    (response) => {
      return response;
    },
  ],
};

export const layout: RunTimeLayoutConfig = ({ initialState }) => {
  return {
    logo: logo,
    menu: {
      locale: false,
    },
    layout: 'mix',
    navTheme: 'light',
    onPageChange: () => {
      const currentPath = history.location.pathname;

      // Use initialState to check if user is authenticated
      if (!initialState?.currentUser && !PUBLIC_PATHS.includes(currentPath)) {
        history.push('/auth');
      }
    },
    // UserAvatar will fetch currentUser internally via useModel
    rightContentRender: () => <UserAvatar />,
  };
};

export const rootContainer: RuntimeConfig['rootContainer'] = (
  container: any,
) => {
  return (
    <StyleSheetManager stylisPlugins={[rtlPlugin]}>
      <ConfigProvider
        direction="rtl"
        locale={faIR}
        theme={{
          algorithm: antdTheme.defaultAlgorithm,
        }}
      >
        {container}
      </ConfigProvider>
    </StyleSheetManager>
  );
};
