import { defineConfig } from '@umijs/max';

export default defineConfig({
  // Versioned query string so browsers that cached the pre-rebrand favicon
  // (favicons are cached very aggressively per-origin) fetch the new icon
  // instead of continuing to show the stale one. Bump the version if the
  // icon is ever replaced again.
  links: [{ rel: 'icon', href: '/favicon.ico?v=2' }],
  antd: {},
  access: {},
  model: {},
  initialState: {},
  request: {
    dataField: '',
  },
  proxy: {
    '/api': {
      target: process.env.UMI_APP_CLIENT_URL || 'https://ibmp.ir',
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
      name: 'دسته‌بندی',
      path: '/category',
      component: './Category',
      icon: 'AppstoreOutlined',
    },

    {
      name: 'پیشنهاد دسته‌بندی',
      path: '/suggest-category',
      component: './SuggestCategory',
      icon: 'BulbOutlined',
    },

    {
      name: 'تبلیغات',
      path: '/advertising',
      component: './Advertising',
      icon: 'FileTextOutlined',
    },

    {
      name: 'برندهای معتبر',
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
      name: 'اطلاعات تماس',
      path: '/contact-profiles',
      component: './ContactProfile',
      icon: 'ContactsOutlined',
    },
    {
      name: 'خدمات شرکت',
      path: '/services',
      component: './Services',
      icon: 'ShopOutlined',
    },
    {
      name: 'خطاها',
      path: '/complaints',
      component: './Complaints',
      icon: 'ExclamationCircleOutlined',
    },
    {
      name: 'نظرات شرکت ها/خدمات',
      path: '/service-comments',
      component: './ServiceComments',
      icon: 'CommentOutlined',
    },
    {
      name: 'اسلایدر',
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
      name: 'مقالات و دانلود ها',
      path: '/News',
      component: './News',
      icon: 'ReadOutlined',
    },
    {
      name: 'نظرات مقالات',
      path: '/news-comments',
      component: './NewsComments',
      icon: 'CommentOutlined',
    },
    {
      name: 'پلن‌ها',
      path: '/plan',
      component: './Plan',
      icon: 'CreditCardOutlined',
    },
    {
      name: 'پرداختی ها',
      path: '/order',
      component: './Order',
      icon: 'ShoppingCartOutlined',
    },
    {
      name: 'تماس با ما',
      path: '/contact-us',
      component: './ContactUs',
      icon: 'MessageOutlined',
    },

    {
      name: 'اطلاعات تماس سایت',
      path: '/website-contact',
      component: './WebsiteContact',
      icon: 'GlobalOutlined',
    },

    {
      name: 'تنظیمات',
      path: '/settings',
      component: './Settings',
      icon: 'SettingOutlined',
    },

    {
      name: 'گزارش‌ها',
      path: '/reports',
      icon: 'BarChartOutlined',
      routes: [
        {
          name: 'باقیمانده ارتقا خدمات',
          path: '/reports/promotion-remaining',
          component: './Reports/PromotionRemaining',
        },
        {
          name: 'فعالیت خدمات',
          path: '/reports/service-activity',
          component: './Reports/ServiceActivity',
        },
        {
          name: 'گزارش ماهانه',
          path: '/reports/monthly',
          component: './Reports/MonthlyReport',
        },
      ],
    },

    { path: '/auth', component: './Auth', layout: false },
  ],
  locale: {
    default: 'fa-IR',
    antd: true,
    baseNavigator: false,
  },
  hash: true,
  mfsu: false,
  npmClient: 'npm',
  esbuildMinifyIIFE: true,
});
