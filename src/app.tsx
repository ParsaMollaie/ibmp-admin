import { RequestConfig, RunTimeLayoutConfig } from '@umijs/max';
import { ConfigProvider, theme as antdTheme } from 'antd';
import faIR from 'antd/locale/fa_IR';
import dayjs from 'dayjs';
import Cookies from 'js-cookie';
import { StyleSheetManager } from 'styled-components';
import rtlPlugin from 'stylis-plugin-rtl';
import type { RuntimeConfig } from 'umi';
import UserAvatar from './components/UserAvatar';
import './global.less';
import UserModel from './models/user';

dayjs.locale('fa');

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

export const layout: RunTimeLayoutConfig = () => {
  return {
    logo: 'https://img.alicdn.com/tfs/TB1YHEpwUT1gK0jSZFhXXaAtVXa-28-27.svg',
    menu: {
      locale: false,
    },
    layout: 'mix',
    navTheme: 'realDark',
    model: {
      models: {
        user: UserModel,
      },
    },
    onPageChange: () => {
      console.log('on page change');
      // const location = window.location.pathname;
      // const token = localStorage.getItem('token');

      // if (!token && location !== '/auth') {
      //   window.location.href = '/auth';
      // }
    },
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
          algorithm: antdTheme.darkAlgorithm,
        }}
      >
        {container}
      </ConfigProvider>
    </StyleSheetManager>
  );
};
