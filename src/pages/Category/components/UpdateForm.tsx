import RichTextEditor from '@/components/RichTextEditor';
import { getCategoryTree, updateCategory } from '@/services/category';
import { PlusOutlined } from '@ant-design/icons';
import {
  Form,
  Input,
  InputNumber,
  Modal,
  Select,
  TreeSelect,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CategoryItem | null;
}

// Status options for the dropdown
const statusOptions = [
  { label: 'فعال', value: 'active' },
  { label: 'غیرفعال', value: 'inactive' },
];

// Type options for root categories
const typeOptions = [
  { label: 'شرکتی', value: 'company' },
  { label: 'مهندسی', value: 'engineers' },
];

// Mark inactive categories as disabled, recursively, so they stay visible
// in the parent-category tree for context but can't be selected.
const markInactiveDisabled = (
  nodes: API.CategoryTreeItem[],
): (API.CategoryTreeItem & { disabled: boolean })[] =>
  nodes.map((node) => ({
    ...node,
    disabled: node.status !== 'active',
    children: node.children
      ? markInactiveDisabled(node.children)
      : node.children,
  }));

// Drop a category and its entire subtree from the tree, so an edited
// category can't be assigned one of its own descendants as its parent.
const excludeSubtree = (
  nodes: API.CategoryTreeItem[],
  excludeId: string,
): API.CategoryTreeItem[] =>
  nodes
    .filter((node) => node.id !== excludeId)
    .map((node) => ({
      ...node,
      children: node.children
        ? excludeSubtree(node.children, excludeId)
        : node.children,
    }));

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // State for parent category tree options
  const [parentOptions, setParentOptions] = useState<API.CategoryTreeItem[]>(
    [],
  );
  const [parentLoading, setParentLoading] = useState(false);

  // State for image upload
  const [fileList, setFileList] = useState<UploadFile[]>([]);

  // Track if user uploaded a new image (to determine if we send base64 or keep existing)
  const [imageChanged, setImageChanged] = useState(false);

  // ============================================
  // HELPER FUNCTIONS
  // These are defined first since they're used by other functions below
  // ============================================

  /**
   * Convert uploaded file to base64 string
   * Used when submitting new images to the API
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
   * Reset form state to initial values
   * Called when closing modal or after successful submission
   */
  const handleReset = () => {
    form.resetFields();
    setFileList([]);
    setImageChanged(false);
  };

  // ============================================
  // DATA FETCHING FUNCTIONS
  // Defined before useEffect since they're called inside the effect
  // ============================================

  /**
   * Fetch the category tree for the parent picker.
   * Excludes the record's own subtree (can't become its own descendant's
   * child) and marks inactive categories disabled (visible but unselectable).
   */
  const fetchParentCategories = async () => {
    setParentLoading(true);
    try {
      const response = await getCategoryTree();
      if (response.success && response.data && record) {
        const withoutOwnSubtree = excludeSubtree(response.data, record.id);
        setParentOptions(markInactiveDisabled(withoutOwnSubtree));
      }
    } catch (error) {
      console.error('Failed to fetch parent categories:', error);
      message.error('خطا در دریافت لیست دسته‌بندی‌ها');
    } finally {
      setParentLoading(false);
    }
  };

  /**
   * Populate form fields with existing record data
   * Sets form values and configures the image preview
   */
  const populateForm = () => {
    if (!record) return;

    form.setFieldsValue({
      title: record.title,
      description: record.description || '',
      guide_title: record.guide_title || '',
      parent_id: record.parent?.id || undefined,
      priority: record.priority,
      status: record.status,
      alt_image: record.alt_image,
      type: record.type || undefined,
    });

    // If record has an existing image, show it in the upload component
    if (record.image) {
      setFileList([
        {
          uid: '-1',
          name: 'current-image',
          status: 'done',
          url: record.image,
        },
      ]);
    } else {
      setFileList([]);
    }

    setImageChanged(false);
  };

  // ============================================
  // EFFECTS
  // Now that functions are defined above, we can safely reference them
  // ============================================

  /**
   * Fetch parent categories and populate form when modal opens with a record
   */
  useEffect(() => {
    if (visible && record) {
      fetchParentCategories();
      populateForm();
    }
  }, [visible, record]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle form submission
   * Validates form, processes image, and sends update request
   */
  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Determine image value:
      // - If user uploaded new image: convert to base64
      // - If user removed image: null
      // - If unchanged: send existing URL or null
      let imageValue: string | null = null;

      if (imageChanged) {
        // User made changes to the image
        if (fileList.length > 0 && fileList[0].originFileObj) {
          // New image uploaded - convert to base64
          imageValue = await getBase64(fileList[0].originFileObj);
        } else {
          // Image was removed
          imageValue = null;
        }
      } else {
        // No changes to image - keep existing
        imageValue = null;
      }

      // Build the API payload
      const payload: API.CategoryPayload = {
        title: values.title,
        description: values.description || null,
        guide_title: values.guide_title || null,
        parent_id: values.parent_id || '', // Empty string for root category
        priority: values.priority,
        status: values.status,
        image: imageValue,
        alt_image: values.alt_image || null,
        type: values.type || null,
      };

      const response = await updateCategory(record.id, payload);

      if (response.success) {
        message.success('دسته‌بندی با موفقیت بروزرسانی شد');
        handleReset();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی دسته‌بندی');
      }
    } catch (error) {
      console.error('Update category error:', error);
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
   * Handle upload changes
   * Track that user has modified the image
   */
  const handleUploadChange = ({ fileList: newFileList }: any) => {
    setFileList(newFileList.slice(-1));
    setImageChanged(true);
  };

  /**
   * Handle image removal
   * Marks image as changed so we know to send null on submit
   */
  const handleRemove = () => {
    setImageChanged(true);
    return true;
  };

  return (
    <Modal
      title="ویرایش دسته‌بندی"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={500}
      destroyOnClose
    >
      {/* Display current category info header */}
      {record && (
        <div
          style={{
            marginBottom: 16,
            padding: 12,
            background: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <div style={{ fontWeight: 600 }}>{record.title}</div>
          <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
            کد: {record.code}
            {record.parent && ` | والد: ${record.parent.title}`}
          </div>
        </div>
      )}

      <Form form={form} layout="vertical">
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

        {/* Guide title - Optional, shown as the heading above the guide content */}
        <Form.Item
          name="guide_title"
          label="عنوان راهنما"
          tooltip="این متن به‌عنوان تیتر بالای راهنمای بررسی و انتخاب نمایش داده می‌شود"
        >
          <Input placeholder="مثال: راهنمای تخصصی انتخاب و قیمت ..." />
        </Form.Item>

        {/* Description / buying guide - Optional, shown at the bottom of the category's listing page */}
        <Form.Item
          name="description"
          label="راهنمای بررسی و انتخاب"
          tooltip="این متن در پایین صفحه لیست خدمات این دسته‌بندی نمایش داده می‌شود"
        >
          <RichTextEditor placeholder="راهنمای این دسته‌بندی را وارد کنید" />
        </Form.Item>

        {/* Parent Category - Optional */}
        <Form.Item
          name="parent_id"
          label="دسته‌بندی والد"
          tooltip="برای تبدیل به دسته‌بندی اصلی، این فیلد را خالی بگذارید"
        >
          <TreeSelect
            allowClear
            showSearch
            treeDefaultExpandAll
            placeholder="انتخاب دسته‌بندی والد (اختیاری)"
            loading={parentLoading}
            treeData={parentOptions}
            fieldNames={{ label: 'title', value: 'id', children: 'children' }}
            treeNodeFilterProp="title"
          />
        </Form.Item>

        {/* Type - Shown for root categories (no parent) */}
        <Form.Item
          noStyle
          shouldUpdate={(prevValues, currentValues) =>
            prevValues.parent_id !== currentValues.parent_id
          }
        >
          {({ getFieldValue }) =>
            !getFieldValue('parent_id') ? (
              <Form.Item
                name="type"
                label="نوع دسته‌بندی"
                rules={[
                  {
                    required: true,
                    message: 'لطفاً نوع دسته‌بندی را انتخاب کنید',
                  },
                ]}
              >
                <Select
                  options={typeOptions}
                  placeholder="انتخاب نوع دسته‌بندی"
                />
              </Form.Item>
            ) : null
          }
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
            onRemove={handleRemove}
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

export default UpdateForm;
