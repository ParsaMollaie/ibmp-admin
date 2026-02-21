import {
  getWebsiteContact,
  saveWebsiteContact,
} from '@/services/website-contact';
import {
  DeleteOutlined,
  EnvironmentOutlined,
  MailOutlined,
  PhoneOutlined,
  PlusOutlined,
  SaveOutlined,
} from '@ant-design/icons';
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
        postal_code: contactInfo.postal_code,
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
        postal_code: values.postal_code,
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
    <div>
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
          phones: [{ value: '' }],
        }}
      >
        {/* Card 1 — Email & Address */}
        <Card
          title={
            <Space>
              <MailOutlined />
              <span>اطلاعات تماس</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="email"
                label="ایمیل"
                rules={[
                  { required: true, message: 'لطفاً ایمیل را وارد کنید' },
                  { type: 'email', message: 'فرمت ایمیل صحیح نیست' },
                ]}
              >
                <Input
                  placeholder="info@example.com"
                  style={{ direction: 'ltr' }}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="address"
                label="آدرس"
                rules={[{ required: true, message: 'لطفاً آدرس را وارد کنید' }]}
              >
                <Input.TextArea rows={3} placeholder="آدرس کامل دفتر یا شرکت" />
              </Form.Item>
            </Col>
          </Row>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="postal_code"
                label="کد پستی"
                rules={[
                  {
                    max: 20,
                    message: 'کد پستی نمی‌تواند بیش از ۲۰ کاراکتر باشد',
                  },
                ]}
              >
                <Input placeholder="1234567890" style={{ direction: 'ltr' }} />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Card 2 — Location (Coordinates) */}
        <Card
          title={
            <Space>
              <EnvironmentOutlined />
              <span>موقعیت جغرافیایی</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="latitude"
                label="عرض جغرافیایی (Latitude)"
                rules={[
                  {
                    required: true,
                    message: 'لطفاً عرض جغرافیایی را وارد کنید',
                  },
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
                  {
                    required: true,
                    message: 'لطفاً طول جغرافیایی را وارد کنید',
                  },
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
          <Text type="secondary">
            مختصات جغرافیایی محل شرکت برای نمایش در نقشه
          </Text>
        </Card>

        {/* Card 3 — Phone Numbers */}
        <Card
          title={
            <Space>
              <PhoneOutlined />
              <span>شماره‌های تماس</span>
            </Space>
          }
          style={{ marginBottom: 16 }}
        >
          <Form.List name="phones">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Space
                    key={key}
                    style={{ display: 'flex', marginBottom: 8 }}
                    align="baseline"
                  >
                    <Form.Item
                      {...restField}
                      name={[name, 'value']}
                      rules={[
                        {
                          required: true,
                          message: 'شماره تماس را وارد کنید',
                        },
                      ]}
                      style={{ marginBottom: 0, flex: 1, minWidth: 300 }}
                    >
                      <Input
                        placeholder="021-12345678"
                        style={{ direction: 'ltr', width: '100%' }}
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
                  >
                    افزودن شماره تماس
                  </Button>
                </Form.Item>
              </>
            )}
          </Form.List>
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

export default WebsiteContactPage;
