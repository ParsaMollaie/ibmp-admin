import { defineConfig } from '@umijs/max';

export default defineConfig({
  links: [{ rel: 'icon', href: '/favicon.ico' }],
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {
    dataField: '',
  },
  proxy: {
    '/api': {
      target: 'http://91.99.187.224:9800',
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

    // Categories
    {
      name: 'دسته‌بندی',
      path: '/category',
      component: './Category',
      icon: 'AppstoreOutlined',
    },

    // Advertising - now a standalone route
    {
      name: 'تبلیغات',
      path: '/advertising',
      component: './Advertising',
      icon: 'FileTextOutlined',
    },

    // Business Partners - now a standalone route
    {
      name: 'شرکای تجاری',
      path: '/business-partners',
      component: './BusinessPartners',
      icon: 'TeamOutlined',
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
      name: 'اخبار',
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
