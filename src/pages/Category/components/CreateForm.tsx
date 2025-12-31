import { createCategory, getCategoriesForSelect } from '@/services/category';
import { PlusOutlined } from '@ant-design/icons';
import { Form, Input, InputNumber, Modal, Select, Upload, message } from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

interface CreateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
}

// Status options for the dropdown
const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' },
];

const CreateForm: React.FC<CreateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // State for parent category dropdown options
  const [parentOptions, setParentOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [parentLoading, setParentLoading] = useState(false);

  // State for image upload
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // ============================================
  // HELPER FUNCTIONS
  // These are defined first since they're used by other functions below
  // ============================================

  /**
   * Convert uploaded file to base64 string
   * This is required because the API expects base64 encoded images
   */
  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  /**
   * Reset form state when closing modal
   * Called after successful submission or when cancelling
   */
  const handleReset = () => {
    form.resetFields();
    setFileList([]);
  };

  // ============================================
  // DATA FETCHING FUNCTIONS
  // Defined before useEffect since they're called inside the effect
  // ============================================

  /**
   * Fetch categories for parent dropdown
   * We exclude categories that shouldn't be parents (optional business logic)
   */
  const fetchParentCategories = async () => {
    setParentLoading(true);
    try {
      const response = await getCategoriesForSelect();
      if (response.success && response.data?.list) {
        // Transform categories to dropdown options
        // Format: "Parent Title > Child Title" for nested display
        const options = response.data.list.map((cat) => ({
          label: cat.parent ? `${cat.parent.title} > ${cat.title}` : cat.title,
          value: cat.id,
        }));
        setParentOptions(options);
      }
    } catch (error) {
      console.error('Failed to fetch parent categories:', error);
      message.error('خطا در دریافت لیست دسته‌بندی‌ها');
    } finally {
      setParentLoading(false);
    }
  };

  // ============================================
  // EFFECTS
  // Now that functions are defined above, we can safely reference them
  // ============================================

  /**
   * Fetch categories for parent dropdown when modal opens
   */
  useEffect(() => {
    if (visible) {
      fetchParentCategories();
    }
  }, [visible]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Transforms form values to API payload format and sends request
   */
  const handleSubmit = async () => {
    try {
      const values = await form.validateFields();
      setLoading(true);

      // Prepare image as base64 if uploaded
      let imageBase64: string | null = null;
      if (fileList.length > 0 && fileList[0].originFileObj) {
        imageBase64 = await getBase64(fileList[0].originFileObj);
      }

      // Build the API payload
      const payload: API.CategoryPayload = {
        title: values.title,
        parent_id: values.parent_id || '', // Empty string for root category
        priority: values.priority,
        status: values.status,
        image: imageBase64,
        alt_image: values.alt_image || null,
      };

      const response = await createCategory(payload);

      if (response.success) {
        message.success('دسته‌بندی با موفقیت ایجاد شد');
        handleReset();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ایجاد دسته‌بندی');
      }
    } catch (error) {
      console.error('Create category error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal cancel
   * Resets form and calls parent's onCancel callback
   */
  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  /**
   * Custom upload handler - prevents actual upload
   * We just store the file locally and convert to base64 on submit
   */
  const handleUploadChange = ({ fileList: newFileList }: any) => {
    // Only keep the latest file
    setFileList(newFileList.slice(-1));
  };

  return (
    <Modal
      title="افزودن دسته‌بندی جدید"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={500}
      destroyOnClose
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={{
          status: 'active',
          priority: 1,
        }}
      >
        {/* Category Title - Required */}
        <Form.Item
          name="title"
          label="عنوان دسته‌بندی"
          rules={[
            { required: true, message: 'لطفاً عنوان دسته‌بندی را وارد کنید' },
            { max: 100, message: 'عنوان نباید بیشتر از 100 کاراکتر باشد' },
          ]}
        >
          <Input placeholder="عنوان دسته‌بندی" />
        </Form.Item>

        {/* Parent Category - Optional */}
        <Form.Item
          name="parent_id"
          label="دسته‌بندی والد"
          tooltip="برای ایجاد دسته‌بندی اصلی، این فیلد را خالی بگذارید"
        >
          <Select
            allowClear
            showSearch
            placeholder="انتخاب دسته‌بندی والد (اختیاری)"
            loading={parentLoading}
            options={parentOptions}
            filterOption={(input, option) =>
              (option?.label as string)
                ?.toLowerCase()
                .includes(input.toLowerCase())
            }
          />
        </Form.Item>

        {/* Priority - Required */}
        <Form.Item
          name="priority"
          label="اولویت نمایش"
          rules={[{ required: true, message: 'لطفاً اولویت را وارد کنید' }]}
          tooltip="عدد کمتر = اولویت بالاتر در نمایش"
        >
          <InputNumber
            min={1}
            max={10000}
            style={{ width: '100%' }}
            placeholder="اولویت نمایش"
          />
        </Form.Item>

        {/* Status - Required */}
        <Form.Item
          name="status"
          label="وضعیت"
          rules={[{ required: true, message: 'لطفاً وضعیت را انتخاب کنید' }]}
        >
          <Select options={statusOptions} placeholder="انتخاب وضعیت" />
        </Form.Item>

        {/* Image Upload - Optional */}
        <Form.Item name="image" label="تصویر دسته‌بندی">
          <Upload
            listType="picture-card"
            fileList={fileList}
            onChange={handleUploadChange}
            beforeUpload={() => false} // Prevent auto upload
            maxCount={1}
            accept="image/*"
          >
            {fileList.length === 0 && (
              <div>
                <PlusOutlined />
                <div style={{ marginTop: 8 }}>آپلود تصویر</div>
              </div>
            )}
          </Upload>
        </Form.Item>

        {/* Image Alt Text - Optional */}
        <Form.Item
          name="alt_image"
          label="متن جایگزین تصویر"
          tooltip="این متن برای SEO و دسترسی‌پذیری استفاده می‌شود"
        >
          <Input placeholder="توضیح کوتاه تصویر" />
        </Form.Item>
      </Form>
    </Modal>
  );
};

export default CreateForm;
