import { updateBusinessPartner } from '@/services/business-partners';
import { convertFaDateToEnDate } from '@/utils/convert-fa-date-to-en-date';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Col, Form, Image, message, Row, Upload } from 'antd';
import { DatePicker } from 'antd-jalali';
import type { Dayjs } from 'dayjs';
import dayjs from 'dayjs';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: API.BusinessPartnerItem;
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

const UpdateForm: React.FC<UpdateFormProps> = ({
  open,
  onOpenChange,
  record,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const publishAt: Dayjs | undefined = Form.useWatch('publish_at', form);

  const [imageList, setImageList] = useState<UploadFile[]>([]);

  const [imageChanged, setImageChanged] = useState(false);

  useEffect(() => {
    if (record && open) {
      form.setFieldsValue({
        title: record.title,
        priority: record.priority,
        status: record.status,
        link: record.link,
        alt_image: record.alt_image,
        publish_at: record.publish_at ? dayjs(record.publish_at) : undefined,
        end_date: record.end_date ? dayjs(record.end_date) : undefined,
      });

      // Reset image change flag
      setImageChanged(false);

      // Clear file list (we'll show existing image separately)
      setImageList([]);
    }
  }, [record, open, form]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setImageChanged(false);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    if (!record) return;

    const hide = message.loading('در حال بروزرسانی...');

    try {
      // Prepare payload with proper image handling
      const payload: API.BusinessPartnerPayload = {
        title: values.title,
        priority: values.priority,
        status: values.status,
        link: values.link,
        alt_image: values.alt_image || null,
        publish_at: values.publish_at
          ? convertFaDateToEnDate(values.publish_at.toDate()).format(
              'YYYY-MM-DD HH:mm:ss',
            )
          : null,
        end_date: values.end_date
          ? convertFaDateToEnDate(values.end_date.toDate()).format(
              'YYYY-MM-DD HH:mm:ss',
            )
          : null,
        ...(imageChanged && {
          image:
            imageList.length > 0 && imageList[0].originFileObj
              ? await fileToBase64(imageList[0].originFileObj)
              : null,
        }),
      };

      const res = await updateBusinessPartner(record.id, payload);
      hide();

      if (res.success) {
        message.success('برند معتبر با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در بروزرسانی برند معتبر');
      }
    } catch (error) {
      hide();
      message.error('خطا در بروزرسانی برند معتبر');
    }
  };

  const uploadButton = (
    <div>
      <PlusOutlined />
      <div style={{ marginTop: 8 }}>تغییر</div>
    </div>
  );

  return (
    <ModalForm
      title="ویرایش برند معتبر"
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
              format="YYYY/MM/DD HH:mm:ss"
              showTime={{ format: 'HH:mm:ss' }}
              placeholder="تاریخ شروع نمایش"
              style={{ width: '100%' }}
            />
          </Form.Item>
        </Col>
        <Col span={12}>
          <Form.Item name="end_date" label="تاریخ پایان نمایش">
            <DatePicker
              format="YYYY/MM/DD HH:mm:ss"
              showTime={{ format: 'HH:mm:ss' }}
              placeholder="تاریخ پایان نمایش"
              style={{ width: '100%' }}
              disabledDate={(current: Dayjs) =>
                publishAt
                  ? !!current && current.isBefore(publishAt, 'day')
                  : false
              }
            />
          </Form.Item>
        </Col>
      </Row>

      <Form.Item label="تصویر">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Show existing image if available and not changed */}
          {record?.image && !imageChanged && (
            <div>
              <Image
                src={record.image}
                width={100}
                height={80}
                style={{ objectFit: 'cover', borderRadius: 4 }}
              />
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                تصویر فعلی
              </div>
            </div>
          )}
          <Upload
            listType="picture-card"
            fileList={imageList}
            onChange={({ fileList }) => {
              setImageList(fileList);
              setImageChanged(true);
            }}
            onRemove={() => {
              setImageChanged(true);
              return true;
            }}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
          >
            {imageList.length >= 1 ? null : uploadButton}
          </Upload>
        </div>
      </Form.Item>
    </ModalForm>
  );
};

export default UpdateForm;
