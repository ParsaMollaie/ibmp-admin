import {
  getWebsiteContact,
  saveWebsiteContact,
} from '@/services/website-contact';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import { useRequest } from '@umijs/max';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  InputNumber,
  Row,
  Space,
  Spin,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { Title, Text } = Typography;

const WebsiteContactPage: React.FC = () => {
  // Form instance for programmatic control
  const [form] = Form.useForm();

  // Loading state for save operation
  const [saving, setSaving] = useState(false);

  // ============================================
  // DATA FETCHING
  // ============================================

  // Fetch website contact data on component mount
  const { data: contactData, loading } = useRequest(getWebsiteContact);

  // Extract the contact info from response
  const contactInfo = contactData?.data;

  // ============================================
  // FORM POPULATION
  // ============================================

  // Populate form when data is loaded
  useEffect(() => {
    if (contactInfo) {
      form.setFieldsValue({
        email: contactInfo.email,
        address: contactInfo.address,
        // Parse string coordinates to numbers for InputNumber
        latitude: parseFloat(contactInfo.latitude),
        longitude: parseFloat(contactInfo.longitude),
        // Map phones array to form list structure
        phones: contactInfo.phones.map((phone) => ({ value: phone })),
      });
    }
  }, [contactInfo, form]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  // Handle form submission
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);

      // Transform phones from form structure to simple array
      const phonesArray = values.phones
        ? values.phones
            .map((item: { value: string }) => item.value)
            .filter(Boolean)
        : [];

      const payload: API.WebsiteContactPayload = {
        email: values.email,
        address: values.address,
        latitude: values.latitude,
        longitude: values.longitude,
        phones: phonesArray,
      };

      const response = await saveWebsiteContact(payload);

      if (response.success) {
        message.success('اطلاعات تماس با موفقیت ذخیره شد');
      } else {
        message.error(response.message || 'خطا در ذخیره اطلاعات');
      }
    } catch (error) {
      console.error('Save website contact error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  // ============================================
  // RENDER
  // ============================================

  // Show loading spinner while fetching data
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
    <Card>
      {/* Page Header */}
      <div style={{ marginBottom: 24 }}>
        <Title level={4} style={{ margin: 0 }}>
          اطلاعات تماس وب‌سایت
        </Title>
        <Text type="secondary">
          اطلاعات تماس نمایش داده شده در وب‌سایت را از اینجا مدیریت کنید
        </Text>
      </div>

      {/* Main Form */}
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          phones: [{ value: '' }], // Start with one empty phone field
        }}
        style={{ maxWidth: 800 }}
      >
        {/* Email Field */}
        <Form.Item
          name="email"
          label="ایمیل"
          rules={[
            { required: true, message: 'لطفاً ایمیل را وارد کنید' },
            { type: 'email', message: 'فرمت ایمیل صحیح نیست' },
          ]}
        >
          <Input placeholder="info@example.com" style={{ direction: 'ltr' }} />
        </Form.Item>

        {/* Address Field */}
        <Form.Item
          name="address"
          label="آدرس"
          rules={[{ required: true, message: 'لطفاً آدرس را وارد کنید' }]}
        >
          <Input.TextArea rows={3} placeholder="آدرس کامل دفتر یا شرکت" />
        </Form.Item>

        {/* Coordinates Row */}
        <Row gutter={16}>
          <Col span={12}>
            <Form.Item
              name="latitude"
              label="عرض جغرافیایی (Latitude)"
              rules={[
                { required: true, message: 'لطفاً عرض جغرافیایی را وارد کنید' },
              ]}
            >
              <InputNumber<number>
                style={{ width: '100%', direction: 'ltr' }}
                placeholder="35.123456"
                step={0.000001}
                precision={6}
              />
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item
              name="longitude"
              label="طول جغرافیایی (Longitude)"
              rules={[
                { required: true, message: 'لطفاً طول جغرافیایی را وارد کنید' },
              ]}
            >
              <InputNumber<number>
                style={{ width: '100%', direction: 'ltr' }}
                placeholder="51.123456"
                step={0.000001}
                precision={6}
              />
            </Form.Item>
          </Col>
        </Row>

        {/* Dynamic Phone Numbers List */}
        <Form.Item label="شماره‌های تماس">
          <Form.List name="phones">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 8 }}
                    align="baseline"
                  >
                    {/* Phone Input */}
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      rules={[
                        { required: true, message: 'شماره تماس را وارد کنید' },
                      ]}
                      style={{ marginBottom: 0, width: 300 }}
                    >
                      <Input
                        placeholder="021-12345678"
                        style={{ direction: 'ltr' }}
                      />
                    </Form.Item>

                    {/* Remove Button - only show if more than one phone */}
                    {fields.length > 1 && (
                      <Button
                        type="text"
                        danger
                        icon={<DeleteOutlined />}
                        onClick={() => remove(name)}
                      />
                    )}
                  </Space>
                ))}

                {/* Add Phone Button */}
                <Form.Item style={{ marginBottom: 0 }}>
                  <Button
                    type="dashed"
                    onClick={() => add({ value: '' })}
                    icon={<PlusOutlined />}
                    style={{ width: 300 }}
                  >
                    افزودن شماره تماس
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
        </Form.Item>

        {/* Submit Button */}
        <Form.Item style={{ marginTop: 24 }}>
          <Button
            type="primary"
            onClick={handleSubmit}
            loading={saving}
            size="large"
          >
            ذخیره تغییرات
          </Button>
        </Form.Item>
      </Form>
    </Card>
  );
};

export default WebsiteContactPage;
