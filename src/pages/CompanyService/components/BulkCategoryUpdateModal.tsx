import { bulkUpdateCompanyServiceCategories } from '@/services/company-service';
import {
  buildCategoryLookup,
  buildPathLookup,
  collectLeafCategories,
  LeafCategory,
} from '@/utils/categoryHelpers';
import { parseExcelFile, sheetToJson } from '@/utils/exportExcel';
import { InboxOutlined } from '@ant-design/icons';
import { Alert, Button, message, Modal, Space, Table, Tag, Upload } from 'antd';
import React, { useMemo, useState } from 'react';

interface BulkCategoryUpdateModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  categoryTree: API.CategoryTreeItem[];
}

interface ParsedRow {
  id: string;
  code: string | number;
  title: string;
  companyName: string;
  currentCategory: string;
  newCategoryName: string;
  resolvedCategoryId?: string;
  error?: string;
}

const HEADER_MAP: Record<string, keyof ParsedRow> = {
  شناسه: 'id',
  کد: 'code',
  عنوان: 'title',
  'نام شرکت': 'companyName',
  'دسته‌بندی فعلی': 'currentCategory',
  'دسته‌بندی جدید': 'newCategoryName',
};

const BulkCategoryUpdateModal: React.FC<BulkCategoryUpdateModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  categoryTree,
}) => {
  const [parsedRows, setParsedRows] = useState<ParsedRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const leaves = useMemo<LeafCategory[]>(
    () => collectLeafCategories(categoryTree),
    [categoryTree],
  );

  const handleFileSelect = async (file: File) => {
    setLoading(true);
    try {
      const workbook = await parseExcelFile(file);
      const rawRows = sheetToJson<Record<string, any>>(workbook, 0);

      if (rawRows.length === 0) {
        message.warning('فایل خالی است');
        setLoading(false);
        return;
      }

      const { map: titleMap, duplicates } = buildCategoryLookup(leaves);
      const pathMap = buildPathLookup(leaves);

      const rows: ParsedRow[] = [];

      for (const raw of rawRows) {
        const mapped: Record<string, any> = {};
        for (const [persianKey, engKey] of Object.entries(HEADER_MAP)) {
          mapped[engKey] = raw[persianKey] ?? '';
        }

        const row: ParsedRow = {
          id: String(mapped.id || '').trim(),
          code: mapped.code,
          title: String(mapped.title || ''),
          companyName: String(mapped.companyName || ''),
          currentCategory: String(mapped.currentCategory || ''),
          newCategoryName: String(mapped.newCategoryName || '').trim(),
        };

        // Skip rows where new category is empty
        if (!row.newCategoryName) continue;

        // Resolve category name to ID
        const name = row.newCategoryName;

        if (titleMap.has(name) && !duplicates.has(name)) {
          row.resolvedCategoryId = titleMap.get(name);
        } else if (pathMap.has(name)) {
          // Try full path match
          row.resolvedCategoryId = pathMap.get(name);
        } else if (duplicates.has(name)) {
          row.error = 'نام دسته‌بندی مبهم است - لطفاً مسیر کامل را وارد کنید';
        } else {
          row.error = 'دسته‌بندی یافت نشد';
        }

        rows.push(row);
      }

      setParsedRows(rows);
    } catch (error) {
      message.error('خطا در خواندن فایل اکسل');
    } finally {
      setLoading(false);
    }
  };

  const errorCount = parsedRows.filter((r) => r.error).length;
  const resolvedCount = parsedRows.filter((r) => r.resolvedCategoryId).length;

  const handleClose = () => {
    setParsedRows([]);
    onCancel();
  };

  const handleSubmit = async () => {
    const items = parsedRows
      .filter((r) => r.resolvedCategoryId)
      .map((r) => ({ id: r.id, category_id: r.resolvedCategoryId! }));

    if (items.length === 0) return;

    setSubmitting(true);
    try {
      const response = await bulkUpdateCompanyServiceCategories(items);
      if (response.success) {
        message.success(
          `${
            response.data?.updated_count || items.length
          } سرویس با موفقیت به‌روزرسانی شد`,
        );
        handleClose();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در به‌روزرسانی');
      }
    } catch (error) {
      message.error('خطا در برقراری ارتباط با سرور');
    } finally {
      setSubmitting(false);
    }
  };

  const previewColumns = [
    {
      title: 'کد',
      dataIndex: 'code',
      key: 'code',
      width: 70,
    },
    {
      title: 'عنوان',
      dataIndex: 'title',
      key: 'title',
      width: 180,
      ellipsis: true,
    },
    {
      title: 'نام شرکت',
      dataIndex: 'companyName',
      key: 'companyName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'دسته‌بندی فعلی',
      dataIndex: 'currentCategory',
      key: 'currentCategory',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'دسته‌بندی جدید',
      dataIndex: 'newCategoryName',
      key: 'newCategoryName',
      width: 150,
      ellipsis: true,
    },
    {
      title: 'وضعیت',
      key: 'status',
      width: 200,
      render: (_: any, record: ParsedRow) => {
        if (record.error) {
          return <Tag color="error">{record.error}</Tag>;
        }
        return <Tag color="success">تشخیص داده شد</Tag>;
      },
    },
  ];

  return (
    <Modal
      title="بارگذاری دسته‌بندی گروهی"
      open={visible}
      onCancel={handleClose}
      width={1000}
      footer={
        parsedRows.length > 0
          ? [
              <Button key="cancel" onClick={handleClose}>
                انصراف
              </Button>,
              <Button
                key="submit"
                type="primary"
                onClick={handleSubmit}
                loading={submitting}
                disabled={errorCount > 0 || resolvedCount === 0}
              >
                به‌روزرسانی {resolvedCount} سرویس
              </Button>,
            ]
          : null
      }
    >
      {parsedRows.length === 0 ? (
        <Upload.Dragger
          accept=".xlsx,.xls"
          beforeUpload={(file) => {
            handleFileSelect(file);
            return false;
          }}
          showUploadList={false}
        >
          <p className="ant-upload-drag-icon">
            <InboxOutlined />
          </p>
          <p className="ant-upload-text">
            فایل اکسل را اینجا بکشید یا کلیک کنید
          </p>
          <p className="ant-upload-hint">
            فقط فایل‌های .xlsx و .xls پشتیبانی می‌شود
          </p>
        </Upload.Dragger>
      ) : (
        <>
          <Space style={{ marginBottom: 16 }}>
            <Alert
              type="info"
              message={`تعداد کل: ${parsedRows.length} ردیف`}
              style={{ display: 'inline-flex' }}
            />
            <Alert
              type="success"
              message={`تشخیص داده شده: ${resolvedCount}`}
              style={{ display: 'inline-flex' }}
            />
            {errorCount > 0 && (
              <Alert
                type="error"
                message={`خطا: ${errorCount}`}
                style={{ display: 'inline-flex' }}
              />
            )}
          </Space>

          <Table
            columns={previewColumns}
            dataSource={parsedRows}
            rowKey={(_, index) => `row-${index}`}
            size="small"
            pagination={{ pageSize: 20 }}
            scroll={{ x: 900 }}
            loading={loading}
          />
        </>
      )}
    </Modal>
  );
};

export default BulkCategoryUpdateModal;
