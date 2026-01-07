import { DashboardStats, getDashboardStats } from '@/services/dashboard';
import {
  BankOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Skeleton, Statistic, Typography } from 'antd';
import { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { history } from 'umi';
import styles from './index.less';

const { Title } = Typography;

// Color palette
const COLORS = [
  '#52c41a',
  '#faad14',
  '#ff4d4f',
  '#d9d9d9',
  '#1890ff',
  '#722ed1',
];
const TAG_COLORS = ['#d9d9d9', '#1890ff', '#52c41a'];
const STATUS_COLORS = ['#faad14', '#52c41a', '#ff4d4f', '#d9d9d9'];
const CHART_COLORS = {
  users: '#1890ff',
  companies: '#52c41a',
  services: '#722ed1',
  revenue: '#13c2c2',
  province: '#fa8c16',
  category: '#eb2f96',
};

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);

  const fetchStats = async () => {
    try {
      const response = await getDashboardStats();
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  // Quick access card configuration
  const quickAccessCards = [
    {
      title: 'کاربران',
      value: stats?.counts.users || 0,
      icon: <UserOutlined style={{ fontSize: 32, color: '#1890ff' }} />,
      color: '#e6f7ff',
      borderColor: '#1890ff',
      path: '/user',
    },
    {
      title: 'شرکت‌ها',
      value: stats?.counts.companies || 0,
      icon: <BankOutlined style={{ fontSize: 32, color: '#52c41a' }} />,
      color: '#f6ffed',
      borderColor: '#52c41a',
      path: '/company',
    },
    {
      title: 'خدمات',
      value: stats?.counts.company_services || 0,
      icon: <ShopOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#f9f0ff',
      borderColor: '#722ed1',
      path: '/company-services',
    },
    {
      title: 'سفارشات',
      value: stats?.counts.orders || 0,
      icon: <ShoppingCartOutlined style={{ fontSize: 32, color: '#fa8c16' }} />,
      color: '#fff7e6',
      borderColor: '#fa8c16',
      path: '/order',
      extra: stats ? `${stats.counts.pending_orders} در انتظار` : undefined,
    },
  ];

  // Format number to Persian locale
  const formatNumber = (num: number) => {
    return num.toLocaleString('fa-IR');
  };

  // Format currency
  const formatCurrency = (amount: number) => {
    if (amount >= 1000000) {
      return `${(amount / 1000000).toFixed(1)} میلیون`;
    }
    return formatNumber(amount);
  };

  return (
    <PageContainer
      ghost
      header={{
        title: 'داشبورد مدیریت',
        subTitle: 'نمای کلی از وضعیت سیستم',
      }}
    >
      <div className={styles.dashboard}>
        {/* Quick Access Section */}
        <div className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            <RiseOutlined /> دسترسی سریع
          </Title>
          <Row gutter={[16, 16]}>
            {quickAccessCards.map((card, index) => (
              <Col xs={24} sm={12} lg={6} key={index}>
                {loading ? (
                  <Card>
                    <Skeleton active paragraph={{ rows: 1 }} />
                  </Card>
                ) : (
                  <Card
                    hoverable
                    className={styles.statCard}
                    style={{
                      background: card.color,
                      borderRight: `4px solid ${card.borderColor}`,
                    }}
                    onClick={() => history.push(card.path)}
                  >
                    <div className={styles.statCardContent}>
                      <div className={styles.statCardIcon}>{card.icon}</div>
                      <Statistic
                        title={card.title}
                        value={card.value}
                        formatter={(value) => formatNumber(Number(value))}
                      />
                      {card.extra && (
                        <div className={styles.statCardExtra}>{card.extra}</div>
                      )}
                    </div>
                  </Card>
                )}
              </Col>
            ))}
          </Row>
        </div>

        {/* Charts Section */}
        <Row gutter={[16, 16]} className={styles.chartsRow}>
          {/* Registration Trend Chart */}
          <Col xs={24} lg={14}>
            <Card
              title="روند ثبت‌نام‌ها (۶ ماه اخیر)"
              className={styles.chartCard}
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.charts.registrations_by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis />
                    <Tooltip
                      formatter={(value: number) => formatNumber(value)}
                      labelFormatter={(label) => `ماه: ${label}`}
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="کاربران"
                      stroke={CHART_COLORS.users}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.users }}
                    />
                    <Line
                      type="monotone"
                      dataKey="companies"
                      name="شرکت‌ها"
                      stroke={CHART_COLORS.companies}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.companies }}
                    />
                    <Line
                      type="monotone"
                      dataKey="services"
                      name="خدمات"
                      stroke={CHART_COLORS.services}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.services }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          {/* Order Status Pie Chart */}
          <Col xs={24} lg={10}>
            <Card title="وضعیت سفارشات" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.charts.orders_by_status || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, count, percent }) =>
                        `${label}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                    >
                      {(stats?.charts.orders_by_status || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          {/* Revenue Chart */}
          <Col xs={24}>
            <Card title="درآمد ماهانه (تومان)" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.charts.revenue_by_month || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis tickFormatter={(value) => formatCurrency(value)} />
                    <Tooltip
                      formatter={(value: number) => [
                        `${formatNumber(value)} تومان`,
                        'درآمد',
                      ]}
                      labelFormatter={(label) => `ماه: ${label}`}
                    />
                    <Legend />
                    <Bar
                      dataKey="amount"
                      name="درآمد"
                      fill={CHART_COLORS.revenue}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          {/* Companies by Province Chart */}
          <Col xs={24} lg={12}>
            <Card
              title="شرکت‌ها بر اساس استان (۱۰ استان برتر)"
              className={styles.chartCard}
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats?.charts.companies_by_province || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="province" type="category" width={100} />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        'تعداد',
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      name="تعداد شرکت"
                      fill={CHART_COLORS.province}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          {/* Companies by Tag Pie Chart */}
          <Col xs={24} lg={12}>
            <Card title="شرکت‌ها بر اساس وضعیت" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.charts.companies_by_tag || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, count, percent }) =>
                        `${label}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                    >
                      {(stats?.charts.companies_by_tag || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-tag-${index}`}
                            fill={TAG_COLORS[index % TAG_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          {/* Services by Status Pie Chart */}
          <Col xs={24} lg={12}>
            <Card title="خدمات بر اساس وضعیت" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={stats?.charts.services_by_status || []}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ label, count, percent }) =>
                        `${label}: ${count} (${(percent * 100).toFixed(0)}%)`
                      }
                      outerRadius={100}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                    >
                      {(stats?.charts.services_by_status || []).map(
                        (entry, index) => (
                          <Cell
                            key={`cell-status-${index}`}
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, name: string) => [
                        formatNumber(value),
                        name,
                      ]}
                    />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>

          {/* Top Categories Chart */}
          <Col xs={24} lg={12}>
            <Card
              title="دسته‌بندی‌های پرطرفدار (۱۰ دسته برتر)"
              className={styles.chartCard}
            >
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart
                    data={stats?.charts.top_categories || []}
                    layout="vertical"
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="category" type="category" width={120} />
                    <Tooltip
                      formatter={(value: number) => [
                        formatNumber(value),
                        'تعداد خدمت',
                      ]}
                    />
                    <Bar
                      dataKey="count"
                      name="تعداد خدمت"
                      fill={CHART_COLORS.category}
                      radius={[0, 4, 4, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </Card>
          </Col>
        </Row>
      </div>
    </PageContainer>
  );
};

export default HomePage;
