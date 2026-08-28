import { createSlider } from '@/services/auth';
import { combineFaDateAndTimeToEnDateTime } from '@/utils/convert-fa-date-to-en-date';
import { PlusOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import {
  Col,
  Form,
  InputNumber,
  Modal,
  Row,
  Space,
  Upload,
  message,
} from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useState } from 'react';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker, { DateObject } from 'react-multi-date-picker';

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

const CreateForm: React.FC<{
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}> = ({ visible, onCancel, onSuccess }) => {
  const [form] = Form.useForm();
  const publishAt: DateObject | undefined = Form.useWatch('publish_at', form);

  const [imagePreview, setImagePreview] = useState<string>('');
  const [portraitImagePreview, setPortraitImagePreview] = useState<string>('');

  const handleImageChange: UploadProps['onChange'] = async ({ file }) => {
    if (file.status === 'removed') {
      setImagePreview('');
      return;
    }

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    console.log(file);

    setImagePreview(file.url || (file.preview as string));
  };

  const handlePortraitImageChange: UploadProps['onChange'] = async ({
    file,
  }) => {
    if (file.status === 'removed') {
      setPortraitImagePreview('');
      return;
    }

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setPortraitImagePreview(file.url || (file.preview as string));
  };

  const beforeUpload = (file: RcFile) => {
    const isImage = file.type.startsWith('image/');
    if (!isImage) {
      message.error('فقط فایل‌های تصویری قابل آپلود هستند!');
    }
    const isLt5M = file.size / 1024 / 1024 < 5;
    if (!isLt5M) {
      message.error('حجم تصویر باید کمتر از 5MB باشد!');
    }
    return isImage && isLt5M;
  };

  const handleSubmit = async (values: any) => {
    try {
      const formData = new FormData();

      const dateFieldKeys = [
        'publish_at',
        'publish_at_hour',
        'publish_at_minute',
        'publish_at_second',
        'end_date',
        'end_date_hour',
        'end_date_minute',
        'end_date_second',
      ];

      Object.keys(values).forEach((key) => {
        if (dateFieldKeys.includes(key)) {
          return;
        }
        if (values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      formData.append('image', imagePreview);

      formData.append('portrait_image', portraitImagePreview);

      if (values.publish_at) {
        const publishAtValue = combineFaDateAndTimeToEnDateTime(
          values.publish_at,
          values.publish_at_hour,
          values.publish_at_minute,
          values.publish_at_second,
        );
        if (publishAtValue) {
          formData.append('publish_at', publishAtValue);
        }
      }

      if (values.end_date) {
        const endDateValue = combineFaDateAndTimeToEnDateTime(
          values.end_date,
          values.end_date_hour,
          values.end_date_minute,
          values.end_date_second,
        );
        if (endDateValue) {
          formData.append('end_date', endDateValue);
        }
      }

      await createSlider(formData);
      message.success('اسلایدر با موفقیت ایجاد شد');

      form.resetFields();
      setImagePreview('');
      setPortraitImagePreview('');
      onSuccess();
    } catch (error) {
      console.error('Create slider error:', error);
      message.error('خطا در ایجاد اسلایدر');
    }
  };

  return (
    <Modal
      width={800}
      title="افزودن اسلایدر جدید"
      open={visible}
      destroyOnHidden
      onCancel={onCancel}
      footer={null}
    >
      <ProForm
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          status: 'active',
          type: 'main',
          priority: 1,
          color: '#ffffff',
        }}
      >
        <ProFormText
          name="title"
          label="عنوان"
          placeholder="عنوان اسلایدر را وارد کنید"
          rules={[{ required: true, message: 'لطفاً عنوان را وارد کنید' }]}
        />

        <ProFormSelect
          name="type"
          label="نوع اسلایدر"
          placeholder="نوع اسلایدر را انتخاب کنید"
          rules={[
            { required: true, message: 'لطفاً نوع اسلایدر را انتخاب کنید' },
          ]}
          options={[
            { value: 'main', label: 'اصلی' },
            { value: 'secondary', label: 'ثانویه' },
          ]}
        />

        <ProFormSelect
          name="status"
          label="وضعیت"
          placeholder="وضعیت اسلایدر را انتخاب کنید"
          rules={[
            { required: true, message: 'لطفاً وضعیت اسلایدر را انتخاب کنید' },
          ]}
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
        />

        <ProFormDigit
          name="priority"
          label="اولویت"
          placeholder="اولویت نمایش را وارد کنید"
          min={1}
          max={100}
          rules={[{ required: true, message: 'لطفاً اولویت را وارد کنید' }]}
        />

        <ProFormText
          name="link"
          label="لینک"
          placeholder="https://example.com"
          rules={[{ type: 'url', message: 'لطفاً یک URL معتبر وارد کنید' }]}
        />

        <ProFormText
          name="alt_image"
          label="متن جایگزین تصویر"
          placeholder="متن جایگزین برای تصویر"
          rules={[
            { required: true, message: 'لطفاً متن جایگزین تصویر را وارد کنید' },
          ]}
        />

        <Row gutter={16}>
          <Col span={12}>
            <Form.Item name="publish_at" label="تاریخ شروع نمایش">
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                placeholder="تاریخ شروع نمایش"
                style={{ width: '100%' }}
              />
            </Form.Item>
            <Form.Item label="ساعت شروع نمایش">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="publish_at_hour" noStyle>
                  <InputNumber
                    min={0}
                    max={23}
                    placeholder="ساعت"
                    style={{ width: '34%' }}
                  />
                </Form.Item>
                <Form.Item name="publish_at_minute" noStyle>
                  <InputNumber
                    min={0}
                    max={59}
                    placeholder="دقیقه"
                    style={{ width: '33%' }}
                  />
                </Form.Item>
                <Form.Item name="publish_at_second" noStyle>
                  <InputNumber
                    min={0}
                    max={59}
                    placeholder="ثانیه"
                    style={{ width: '33%' }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
          <Col span={12}>
            <Form.Item name="end_date" label="تاریخ پایان نمایش">
              <DatePicker
                calendar={persian}
                locale={persian_fa}
                format="YYYY/MM/DD"
                placeholder="تاریخ پایان نمایش"
                style={{ width: '100%' }}
                minDate={publishAt}
              />
            </Form.Item>
            <Form.Item label="ساعت پایان نمایش">
              <Space.Compact style={{ width: '100%' }}>
                <Form.Item name="end_date_hour" noStyle>
                  <InputNumber
                    min={0}
                    max={23}
                    placeholder="ساعت"
                    style={{ width: '34%' }}
                  />
                </Form.Item>
                <Form.Item name="end_date_minute" noStyle>
                  <InputNumber
                    min={0}
                    max={59}
                    placeholder="دقیقه"
                    style={{ width: '33%' }}
                  />
                </Form.Item>
                <Form.Item name="end_date_second" noStyle>
                  <InputNumber
                    min={0}
                    max={59}
                    placeholder="ثانیه"
                    style={{ width: '33%' }}
                  />
                </Form.Item>
              </Space.Compact>
            </Form.Item>
          </Col>
        </Row>

        <Form.Item
          name="image"
          label="تصویر اصلی"
          rules={[
            { required: true, message: 'لطفاً تصویر اصلی را آپلود کنید' },
          ]}
        >
          <Upload
            name="image"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleImageChange}
            maxCount={1}
          >
            {imagePreview ? (
              <img
                src={imagePreview}
                alt="preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        <Form.Item name="portrait_image" label="تصویر پرتره">
          <Upload
            name="portrait_image"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handlePortraitImageChange}
            maxCount={1}
          >
            {portraitImagePreview ? (
              <img
                src={portraitImagePreview}
                alt="portrait preview"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود</div>
              </div>
            )}
          </Upload>
        </Form.Item>
      </ProForm>
    </Modal>
  );
};

export default CreateForm;
