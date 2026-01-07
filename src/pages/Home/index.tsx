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
  Sector,
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

// Custom active shape for pie charts with better text display
const renderActiveShape = (props: any) => {
  const {
    cx,
    cy,
    innerRadius,
    outerRadius,
    startAngle,
    endAngle,
    fill,
    payload,
    value,
    percent,
  } = props;

  return (
    <g>
      <text
        x={cx}
        y={cy - 10}
        textAnchor="middle"
        fill="#333"
        fontSize={14}
        fontWeight="bold"
      >
        {payload.label}
      </text>
      <text x={cx} y={cy + 10} textAnchor="middle" fill="#666" fontSize={12}>
        {`${value.toLocaleString('fa-IR')} (${(percent * 100).toFixed(0)}%)`}
      </text>
      <Sector
        cx={cx}
        cy={cy}
        innerRadius={innerRadius}
        outerRadius={outerRadius + 8}
        startAngle={startAngle}
        endAngle={endAngle}
        fill={fill}
      />
      <Sector
        cx={cx}
        cy={cy}
        startAngle={startAngle}
        endAngle={endAngle}
        innerRadius={outerRadius + 10}
        outerRadius={outerRadius + 14}
        fill={fill}
      />
    </g>
  );
};

// Custom legend with click functionality
const renderLegend = (props: any, onClick?: (entry: any) => void) => {
  const { payload } = props;
  return (
    <div className={styles.legendContainer}>
      {payload.map((entry: any, index: number) => (
        <div
          key={`legend-${index}`}
          className={styles.legendItem}
          onClick={() => onClick?.(entry)}
          style={{ cursor: onClick ? 'pointer' : 'default' }}
        >
          <span
            className={styles.legendDot}
            style={{ backgroundColor: entry.color }}
          />
          <span className={styles.legendLabel}>{entry.value}</span>
          {entry.payload?.count !== undefined && (
            <span className={styles.legendValue}>
              ({entry.payload.count.toLocaleString('fa-IR')})
            </span>
          )}
        </div>
      ))}
    </div>
  );
};

const HomePage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [activeOrderIndex, setActiveOrderIndex] = useState(0);
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);

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
      return `${(amount / 1000000).toFixed(1)} م`;
    }
    if (amount >= 1000) {
      return `${(amount / 1000).toFixed(0)} ه`;
    }
    return formatNumber(amount);
  };

  // Click handlers for charts
  const handleOrderStatusClick = (data: any) => {
    if (data?.status) {
      history.push(`/order?status=${data.status}`);
    }
  };

  const handleCompanyTagClick = (data: any) => {
    if (data?.tag) {
      history.push(`/company?tag=${data.tag}`);
    }
  };

  const handleServiceStatusClick = (data: any) => {
    if (data?.status) {
      history.push(`/company-services?status=${data.status}`);
    }
  };

  const handleBarClick = (data: any, path: string, param: string) => {
    if (data) {
      history.push(
        `${path}?${param}=${encodeURIComponent(data[param] || data.name)}`,
      );
    }
  };

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label, suffix = '' }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.customTooltip}>
          {label && <div className={styles.tooltipLabel}>{label}</div>}
          {payload.map((entry: any, index: number) => (
            <div key={index} className={styles.tooltipItem}>
              <span
                className={styles.tooltipDot}
                style={{ backgroundColor: entry.color }}
              />
              <span>{entry.name}: </span>
              <strong>
                {formatNumber(entry.value)}
                {suffix}
              </strong>
            </div>
          ))}
        </div>
      );
    }
    return null;
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(value) => (
                        <span style={{ color: '#666', fontSize: 12 }}>
                          {value}
                        </span>
                      )}
                    />
                    <Line
                      type="monotone"
                      dataKey="users"
                      name="کاربران"
                      stroke={CHART_COLORS.users}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.users, r: 4 }}
                      activeDot={{
                        r: 6,
                        cursor: 'pointer',
                        onClick: () => history.push('/user'),
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="companies"
                      name="شرکت‌ها"
                      stroke={CHART_COLORS.companies}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.companies, r: 4 }}
                      activeDot={{
                        r: 6,
                        cursor: 'pointer',
                        onClick: () => history.push('/company'),
                      }}
                    />
                    <Line
                      type="monotone"
                      dataKey="services"
                      name="خدمات"
                      stroke={CHART_COLORS.services}
                      strokeWidth={2}
                      dot={{ fill: CHART_COLORS.services, r: 4 }}
                      activeDot={{
                        r: 6,
                        cursor: 'pointer',
                        onClick: () => history.push('/company-services'),
                      }}
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
                      activeIndex={activeOrderIndex}
                      activeShape={renderActiveShape}
                      data={stats?.charts.orders_by_status || []}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                      onMouseEnter={(_, index) => setActiveOrderIndex(index)}
                      onClick={(data) => handleOrderStatusClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {(stats?.charts.orders_by_status || []).map(
                        (_, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Legend
                      content={(props) =>
                        renderLegend(props, (entry) =>
                          handleOrderStatusClick(entry.payload),
                        )
                      }
                      verticalAlign="bottom"
                    />
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
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                    />
                    <YAxis
                      tickFormatter={(value) => formatCurrency(value)}
                      tick={{ fontSize: 12 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip suffix=" تومان" />}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Legend
                      wrapperStyle={{ paddingTop: 20 }}
                      formatter={(value) => (
                        <span style={{ color: '#666', fontSize: 12 }}>
                          {value}
                        </span>
                      )}
                    />
                    <Bar
                      dataKey="amount"
                      name="درآمد"
                      fill={CHART_COLORS.revenue}
                      radius={[4, 4, 0, 0]}
                      cursor="pointer"
                      onClick={() => history.push('/order')}
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
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="province"
                      type="category"
                      width={80}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar
                      dataKey="count"
                      name="تعداد شرکت"
                      fill={CHART_COLORS.province}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data, '/company', 'province')
                      }
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
                      activeIndex={activeTagIndex}
                      activeShape={renderActiveShape}
                      data={stats?.charts.companies_by_tag || []}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                      onMouseEnter={(_, index) => setActiveTagIndex(index)}
                      onClick={(data) => handleCompanyTagClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {(stats?.charts.companies_by_tag || []).map(
                        (_, index) => (
                          <Cell
                            key={`cell-tag-${index}`}
                            fill={TAG_COLORS[index % TAG_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Legend
                      content={(props) =>
                        renderLegend(props, (entry) =>
                          handleCompanyTagClick(entry.payload),
                        )
                      }
                      verticalAlign="bottom"
                    />
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
                      activeIndex={activeStatusIndex}
                      activeShape={renderActiveShape}
                      data={stats?.charts.services_by_status || []}
                      cx="50%"
                      cy="45%"
                      innerRadius={50}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="count"
                      nameKey="label"
                      onMouseEnter={(_, index) => setActiveStatusIndex(index)}
                      onClick={(data) => handleServiceStatusClick(data)}
                      style={{ cursor: 'pointer' }}
                    >
                      {(stats?.charts.services_by_status || []).map(
                        (_, index) => (
                          <Cell
                            key={`cell-status-${index}`}
                            fill={STATUS_COLORS[index % STATUS_COLORS.length]}
                          />
                        ),
                      )}
                    </Pie>
                    <Legend
                      content={(props) =>
                        renderLegend(props, (entry) =>
                          handleServiceStatusClick(entry.payload),
                        )
                      }
                      verticalAlign="bottom"
                    />
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
                    margin={{ left: 20 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      type="number"
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                    />
                    <YAxis
                      dataKey="category"
                      type="category"
                      width={100}
                      tick={{ fontSize: 11 }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      content={<CustomTooltip />}
                      cursor={{ fill: 'rgba(0, 0, 0, 0.05)' }}
                    />
                    <Bar
                      dataKey="count"
                      name="تعداد خدمت"
                      fill={CHART_COLORS.category}
                      radius={[0, 4, 4, 0]}
                      cursor="pointer"
                      onClick={(data) =>
                        handleBarClick(data, '/company-services', 'category')
                      }
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
