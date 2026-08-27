import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getServiceActivityReport } from '@/services/service';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Space, Tag } from 'antd';
import { DatePicker } from 'antd-jalali';
import dayjs from 'dayjs';
import { useRef, useState } from 'react';

type QuickRange = 7 | 30 | 90 | 'year';

const quickRangeLabels: { key: QuickRange; label: string }[] = [
  { key: 7, label: '۷ روز اخیر' },
  { key: 30, label: '۳۰ روز اخیر' },
  { key: 90, label: '۹۰ روز اخیر' },
  { key: 'year', label: 'امسال' },
];

function getDateRange(range: QuickRange): {
  start_date: string;
  end_date: string;
} {
  const end = dayjs().format('YYYY-MM-DD');
  if (range === 'year') {
    // Start of current Jalali year — approximate with March 21
    const currentYear = dayjs().year();
    const jalaliYearStart = dayjs().isAfter(dayjs(`${currentYear}-03-21`))
      ? `${currentYear}-03-21`
      : `${currentYear - 1}-03-21`;
    return { start_date: jalaliYearStart, end_date: end };
  }
  return {
    start_date: dayjs().subtract(range, 'day').format('YYYY-MM-DD'),
    end_date: end,
  };
}

const serviceTypeMap: Record<string, { text: string; color: string }> = {
  company: { text: 'شرکت', color: 'blue' },
  engineers: { text: 'مهندسان', color: 'green' },
};

export default function ServiceActivityReport() {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize(
    'reports-service-activity',
    20,
  );
  const [quickFilter, setQuickFilter] = useState<QuickRange>(30);
  const [dateRange, setDateRange] = useState(getDateRange(30));

  const handleQuickFilter = (range: QuickRange) => {
    setQuickFilter(range);
    setDateRange(getDateRange(range));
    actionRef.current?.reload();
  };

  const columns: ProColumns<API.ServiceActivityItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 80,
      search: false,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 200,
      ellipsis: true,
      search: false,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      key: 'type',
      width: 100,
      valueType: 'select',
      valueEnum: {
        company: { text: 'شرکت' },
        engineers: { text: 'مهندسان' },
      },
      render: (_, record) => {
        const info = serviceTypeMap[record.type];
        return info ? <Tag color={info.color}>{info.text}</Tag> : record.type;
      },
    },
    {
      title: 'دسته‌بندی',
      dataIndex: 'category_title',
      key: 'category_title',
      width: 150,
      ellipsis: true,
      search: false,
    },
    {
      title: 'کاربر',
      dataIndex: 'user_name',
      key: 'user_name',
      width: 150,
      ellipsis: true,
      search: false,
    },
    {
      title: 'بازدید',
      dataIndex: 'view_count',
      key: 'view_count',
      width: 90,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'کلیک تماس',
      dataIndex: 'call_click_count',
      key: 'call_click_count',
      width: 100,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'کلیک وبسایت',
      dataIndex: 'website_click_count',
      key: 'website_click_count',
      width: 110,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'دانلود کاتالوگ',
      dataIndex: 'catalog_download_count',
      key: 'catalog_download_count',
      width: 120,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'شبکه اجتماعی',
      dataIndex: 'social_click_count',
      key: 'social_click_count',
      width: 120,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'اشتراک‌گذاری',
      dataIndex: 'share_click_count',
      key: 'share_click_count',
      width: 110,
      sorter: true,
      search: false,
      align: 'center',
    },
    {
      title: 'کل فعالیت',
      dataIndex: 'total_count',
      key: 'total_count',
      width: 100,
      sorter: true,
      defaultSortOrder: 'descend',
      search: false,
      align: 'center',
      render: (_, record) => <strong>{record.total_count}</strong>,
    },
    // Hidden filter fields — date pickers
    {
      title: 'از تاریخ',
      dataIndex: 'start_date',
      key: 'start_date',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="از تاریخ" style={{ width: '100%' }} />
      ),
    },
    {
      title: 'تا تاریخ',
      dataIndex: 'end_date',
      key: 'end_date',
      hideInTable: true,
      renderFormItem: () => (
        <DatePicker placeholder="تا تاریخ" style={{ width: '100%' }} />
      ),
    },
  ];

  return (
    <PageContainer>
      <ProTable<API.ServiceActivityItem>
        headerTitle="گزارش فعالیت خدمات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        dateFormatter="string"
        cardBordered
        scroll={{ x: 1600 }}
        toolBarRender={() => [
          <Space key="quick-filters">
            {quickRangeLabels.map((item) => (
              <Button
                key={item.key}
                type={quickFilter === item.key ? 'primary' : 'default'}
                size="small"
                onClick={() => handleQuickFilter(item.key)}
              >
                {item.label}
              </Button>
            ))}
          </Space>,
        ]}
        search={{
          layout: 'horizontal',
          defaultCollapsed: false,
          searchText: 'جستجو',
          resetText: 'پاک کردن',
          labelWidth: 'auto',
        }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
          showTotal: (total) => `مجموع: ${total} خدمت`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: { listsHeight: 400 },
        }}
        request={async (params) => {
          // Resolve date values from form (could be moment/dayjs object or string)
          const startDate = params.start_date
            ? typeof params.start_date === 'string'
              ? params.start_date
              : params.start_date.format?.('YYYY-MM-DD')
            : dateRange.start_date;

          const endDate = params.end_date
            ? typeof params.end_date === 'string'
              ? params.end_date
              : params.end_date.format?.('YYYY-MM-DD')
            : dateRange.end_date;

          const apiParams: Record<string, any> = {
            start_date: startDate,
            end_date: endDate,
            page: params.current || 1,
            page_size: params.pageSize || 20,
          };

          if (params.type) {
            apiParams.type = params.type;
          }

          const res = await getServiceActivityReport(apiParams);

          return {
            data: res.data?.list || [],
            total: res.data?.pagination?.total || 0,
            success: res.success,
          };
        }}
      />
    </PageContainer>
  );
}
