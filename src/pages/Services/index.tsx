import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import { getServices } from '@/services/service';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { ProTable } from '@ant-design/pro-components';
import { Tag } from 'antd';
import React, { useRef } from 'react';
import { history } from 'umi';

const getStatusColor = (status: API.ServiceStatus): string => {
  const colorMap: Record<string, string> = {
    pending: 'warning',
    approved: 'success',
    rejected: 'error',
    disable: 'default',
  };
  return colorMap[status] || 'default';
};

const getStatusLabel = (status: API.ServiceStatus): string => {
  const labelMap: Record<string, string> = {
    pending: 'در انتظار تایید',
    approved: 'تایید شده',
    rejected: 'رد شده',
    disable: 'غیرفعال',
  };
  return labelMap[status] || status;
};

const getPromotionTypeColor = (type: API.ServicePromotionType): string => {
  const colorMap: Record<string, string> = {
    regular: 'default',
    promoted: 'blue',
  };
  return colorMap[type] || 'default';
};

const getPromotionTypeLabel = (type: API.ServicePromotionType): string => {
  const labelMap: Record<string, string> = {
    regular: 'عادی',
    promoted: 'ویژه',
  };
  return labelMap[type] || type;
};

const getTypeLabel = (type: API.ServiceType): string => {
  const labelMap: Record<string, string> = {
    company: 'شرکت',
    engineers: 'مهندس/مجری',
  };
  return labelMap[type] || type;
};

/**
 * Combined, all-types services list.
 * Click-through destination for dashboard aggregate stats/charts that span both
 * company- and engineer-type services (which /services-company and
 * /services-engineers each only show one slice of). Not a management screen —
 * see those two pages for the full CRUD/export/assign-plan feature set.
 */
const getTagLabel = (tag?: API.ServiceTag | null): string => {
  const labelMap: Record<string, string> = {
    regular: 'عادی',
    most_view: 'پربازدید',
    promoted: 'ویژه',
  };
  return (tag && labelMap[tag]) || 'عادی';
};

const ServicesScreen: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize('services', 10);

  // Dashboard charts link here with query params (e.g. ?tag=most_view, ?status=approved)
  // to pre-filter the list — read them once as the ProTable form's initial values.
  const urlParams = new URLSearchParams(history.location.search);
  const initialValues = {
    type: urlParams.get('type') || undefined,
    status: urlParams.get('status') || undefined,
    tag: urlParams.get('tag') || undefined,
  };

  const columns: ProColumns<API.ServiceItem>[] = [
    {
      title: 'کد',
      dataIndex: 'code',
      search: false,
      width: 90,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      ellipsis: true,
    },
    {
      title: 'نوع',
      dataIndex: 'type',
      valueEnum: {
        company: { text: 'شرکت' },
        engineers: { text: 'مهندس/مجری' },
      },
      render: (_, record) => <Tag>{getTypeLabel(record.type)}</Tag>,
    },
    {
      title: 'دسته‌بندی',
      dataIndex: ['category', 'title'],
      search: false,
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      valueEnum: {
        pending: { text: 'در انتظار تایید' },
        approved: { text: 'تایید شده' },
        rejected: { text: 'رد شده' },
        disable: { text: 'غیرفعال' },
      },
      render: (_, record) => (
        <Tag color={getStatusColor(record.status)}>
          {getStatusLabel(record.status)}
        </Tag>
      ),
    },
    {
      title: 'نوع ارتقا',
      dataIndex: 'promotion_type',
      search: false,
      render: (_, record) => (
        <Tag color={getPromotionTypeColor(record.promotion_type)}>
          {getPromotionTypeLabel(record.promotion_type)}
        </Tag>
      ),
    },
    {
      title: 'تگ',
      dataIndex: 'tag',
      valueEnum: {
        regular: { text: 'عادی' },
        most_view: { text: 'پربازدید' },
        promoted: { text: 'ویژه' },
      },
      render: (_, record) => <Tag>{getTagLabel(record.tag)}</Tag>,
    },
    {
      title: 'تاریخ ثبت',
      dataIndex: 'created_at',
      valueType: 'date',
      search: false,
    },
    {
      title: 'عملیات',
      valueType: 'option',
      render: (_, record) => [
        <a
          key="view"
          onClick={() =>
            history.push(
              record.type === 'company'
                ? '/services-company'
                : '/services-engineers',
            )
          }
        >
          مشاهده در لیست
        </a>,
      ],
    },
  ];

  return (
    <ProTable<API.ServiceItem>
      headerTitle="همه خدمات"
      actionRef={actionRef}
      rowKey="id"
      columns={columns}
      form={{ initialValues }}
      request={async (params) => {
        const response = await getServices({
          search: params.search,
          status: params.status,
          promotion_type: params.promotion_type,
          type: params.type,
          tag: params.tag,
          page: params.current,
          page_size: params.pageSize,
        });

        return {
          data: response.data?.list || [],
          success: response.success,
          total: response.data?.pagination?.total || 0,
        };
      }}
      pagination={{
        pageSize,
        showSizeChanger: true,
        showQuickJumper: true,
        showTotal: (total, range) =>
          `نمایش ${range[0]}-${range[1]} از ${total} خدمت`,
        onShowSizeChange: (_current, size) => setPageSize(size),
      }}
      search={{
        layout: 'horizontal',
        defaultCollapsed: false,
        searchText: 'جستجو',
        resetText: 'پاک کردن',
        labelWidth: 'auto',
      }}
      options={{
        density: true,
        fullScreen: true,
        reload: true,
      }}
      dateFormatter="string"
      cardBordered
    />
  );
};

export default ServicesScreen;
