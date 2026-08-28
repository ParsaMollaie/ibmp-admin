import DateRangeFilter from '@/components/DateRangeFilter';
import { getMonthlyReport, MonthlyReport } from '@/services/dashboard';
import { convertFaDateToEnDate } from '@/utils/convert-fa-date-to-en-date';
import { PageContainer } from '@ant-design/pro-components';
import { Card, Col, Row, Skeleton } from 'antd';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { history } from 'umi';
import styles from './index.less';

const CHART_COLORS = {
  users: '#1890ff',
  companies: '#52c41a',
  services: '#722ed1',
  revenue: '#13c2c2',
};

const MonthlyReportPage: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<MonthlyReport | null>(null);
  const [dateRange, setDateRange] = useState<[Dayjs, Dayjs]>([
    dayjs().subtract(5, 'month').startOf('month'),
    dayjs(),
  ]);

  const fetchReport = async (start?: string, end?: string) => {
    setLoading(true);
    try {
      const startDate =
        start ||
        convertFaDateToEnDate(dateRange[0].toDate()).format('YYYY-MM-DD');
      const endDate =
        end ||
        convertFaDateToEnDate(dateRange[1].toDate()).format('YYYY-MM-DD');
      const response = await getMonthlyReport(startDate, endDate);
      if (response.success) {
        setReport(response.data);
      }
    } catch (error) {
      console.error('Failed to fetch monthly report:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReport();
  }, []);

  const handleApplyDateRange = (start: Dayjs, end: Dayjs) => {
    setDateRange([start, end]);
    fetchReport(
      convertFaDateToEnDate(start.toDate()).format('YYYY-MM-DD'),
      convertFaDateToEnDate(end.toDate()).format('YYYY-MM-DD'),
    );
  };

  // Format number to Persian locale
  const formatNumber = (num: number) => num.toLocaleString('fa-IR');

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
      header={{
        title: 'گزارش ماهانه',
        subTitle: 'روند ثبت‌نام‌ها و درآمد به تفکیک ماه',
      }}
    >
      <div className={styles.page}>
        <DateRangeFilter
          defaultStart={dateRange[0]}
          defaultEnd={dateRange[1]}
          onApply={handleApplyDateRange}
          loading={loading}
        />

        <Row gutter={[16, 16]}>
          {/* Registration Trend Chart */}
          <Col xs={24}>
            <Card title="روند ثبت‌نام‌ها" className={styles.chartCard}>
              {loading ? (
                <Skeleton active paragraph={{ rows: 6 }} />
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={report?.registrations_by_month || []}>
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
                        onClick: () => history.push('/services?type=company'),
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
                        onClick: () => history.push('/services'),
                      }}
                    />
                  </LineChart>
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
                  <BarChart data={report?.revenue_by_month || []}>
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
        </Row>
      </div>
    </PageContainer>
  );
};

export default MonthlyReportPage;
