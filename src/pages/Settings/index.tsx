import { getSettings, saveSettings } from '@/services/settings';
import { SaveOutlined, SettingOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  Form,
  InputNumber,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const SettingsPage: React.FC = () => {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  // Fetch settings on mount
  const { data: settingsData, loading } = useRequest(getSettings);
  const settings = settingsData?.data;

  // Populate form when data loads
  useEffect(() => {
    if (settings) {
      form.setFieldsValue({
        tax_percentage: settings.tax_percentage
          ? parseFloat(settings.tax_percentage)
          : 10,
      });
    }
  }, [settings, form]);

  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      const response = await saveSettings({
        tax_percentage: String(values.tax_percentage),
      });

      if (response.success) {
        message.success('تنظیمات با موفقیت ذخیره شد');
      } else {
        message.error(response.message || 'خطا در ذخیره تنظیمات');
      }
    } catch (error) {
      console.error('Save settings error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <div style={{ textAlign: 'center', padding: 50 }}>
          <Spin size="large" />
          <div style={{ marginTop: 16 }}>در حال بارگذاری...</div>
        </div>
      </Card>
    );
  }

  return (
    <div>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          تنظیمات سیستم
        </Title>
        <Text type="secondary">
          تنظیمات عمومی سیستم را از اینجا مدیریت کنید
        </Text>
      </div>

      <Form form={form} layout="vertical">
        {/* Tax Settings Card */}
        <Card
          title={
            <Space>
              <SettingOutlined />
              <span>تنظیمات مالیات</span>
            </Space>
          }
          style={{ marginBottom: 16, maxWidth: 600 }}
        >
          <Form.Item
            name="tax_percentage"
            label="درصد مالیات"
            rules={[
              { required: true, message: 'لطفاً درصد مالیات را وارد کنید' },
            ]}
          >
            <InputNumber<number>
              style={{ width: '100%' }}
              min={0}
              max={100}
              precision={1}
              addonAfter="%"
              placeholder="10"
            />
          </Form.Item>
          <Text type="secondary">
            این درصد به عنوان مالیات به مبلغ پلن‌های غیر رایگان اضافه می‌شود
          </Text>
        </Card>

        {/* Submit Button */}
        <div style={{ textAlign: 'left' }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            size="large"
            icon={<SaveOutlined />}
          >
            ذخیره تغییرات
          </Button>
        </div>
      </Form>
    </div>
  );
};

export default SettingsPage;
