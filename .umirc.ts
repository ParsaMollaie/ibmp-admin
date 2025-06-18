import { defineConfig } from '@umijs/max';

export default defineConfig({
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {
    dataField: '',
  },
  proxy: {
    '/api': {
      target: 'http://37.32.23.16:9800',
      changeOrigin: true,
      pathRewrite: { '^/api': '/api' },
    },
  },
  layout: {
    title: 'IBMP ',
  },
  routes: [
    { path: '/', redirect: '/home' },
    { name: 'خانه', path: '/home', component: './Home', icon: 'HomeOutlined' },
    {
      name: 'شرکت ها ',
      path: '/company',
      component: './Company',
      icon: 'FileTextOutlined',
    },
    {
      name: 'کاربران',
      path: '/user',
      component: './User',
      icon: 'UserOutlined',
    },
    {
      name: 'بنر',
      path: '/slider',
      component: './Slider',
      icon: 'SlidersOutlined',
    },
    {
      name: 'شبکه های اجتماعی',
      path: '/SocialNetworks',
      component: './SocialNetworks',
      icon: 'TeamOutlined',
    },
    {
      name: 'اخبار  ',
      path: '/News',
      component: './News',
      icon: 'ReadOutlined',
    },

    { path: '/auth', component: './Auth', layout: false },
  ],
  locale: {
    default: 'fa-IR',
    antd: true,
    baseNavigator: false,
  },
  mfsu: false,
  npmClient: 'npm',
});
