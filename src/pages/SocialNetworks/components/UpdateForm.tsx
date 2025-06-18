import { SOCIAL_NETWORKS } from '@/constants';
import { updateSocialNetwork } from '@/services/auth';
import { PlusOutlined } from '@ant-design/icons';
import {
  ProForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import { Form, Modal, Upload, message } from 'antd';
import type { RcFile, UploadProps } from 'antd/es/upload/interface';
import { useState } from 'react';

const getBase64 = (file: RcFile): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = (error) => reject(error);
  });

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  initialValues: API.SocialNetworkItem;
}

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  initialValues,
}) => {
  const [form] = Form.useForm();
  const [iconPreview, setIconPreview] = useState<string>(
    initialValues.icon || '',
  );
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [selectedSocial, setSelectedSocial] = useState<string>(
    initialValues.social,
  );

  const handleIconChange: UploadProps['onChange'] = async ({ file }) => {
    if (file.status === 'removed') {
      setIconPreview(initialValues.icon || '');
      return;
    }

    if (!file.url && !file.preview) {
      file.preview = await getBase64(file.originFileObj as RcFile);
    }

    setIconPreview(file.url || (file.preview as string));
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
      delete values.icon;
      const formData = new FormData();

      Object.keys(values).forEach((key) => {
        if (values[key] !== undefined) {
          formData.append(key, values[key]);
        }
      });

      if (iconPreview && iconPreview !== initialValues.icon) {
        formData.append('icon', iconPreview);
      }

      await updateSocialNetwork(initialValues.id, formData);
      message.success('شبکه اجتماعی با موفقیت به‌روزرسانی شد');
      onSuccess();
    } catch (error) {
      message.error('خطا در به‌روزرسانی شبکه اجتماعی');
    }
  };

  return (
    <Modal
      width={600}
      title="ویرایش شبکه اجتماعی"
      open={visible}
      onCancel={onCancel}
      footer={null}
    >
      <ProForm
        form={form}
        onFinish={handleSubmit}
        initialValues={{
          ...initialValues,
        }}
      >
        <ProFormSelect
          name="social"
          label="نام شبکه اجتماعی"
          placeholder="شبکه اجتماعی را انتخاب کنید"
          rules={[
            { required: true, message: 'لطفاً شبکه اجتماعی را انتخاب کنید' },
          ]}
          options={SOCIAL_NETWORKS.map((network) => ({
            value: network.value,
            label: (
              <div
                style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
              >
                {network.icon}
                {network.label}
              </div>
            ),
          }))}
          fieldProps={{
            onChange: (value: string) => setSelectedSocial(value),
          }}
        />

        <ProFormSelect
          name="status"
          label="وضعیت"
          placeholder="وضعیت را انتخاب کنید"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
          options={[
            { value: 'active', label: 'فعال' },
            { value: 'inactive', label: 'غیرفعال' },
          ]}
        />

        <ProFormText
          name="link"
          label="لینک"
          placeholder="https://example.com"
          rules={[
            { required: true, message: 'لطفاً لینک را وارد کنید' },
            { type: 'url', message: 'لطفاً یک URL معتبر وارد کنید' },
          ]}
        />

        <ProFormText
          name="alt_icon"
          label="متن جایگزین آیکون"
          placeholder="متن جایگزین برای آیکون"
          rules={[
            { required: true, message: 'لطفاً متن جایگزین آیکون را وارد کنید' },
          ]}
        />

        <Form.Item
          name="icon"
          label="آیکون"
          rules={[{ required: true, message: 'لطفاً آیکون را آپلود کنید' }]}
        >
          <Upload
            name="icon"
            listType="picture-card"
            showUploadList={false}
            beforeUpload={beforeUpload}
            onChange={handleIconChange}
            maxCount={1}
          >
            {iconPreview ? (
              <img
                src={iconPreview}
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
      </ProForm>
    </Modal>
  );
};

export default UpdateForm;
