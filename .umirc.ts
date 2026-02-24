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
      target: 'https://ibmp.ir',
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
    // {
    //   name: 'شرکت‌ها',
    //   path: '/company',
    //   component: './Company',
    //   icon: 'BankOutlined',
    // },
    // {
    //   name: 'مجریان و مهندسان',
    //   path: '/company-services',
    //   component: './CompanyService',
    //   icon: 'ShopOutlined',
    // },
    {
      name: 'خدمات شرکت‌ها',
      path: '/services-company',
      component: './ServiceCompany',
      icon: 'ShopOutlined',
    },
    {
      name: 'خدمات مهندسان و مجریان',
      path: '/services-engineers',
      component: './ServiceEngineers',
      icon: 'ToolOutlined',
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
      name: 'مقالات',
      path: '/News',
      component: './News',
      icon: 'ReadOutlined',
    },
    {
      name: 'پلن‌ها',
      path: '/plan',
      component: './Plan',
      icon: 'CreditCardOutlined',
    },
    {
      name: 'سفارشات',
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
