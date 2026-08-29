import usePersistedPageSize from '@/hooks/usePersistedPageSize';
import {
  getNewsComments,
  replyToNewsComment,
  updateNewsCommentStatus,
} from '@/services/news-comment';
import {
  CheckOutlined,
  CloseOutlined,
  MessageOutlined,
} from '@ant-design/icons';
import type { ActionType, ProColumns } from '@ant-design/pro-components';
import { PageContainer, ProTable } from '@ant-design/pro-components';
import { Button, Input, message, Modal, Space, Tag, Tooltip } from 'antd';
import React, { useRef, useState } from 'react';
import { history } from 'umi';

const { TextArea } = Input;

const statusLabelMap: Record<
  API.NewsCommentStatus,
  { text: string; color: string }
> = {
  pending: { text: 'در انتظار بررسی', color: 'default' },
  approved: { text: 'تایید شده', color: 'success' },
  rejected: { text: 'رد شده', color: 'error' },
};

const NewsCommentsPage: React.FC = () => {
  const actionRef = useRef<ActionType>();
  const [pageSize, setPageSize] = usePersistedPageSize('news-comments', 10);

  const [replyModalVisible, setReplyModalVisible] = useState(false);
  const [replyRecord, setReplyRecord] = useState<API.NewsCommentItem | null>(
    null,
  );
  const [replyContent, setReplyContent] = useState('');
  const [submittingReply, setSubmittingReply] = useState(false);

  const handleUpdateStatus = async (
    record: API.NewsCommentItem,
    status: 'approved' | 'rejected',
  ) => {
    try {
      const res = await updateNewsCommentStatus(record.id, { status });
      if (res.success) {
        message.success(status === 'approved' ? 'نظر تایید شد' : 'نظر رد شد');
        actionRef.current?.reload();
      } else {
        message.error(res.message || 'خطا در بروزرسانی وضعیت');
      }
    } catch {
      message.error('خطا در ارتباط با سرور');
    }
  };

  const openReplyModal = (record: API.NewsCommentItem) => {
    setReplyRecord(record);
    setReplyContent(record.reply || '');
    setReplyModalVisible(true);
  };

  const handleSubmitReply = async () => {
    if (!replyRecord || !replyContent.trim()) return;
    setSubmittingReply(true);
    try {
      const res = await replyToNewsComment(replyRecord.id, {
        reply: replyContent.trim(),
      });
      if (res.success) {
        message.success('پاسخ ثبت شد');
        setReplyModalVisible(false);
        setReplyRecord(null);
        actionRef.current?.reload();
      } else {
        message.error(res.message || 'خطا در ثبت پاسخ');
      }
    } catch {
      message.error('خطا در ارتباط با سرور');
    } finally {
      setSubmittingReply(false);
    }
  };

  const columns: ProColumns<API.NewsCommentItem>[] = [
    {
      title: 'مقاله',
      dataIndex: 'news',
      hideInSearch: true,
      width: 200,
      render: (_, record) =>
        record.news ? (
          <Space
            direction="vertical"
            size={0}
            style={{ cursor: 'pointer' }}
            onClick={() =>
              history.push(
                `/News?title=${encodeURIComponent(record.news!.title)}`,
              )
            }
          >
            <span style={{ color: '#1890ff' }}>{record.news.title}</span>
            <span style={{ fontSize: 12, color: '#8c8c8c' }}>
              کد: {record.news.code}
            </span>
          </Space>
        ) : (
          '—'
        ),
    },
    {
      title: 'کاربر',
      dataIndex: 'user',
      hideInSearch: true,
      width: 150,
      render: (_, record) =>
        record.user ? (
          <span
            style={{ cursor: 'pointer', color: '#1890ff' }}
            onClick={() =>
              history.push(`/user?username=${record.user!.username}`)
            }
          >
            {record.user.first_name} {record.user.last_name}
          </span>
        ) : (
          '—'
        ),
    },
    {
      title: 'متن نظر',
      dataIndex: 'content',
      width: 250,
      ellipsis: true,
      fieldProps: { placeholder: 'جستجو در متن نظر' },
    },
    {
      title: 'پاسخ',
      dataIndex: 'reply',
      hideInSearch: true,
      width: 250,
      ellipsis: true,
      render: (_, record) => record.reply || '—',
    },
    {
      title: 'وضعیت',
      dataIndex: 'status',
      width: 120,
      valueType: 'select',
      valueEnum: {
        pending: { text: 'در انتظار بررسی' },
        approved: { text: 'تایید شده' },
        rejected: { text: 'رد شده' },
      },
      render: (_, record) => (
        <Tag color={statusLabelMap[record.status].color}>
          {statusLabelMap[record.status].text}
        </Tag>
      ),
    },
    {
      title: 'تاریخ ایجاد',
      dataIndex: 'created_at',
      hideInSearch: true,
      width: 150,
      valueType: 'dateTime',
      sorter: true,
    },
    {
      title: 'عملیات',
      valueType: 'option',
      width: 160,
      fixed: 'right',
      render: (_, record) => (
        <Space>
          {record.status !== 'approved' && (
            <Tooltip title="تایید">
              <a
                style={{ color: '#52c41a' }}
                onClick={() => handleUpdateStatus(record, 'approved')}
              >
                <CheckOutlined />
              </a>
            </Tooltip>
          )}
          {record.status !== 'rejected' && (
            <Tooltip title="رد">
              <a
                style={{ color: '#ff4d4f' }}
                onClick={() => handleUpdateStatus(record, 'rejected')}
              >
                <CloseOutlined />
              </a>
            </Tooltip>
          )}
          <Tooltip title="پاسخ">
            <a onClick={() => openReplyModal(record)}>
              <MessageOutlined />
            </a>
          </Tooltip>
        </Space>
      ),
    },
  ];

  return (
    <PageContainer header={{ title: 'مدیریت نظرات مقالات' }}>
      <ProTable<API.NewsCommentItem>
        headerTitle="لیست نظرات"
        actionRef={actionRef}
        rowKey="id"
        columns={columns}
        search={{ labelWidth: 'auto' }}
        request={async (params, sort) => {
          const response = await getNewsComments({
            content: params.content,
            status: params.status,
            page: params.current,
            page_size: params.pageSize,
            sorter:
              sort && Object.keys(sort).length
                ? JSON.stringify(sort)
                : undefined,
          });

          return {
            data: response.data?.list || [],
            total: response.data?.pagination?.total || 0,
            success: response.success,
          };
        }}
        pagination={{
          pageSize,
          showSizeChanger: true,
          showQuickJumper: true,
          onShowSizeChange: (_current, size) => setPageSize(size),
          showTotal: (total) => `مجموع: ${total} نظر`,
        }}
        options={{
          density: true,
          fullScreen: true,
          reload: true,
          setting: { listsHeight: 400 },
        }}
        scroll={{ x: 1200 }}
        cardBordered
      />

      <Modal
        title="پاسخ به نظر"
        open={replyModalVisible}
        onCancel={() => {
          setReplyModalVisible(false);
          setReplyRecord(null);
        }}
        footer={null}
      >
        {replyRecord && (
          <>
            <div style={{ marginBottom: 12, color: '#595959' }}>
              {replyRecord.content}
            </div>
            <TextArea
              rows={4}
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              placeholder="پاسخ خود را بنویسید..."
              maxLength={2000}
            />
            <Button
              type="primary"
              style={{ marginTop: 8 }}
              onClick={handleSubmitReply}
              loading={submittingReply}
              disabled={!replyContent.trim()}
            >
              ثبت پاسخ
            </Button>
          </>
        )}
      </Modal>
    </PageContainer>
  );
};

export default NewsCommentsPage;
