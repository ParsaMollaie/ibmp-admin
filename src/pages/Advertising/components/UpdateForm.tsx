import { updateAdvertising } from '@/services/advertising';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormDigit,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Form, Image, message, Upload } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: API.AdvertisingItem;
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

  const [imageList, setImageList] = useState<UploadFile[]>([]);
  const [portraitImageList, setPortraitImageList] = useState<UploadFile[]>([]);

  // Track if user has changed the images (if not, we send null to keep existing)
  const [imageChanged, setImageChanged] = useState(false);
  const [portraitImageChanged, setPortraitImageChanged] = useState(false);

  // When record changes (modal opens with new data), populate the form
  useEffect(() => {
    if (record && open) {
      form.setFieldsValue({
        title: record.title,
        section: record.section,
        priority: record.priority,
        status: record.status,
        link: record.link,
        alt_image: record.alt_image,
      });

      // Reset image change flags
      setImageChanged(false);
      setPortraitImageChanged(false);

      // Clear file lists (we'll show existing images separately)
      setImageList([]);
      setPortraitImageList([]);
    }
  }, [record, open, form]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setPortraitImageList([]);
      setImageChanged(false);
      setPortraitImageChanged(false);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    if (!record) return;

    try {
      // Prepare image data based on whether user changed them
      let imageData: string | null = null;
      let portraitImageData: string | null = null;

      if (imageChanged) {
        // User changed the image - send new base64 or null if removed
        if (imageList.length > 0 && imageList[0].originFileObj) {
          imageData = await fileToBase64(imageList[0].originFileObj);
        }
        // If imageList is empty and changed, it means user removed it - send null
      }
      // If not changed, we send null to keep existing image on server

      if (portraitImageChanged) {
        if (
          portraitImageList.length > 0 &&
          portraitImageList[0].originFileObj
        ) {
          portraitImageData = await fileToBase64(
            portraitImageList[0].originFileObj,
          );
        }
      }

      const payload: API.AdvertisingPayload = {
        title: values.title,
        priority: values.priority,
        status: values.status,
        section: values.section,
        link: values.link,
        alt_image: values.alt_image || null,
        image: imageData,
        portrait_image: portraitImageData,
      };

      const res = await updateAdvertising(record.id, payload);

      if (res.success) {
        message.success('تبلیغ با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در بروزرسانی تبلیغ');
      }
    } catch (error) {
      message.error('خطا در بروزرسانی تبلیغ');
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
      title="ویرایش تبلیغ"
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
        placeholder="عنوان تبلیغ را وارد کنید"
        rules={[{ required: true, message: 'عنوان الزامی است' }]}
      />

      <ProFormSelect
        name="section"
        label="بخش"
        placeholder="بخش نمایش را انتخاب کنید"
        rules={[{ required: true, message: 'انتخاب بخش الزامی است' }]}
        options={[
          { label: 'بخش اول صفحه اصلی', value: 'main_page_first_section' },
          { label: 'بخش دوم صفحه اصلی', value: 'main_page_second_section' },
          { label: 'بخش سوم صفحه اصلی', value: 'main_page_third_section' },
        ]}
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

      {/* Current Image Preview + Upload for Change */}
      <Form.Item label="تصویر اصلی">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {/* Show existing image if available and not changed */}
          {record?.image && !imageChanged && (
            <div>
              <Image
                src={record.image}
                width={100}
                height={80}
                style={{ objectFit: 'cover' }}
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
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
          >
            {imageList.length >= 1 ? null : uploadButton}
          </Upload>
        </div>
      </Form.Item>

      {/* Portrait Image */}
      <Form.Item label="تصویر عمودی">
        <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
          {record?.portrait_image && !portraitImageChanged && (
            <div>
              <Image
                src={record.portrait_image}
                width={80}
                height={100}
                style={{ objectFit: 'cover' }}
              />
              <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                تصویر فعلی
              </div>
            </div>
          )}
          <Upload
            listType="picture-card"
            fileList={portraitImageList}
            onChange={({ fileList }) => {
              setPortraitImageList(fileList);
              setPortraitImageChanged(true);
            }}
            beforeUpload={() => false}
            maxCount={1}
            accept="image/*"
          >
            {portraitImageList.length >= 1 ? null : uploadButton}
          </Upload>
        </div>
      </Form.Item>
    </ModalForm>
  );
};

export default UpdateForm;
