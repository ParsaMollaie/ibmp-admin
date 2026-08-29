import RichTextEditor from '@/components/RichTextEditor';
import { getCategoryTree } from '@/services/category';
import { updateNews } from '@/services/news';
import { PlusOutlined } from '@ant-design/icons';
import {
  ModalForm,
  ProFormSelect,
  ProFormText,
} from '@ant-design/pro-components';
import type { UploadFile } from 'antd';
import { Form, Image, message, Spin, TreeSelect, Upload } from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  record?: API.NewsItem;
  onSuccess: () => void;
}

const buildTreeSelectOptions = (
  items: API.CategoryTreeItem[],
): { title: string; value: string; key: string; children?: any[] }[] => {
  return items.map((item) => ({
    title: item.title,
    value: item.id,
    key: item.id,
    children:
      item.children && item.children.length > 0
        ? buildTreeSelectOptions(item.children)
        : undefined,
  }));
};

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
  const [previewImageList, setPreviewImageList] = useState<UploadFile[]>([]);

  // Track if user has changed the images
  const [imageChanged, setImageChanged] = useState(false);
  const [portraitImageChanged, setPortraitImageChanged] = useState(false);
  const [previewImageChanged, setPreviewImageChanged] = useState(false);

  // Loading state for form submission
  const [submitting, setSubmitting] = useState(false);

  const [categoryOptions, setCategoryOptions] = useState<
    { title: string; value: string; key: string; children?: any[] }[]
  >([]);

  useEffect(() => {
    getCategoryTree().then((res) => {
      setCategoryOptions(buildTreeSelectOptions(res.data || []));
    });
  }, []);

  // When record changes, populate the form
  useEffect(() => {
    if (record && open) {
      form.setFieldsValue({
        title: record.title,
        summary: record.summary,
        content: record.content,
        status: record.status,
        alt_image: record.alt_image,
        category_ids: record.categories?.map((category) => category.id) ?? [],
      });

      // Reset image change flags
      setImageChanged(false);
      setPortraitImageChanged(false);
      setPreviewImageChanged(false);

      // Clear file lists
      setImageList([]);
      setPortraitImageList([]);
      setPreviewImageList([]);
    }
  }, [record, open, form]);

  const handleOpenChange = (visible: boolean) => {
    if (!visible) {
      form.resetFields();
      setImageList([]);
      setPortraitImageList([]);
      setPreviewImageList([]);
      setImageChanged(false);
      setPortraitImageChanged(false);
      setPreviewImageChanged(false);
    }
    onOpenChange(visible);
  };

  const handleSubmit = async (values: any) => {
    if (!record) return;

    setSubmitting(true);
    const hide = message.loading('در حال بروزرسانی...');

    try {
      // Start with required fields
      const payload: Partial<API.NewsPayload> = {
        title: values.title,
        content: values.content,
        summary: values.summary,
        alt_image: values.alt_image || '',
        author_id: null,
        status: values.status,
        category_ids: values.category_ids || [],
      };

      // Handle main image
      if (imageChanged) {
        if (imageList.length > 0 && imageList[0].originFileObj) {
          // User uploaded a new image
          payload.image = await fileToBase64(imageList[0].originFileObj);
        } else {
          // User removed the image
          payload.image = '';
        }
      } else if (record.image) {
        // No changes - keep existing image
        payload.image = record.image;
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر اصلی الزامی است');
        return;
      }

      // Handle portrait image
      if (portraitImageChanged) {
        if (
          portraitImageList.length > 0 &&
          portraitImageList[0].originFileObj
        ) {
          payload.portrait_image = await fileToBase64(
            portraitImageList[0].originFileObj,
          );
        } else {
          payload.portrait_image = '';
        }
      } else if (record.portrait_image) {
        payload.portrait_image = record.portrait_image;
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر عمودی الزامی است');
        return;
      }

      // Handle preview image
      if (previewImageChanged) {
        if (previewImageList.length > 0 && previewImageList[0].originFileObj) {
          payload.preview_image = await fileToBase64(
            previewImageList[0].originFileObj,
          );
        } else {
          payload.preview_image = '';
        }
      } else if (record.preview_image) {
        payload.preview_image = record.preview_image;
      } else {
        hide();
        setSubmitting(false);
        message.error('تصویر پیش‌نمایش الزامی است');
        return;
      }

      const res = await updateNews(record.id, payload as API.NewsPayload);
      hide();
      setSubmitting(false);

      if (res.success) {
        message.success('خبر با موفقیت بروزرسانی شد');
        onSuccess();
      } else {
        message.error(res.message || 'خطا در بروزرسانی خبر');
      }
    } catch (error) {
      hide();
      setSubmitting(false);
      message.error('خطا در بروزرسانی خبر');
      console.error(error);
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
      title="ویرایش خبر"
      form={form}
      open={open}
      onOpenChange={handleOpenChange}
      onFinish={handleSubmit}
      submitter={{
        submitButtonProps: {
          loading: submitting,
        },
      }}
      modalProps={{
        destroyOnClose: true,
        maskClosable: false,
        width: 700,
      }}
    >
      <Spin spinning={submitting} tip="در حال پردازش...">
        <ProFormText
          name="title"
          label="عنوان"
          placeholder="عنوان خبر را وارد کنید"
          rules={[{ required: true, message: 'عنوان الزامی است' }]}
        />

        <Form.Item
          name="summary"
          label="خلاصه"
          rules={[{ required: true, message: 'خلاصه الزامی است' }]}
        >
          <RichTextEditor placeholder="خلاصه خبر را وارد کنید" />
        </Form.Item>

        <Form.Item
          name="content"
          label="محتوا"
          rules={[{ required: true, message: 'محتوا الزامی است' }]}
        >
          <RichTextEditor placeholder="محتوای کامل خبر را وارد کنید" />
        </Form.Item>

        <Form.Item name="category_ids" label="دسته‌بندی">
          <TreeSelect
            treeData={categoryOptions}
            treeCheckable
            showCheckedStrategy={TreeSelect.SHOW_CHILD}
            showSearch
            treeNodeFilterProp="title"
            placeholder="انتخاب دسته‌بندی (چند انتخابی)"
            style={{ width: '100%' }}
            maxTagCount="responsive"
          />
        </Form.Item>

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
          name="alt_image"
          label="متن جایگزین تصویر (Alt)"
          placeholder="توضیح تصویر برای SEO"
        />

        {/* Image Upload */}
        <Form.Item label="تصویر اصلی" required>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {record?.image && !imageChanged && (
              <div>
                <Image
                  src={record.image}
                  width={100}
                  height={70}
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

        {/* Portrait Image Upload */}
        <Form.Item label="تصویر عمودی" required>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {record?.portrait_image && !portraitImageChanged && (
              <div>
                <Image
                  src={record.portrait_image}
                  width={70}
                  height={100}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
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
              onRemove={() => {
                setPortraitImageChanged(true);
                return true;
              }}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {portraitImageList.length >= 1 ? null : uploadButton}
            </Upload>
          </div>
        </Form.Item>

        {/* Preview Image Upload */}
        <Form.Item label="تصویر پیش‌نمایش" required>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            {record?.preview_image && !previewImageChanged && (
              <div>
                <Image
                  src={record.preview_image}
                  width={100}
                  height={70}
                  style={{ objectFit: 'cover', borderRadius: 4 }}
                />
                <div style={{ fontSize: 12, color: '#888', marginTop: 4 }}>
                  تصویر فعلی
                </div>
              </div>
            )}
            <Upload
              listType="picture-card"
              fileList={previewImageList}
              onChange={({ fileList }) => {
                setPreviewImageList(fileList);
                setPreviewImageChanged(true);
              }}
              onRemove={() => {
                setPreviewImageChanged(true);
                return true;
              }}
              beforeUpload={() => false}
              maxCount={1}
              accept="image/*"
            >
              {previewImageList.length >= 1 ? null : uploadButton}
            </Upload>
          </div>
        </Form.Item>
      </Spin>
    </ModalForm>
  );
};

export default UpdateForm;
