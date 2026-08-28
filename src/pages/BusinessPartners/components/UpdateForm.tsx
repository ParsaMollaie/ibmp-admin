import { updateBusinessPartner } from '@/services/business-partners';
import { convertEnDateToFaDate } from '@/utils/convert-en-date-to-fa-date';
import { combineFaDateAndTimeToEnDateTime } from '@/utils/convert-fa-date-to-en-date';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import {
  Col,
  Form,
  Image,
  InputNumber,
  message,
  Row,
  Space,
  Upload,
} from 'antd';
import React, { useEffect, useState } from 'react';
import persian from 'react-date-object/calendars/persian';
import persian_fa from 'react-date-object/locales/persian_fa';
import DatePicker, { DateObject } from 'react-multi-date-picker';

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
  const publishAt: DateObject | undefined = Form.useWatch('publish_at', form);

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
        publish_at: record.publish_at
          ? convertEnDateToFaDate(record.publish_at)
          : undefined,
        publish_at_hour: record.publish_at
          ? new Date(record.publish_at).getHours()
          : undefined,
        publish_at_minute: record.publish_at
          ? new Date(record.publish_at).getMinutes()
          : undefined,
        publish_at_second: record.publish_at
          ? new Date(record.publish_at).getSeconds()
          : undefined,
        end_date: record.end_date
          ? convertEnDateToFaDate(record.end_date)
          : undefined,
        end_date_hour: record.end_date
          ? new Date(record.end_date).getHours()
          : undefined,
        end_date_minute: record.end_date
          ? new Date(record.end_date).getMinutes()
          : undefined,
        end_date_second: record.end_date
          ? new Date(record.end_date).getSeconds()
          : undefined,
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
      console.error('Update business partner error:', error);
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
