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
      permission: 'categories:list',
    },

    {
      name: 'پیشنهاد دسته‌بندی',
      path: '/suggest-category',
      component: './SuggestCategory',
      icon: 'BulbOutlined',
      permission: 'suggest-categories:list',
    },

    {
      name: 'تبلیغات',
      path: '/advertising',
      component: './Advertising',
      icon: 'FileTextOutlined',
      permission: 'advertising:list',
    },

    {
      name: 'برندهای معتبر',
      path: '/business-partners',
      component: './BusinessPartners',
      icon: 'TeamOutlined',
      permission: 'business-partners:list',
    },

    {
      name: 'کاربران',
      path: '/user',
      component: './User',
      icon: 'UserOutlined',
      permission: 'users:list',
    },
    {
      name: 'نقش‌ها و دسترسی‌ها',
      path: '/roles',
      component: './Role',
      icon: 'SafetyCertificateOutlined',
      permission: 'roles:list',
    },
    {
      name: 'اطلاعات تماس',
      path: '/contact-profiles',
      component: './ContactProfile',
      icon: 'ContactsOutlined',
      permission: 'contact-profiles:list',
    },
    {
      name: 'خدمات شرکت',
      path: '/services',
      component: './Services',
      icon: 'ShopOutlined',
      permission: 'services:list',
    },
    {
      name: 'خطاها',
      path: '/complaints',
      component: './Complaints',
      icon: 'ExclamationCircleOutlined',
      permission: 'service-complaints:list',
    },
    {
      name: 'درخواست‌های مشتریان',
      path: '/leads',
      component: './Leads',
      icon: 'SolutionOutlined',
      // Covers two domains (price-inquiries + project-visit-requests); gated on the first —
      // a role holding only project-visit-requests:list won't see this entry. Known,
      // documented simplification (menuDataRender only supports one permission per route).
      permission: 'price-inquiries:list',
    },
    {
      name: 'نظرات شرکت ها/خدمات',
      path: '/service-comments',
      component: './ServiceComments',
      icon: 'CommentOutlined',
      permission: 'service-comments:list',
    },
    {
      name: 'اسلایدر',
      path: '/slider',
      component: './Slider',
      icon: 'SlidersOutlined',
      permission: 'sliders:list',
    },
    {
      name: 'شبکه های اجتماعی',
      path: '/SocialNetworks',
      component: './SocialNetworks',
      icon: 'TeamOutlined',
      permission: 'social-networks:list',
    },
    {
      name: 'مقالات و دانلود ها',
      path: '/News',
      component: './News',
      icon: 'ReadOutlined',
      permission: 'news:list',
    },
    {
      name: 'نظرات مقالات',
      path: '/news-comments',
      component: './NewsComments',
      icon: 'CommentOutlined',
      permission: 'news-comments:list',
    },
    {
      name: 'پلن‌ها',
      path: '/plan',
      component: './Plan',
      icon: 'CreditCardOutlined',
      permission: 'plans:list',
    },
    {
      name: 'پرداختی ها',
      path: '/order',
      component: './Order',
      icon: 'ShoppingCartOutlined',
      permission: 'orders:list',
    },
    {
      name: 'تماس با ما',
      path: '/contact-us',
      component: './ContactUs',
      icon: 'MessageOutlined',
      permission: 'contact-us:list',
    },

    {
      name: 'اطلاعات تماس سایت',
      path: '/website-contact',
      component: './WebsiteContact',
      icon: 'GlobalOutlined',
      permission: 'website-contact:view',
    },

    {
      name: 'تنظیمات',
      path: '/settings',
      component: './Settings',
      icon: 'SettingOutlined',
      permission: 'settings:view',
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
          permission: 'services:promotion-remaining-trend',
        },
        {
          name: 'فعالیت خدمات',
          path: '/reports/service-activity',
          component: './Reports/ServiceActivity',
          permission: 'services:activity-report',
        },
        {
          name: 'گزارش ماهانه',
          path: '/reports/monthly',
          component: './Reports/MonthlyReport',
          permission: 'dashboard:monthly-report',
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
