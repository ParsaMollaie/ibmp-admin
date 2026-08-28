import DateRangeFilter from '@/components/DateRangeFilter';
import { DashboardStats, getDashboardStats } from '@/services/dashboard';
import { convertFaDateToEnDate } from '@/utils/convert-fa-date-to-en-date';
import {
  BankOutlined,
  RiseOutlined,
  ShopOutlined,
  ShoppingCartOutlined,
  UserOutlined,
} from '@ant-design/icons';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Skeleton, Statistic, Typography, message } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
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

const { Title, Text } = Typography;

const TAG_COLORS = ['#d9d9d9', '#1890ff', '#52c41a'];
const STATUS_COLORS = ['#faad14', '#52c41a', '#ff4d4f', '#d9d9d9'];
const CHART_COLORS = {
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
  const [activeTagIndex, setActiveTagIndex] = useState(0);
  const [activeStatusIndex, setActiveStatusIndex] = useState(0);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(30, 'day'),
    dayjs(),
  ]);

  const fetchStats = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const startDate =
        start ||
        convertFaDateToEnDate(dateRange[0].toDate()).format('YYYY-MM-DD');
      const endDate =
        end ||
        convertFaDateToEnDate(dateRange[1].toDate()).format('YYYY-MM-DD');
      const response = await getDashboardStats(startDate, endDate);
      if (response.success) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      message.error('دریافت آمار داشبورد با خطا مواجه شد.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  const handleApplyDateRange = (start: Dayjs, end: Dayjs) => {
    setDateRange([start, end]);
    fetchStats(
      convertFaDateToEnDate(start.toDate()).format('YYYY-MM-DD'),
      convertFaDateToEnDate(end.toDate()).format('YYYY-MM-DD'),
    );
  };

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
      path: '/services?type=company',
    },
    {
      title: 'خدمات',
      value: stats?.counts.company_services || 0,
      icon: <ShopOutlined style={{ fontSize: 32, color: '#722ed1' }} />,
      color: '#f9f0ff',
      borderColor: '#722ed1',
      path: '/services',
    },
    {
      title: 'پرداختی ها',
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
  const handleCompanyTagClick = (data: any) => {
    if (data?.tag) {
      history.push(`/services?tag=${data.tag}`);
    }
  };

  const handleServiceStatusClick = (data: any) => {
    if (data?.status) {
      history.push(`/services?status=${data.status}`);
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
        {/* Date Range Filter */}
        <DateRangeFilter
          defaultStart={dateRange[0]}
          defaultEnd={dateRange[1]}
          onApply={handleApplyDateRange}
          loading={loading}
        />

        {/* Quick Access Section */}
        <div className={styles.section}>
          <Title level={5} className={styles.sectionTitle}>
            <RiseOutlined /> دسترسی سریع
          </Title>
          <Text
            type="secondary"
            style={{ fontSize: 12, display: 'block', marginBottom: 12 }}
          >
            اعداد زیر مربوط به بازه زمانی انتخاب‌شده هستند.
          </Text>
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
          {/* Daily Paid Amounts Bar Chart */}
          <Col xs={24}>
            <Card title="مبالغ پرداختی سفارشات" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={stats?.charts.daily_paid_amounts || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
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
                    <Bar
                      dataKey="amount"
                      name="مبلغ پرداختی"
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

          {/* Service Logs Line Chart */}
          <Col xs={24}>
            <Card title="آمار بازدید خدمات" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={stats?.charts.daily_service_logs || []}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="date"
                      tick={{ fontSize: 11 }}
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
                      dataKey="view"
                      name="بازدید"
                      stroke="#1890ff"
                      strokeWidth={2}
                      dot={{ fill: '#1890ff', r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="call_click"
                      name="کلیک تماس"
                      stroke="#52c41a"
                      strokeWidth={2}
                      dot={{ fill: '#52c41a', r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="website_click"
                      name="کلیک وبسایت"
                      stroke="#722ed1"
                      strokeWidth={2}
                      dot={{ fill: '#722ed1', r: 3 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="catalog_download"
                      name="دانلود کاتالوگ"
                      stroke="#fa8c16"
                      strokeWidth={2}
                      dot={{ fill: '#fa8c16', r: 3 }}
                    />
                  </LineChart>
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
                        handleBarClick(data, '/services', 'province')
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
                        handleBarClick(data, '/services', 'category')
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
