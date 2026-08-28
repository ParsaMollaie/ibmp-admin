import { createBusinessPartner } from '@/services/business-partners';
import { combineFaDateAndTimeToEnDateTime } from '@/utils/convert-fa-date-to-en-date';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Col, Form, InputNumber, message, Row, Space, Upload } from 'antd';
import React, { useState } from 'react';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker, { DateObject } from 'react-multi-date-picker';

interface CreateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

// Helper function to convert file to base64
const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });
};

const CreateForm: React.FC<CreateFormProps> = ({
  open,
  onOpenChange,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const publishAt: DateObject | undefined = Form.useWatch('publish_at', form);

  // State for image upload
  const [imageList, setImageList] = useState<UploadFile[]>([]);

  // Reset form and file list when modal closes
  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    const hide = message.loading('در حال ایجاد...');

    try {
      // Convert uploaded file to base64
      let imageBase64: string | null = null;

      if (imageList.length > 0 && imageList[0].originFileObj) {
        imageBase64 = await fileToBase64(imageList[0].originFileObj);
      }

      const payload: API.BusinessPartnerPayload = {
        title: values.title,
        priority: values.priority,
        status: values.status,
        link: values.link,
        alt_image: values.alt_image || null,
        image: imageBase64,
        publish_at: values.publish_at
          ? combineFaDateAndTimeToEnDateTime(
              values.publish_at,
              values.publish_at_hour,
              values.publish_at_minute,
              values.publish_at_second,
            )
          : null,
        end_date: values.end_date
          ? combineFaDateAndTimeToEnDateTime(
              values.end_date,
              values.end_date_hour,
              values.end_date_minute,
              values.end_date_second,
            )
          : null,
      };

      const res = await createBusinessPartner(payload);
      hide();

      if (res.success) {
        message.success('برند معتبر با موفقیت ایجاد شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در ایجاد برند معتبر');
      }
    } catch (error) {
      hide();
      console.error('Create business partner error:', error);
      message.error('خطا در ایجاد برند معتبر');
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>آپلود</div>
    </div>
  );

  return (
    <ModalForm
      title="افزودن برند معتبر جدید"
      form={form}
      open={open}
      onOpenChange={handleOpenChange}
      onFinish={handleSubmit}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
      }}
    >
      <ProFormText
        name="title"
        label="عنوان"
        placeholder="عنوان برند معتبر را وارد کنید"
        rules={[{ required: true, message: 'عنوان الزامی است' }]}
      />

      <ProFormDigit
        name="priority"
        label="اولویت"
        placeholder="اولویت نمایش"
        min={1}
        rules={[{ required: true, message: 'اولویت الزامی است' }]}
      />

      <ProFormSelect
        name="status"
        label="وضعیت"
        placeholder="وضعیت را انتخاب کنید"
        rules={[{ required: true, message: 'انتخاب وضعیت الزامی است' }]}
        options={[
          { label: 'فعال', value: 'active' },
          { label: 'غیرفعال', value: 'inactive' },
        ]}
      />

      <ProFormText
        name="link"
        label="لینک"
        placeholder="https://example.com"
        rules={[
          { required: true, message: 'لینک الزامی است' },
          { type: 'url', message: 'لطفاً یک URL معتبر وارد کنید' },
        ]}
      />

      <ProFormText
        name="alt_image"
        label="متن جایگزین تصویر (Alt)"
        placeholder="توضیح تصویر برای SEO"
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

      <Form.Item label="تصویر" name="image">
        <Upload
          listType="picture-card"
          fileList={imageList}
          onChange={({ fileList }) => setImageList(fileList)}
          beforeUpload={() => false}
          maxCount={1}
          accept="image/*"
        >
          {imageList.length >= 1 ? null : uploadButton}
        </Upload>
      </Form.Item>
    </ModalForm>
  );
};

export default CreateForm;
