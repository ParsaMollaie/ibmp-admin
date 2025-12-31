import { getCategories } from '@/services/category';
import { getCompanies } from '@/services/company';
import { updateCompanyService } from '@/services/company-service';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  InputNumber,
  Modal,
  Row,
  Select,
  Upload,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

const { TextArea } = Input;

/**
 * Props interface for UpdateForm
 *
 * This form is complex because it handles:
 * 1. Basic text fields (title, description)
 * 2. Related entity selection (company, category)
 * 3. Dynamic arrays (contact_numbers, social_media, products)
 * 4. Image uploads within dynamic arrays (products)
 */
interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CompanyServiceItem | null;
}

/**
 * Contact type options for the dropdown
 */
const contactTypeOptions = [
  { label: 'تلفن', value: 'phone' },
  { label: 'موبایل', value: 'mobile' },
];

/**
 * Social media type options for the dropdown
 */
const socialMediaTypeOptions = [
  { label: 'اینستاگرام', value: 'instagram' },
  { label: 'تلگرام', value: 'telegram' },
  { label: 'ایتا', value: 'eita' },
  { label: 'بله', value: 'bale' },
  { label: 'واتساپ', value: 'whatsapp' },
  { label: 'وب‌سایت', value: 'website' },
];

const UpdateForm: React.FC<UpdateFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [form] = Form.useForm();
  const [loading, setLoading] = useState(false);

  // Data for dropdowns
  const [companies, setCompanies] = useState<API.CompanyItem[]>([]);
  const [categories, setCategories] = useState<API.CategoryItem[]>([]);
  const [loadingCompanies, setLoadingCompanies] = useState(false);
  const [loadingCategories, setLoadingCategories] = useState(false);

  /**
   * Product image file lists - keyed by product index
   * We need to track each product's image separately
   */
  const [productImages, setProductImages] = useState<
    Record<number, UploadFile[]>
  >({});

  // ============================================
  // FETCH DROPDOWN DATA
  // ============================================

  /**
   * Fetch companies list for the company dropdown
   */
  const fetchCompanies = async () => {
    setLoadingCompanies(true);
    try {
      const response = await getCompanies({ page_size: 1000 });
      if (response.success && response.data?.list) {
        setCompanies(response.data.list);
      }
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoadingCompanies(false);
    }
  };

  /**
   * Fetch categories list for the category dropdown
   */
  const fetchCategories = async () => {
    setLoadingCategories(true);
    try {
      const response = await getCategories({ page_size: 1000 });
      if (response.success && response.data?.list) {
        setCategories(response.data.list);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    } finally {
      setLoadingCategories(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * Fetch dropdown data when modal opens
   */
  useEffect(() => {
    if (visible) {
      fetchCompanies();
      fetchCategories();
    }
  }, [visible]);

  /**
   * Populate form when record changes
   */
  useEffect(() => {
    if (record && visible) {
      // Set basic form fields
      form.setFieldsValue({
        title: record.title,
        company_id: record.company?.id,
        category_id: record.category?.id,
        description: record.description,
        contact_numbers: record.contact_numbers || [],
        social_medias: record.social_media || [], // Note: API returns 'social_media', we use 'social_medias' in form
        products:
          record.products?.map((p) => ({
            name: p.name,
            minimum_price: p.minimum_price,
            maximum_price: p.maximum_price,
            // Image is handled separately via productImages state
          })) || [],
      });

      // Set up product images from existing data
      const images: Record<number, UploadFile[]> = {};
      record.products?.forEach((product, index) => {
        if (product.image) {
          images[index] = [
            {
              uid: `-${index}`,
              name: `product-${index}`,
              status: 'done',
              url: product.image,
            },
          ];
        }
      });
      setProductImages(images);
    }
  }, [record, visible, form]);

  // ============================================
  // IMAGE HANDLING
  // ============================================

  /**
   * Convert a File to base64 string
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
   * Handle product image change for a specific product index
   */
  const handleProductImageChange = (
    index: number,
    info: { fileList: UploadFile[] },
  ) => {
    setProductImages((prev) => ({
      ...prev,
      [index]: info.fileList,
    }));
  };

  /**
   * Get upload props for a specific product index
   */
  const getProductUploadProps = (index: number): UploadProps => ({
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فقط فایل‌های تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('حجم تصویر باید کمتر از 2 مگابایت باشد');
        return Upload.LIST_IGNORE;
      }
      return false; // Prevent auto upload
    },
    onChange: (info) => handleProductImageChange(index, info),
    fileList: productImages[index] || [],
    listType: 'picture-card',
    maxCount: 1,
  });

  // ============================================
  // FORM SUBMISSION
  // ============================================

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Process products with images
      const processedProducts: API.CompanyServiceProductPayload[] = [];

      for (let i = 0; i < (values.products?.length || 0); i++) {
        const product = values.products[i];
        const imageFiles = productImages[i] || [];

        let imageValue = '';

        if (imageFiles.length > 0) {
          const file = imageFiles[0];
          if (file.originFileObj) {
            // New image uploaded - convert to base64
            imageValue = await getBase64(file.originFileObj);
          } else if (file.url) {
            // Existing image - keep the URL
            imageValue = file.url;
          }
        }

        processedProducts.push({
          name: product.name,
          image: imageValue,
          minimum_price: product.minimum_price || 0,
          maximum_price: product.maximum_price || 0,
        });
      }

      // Build the payload
      // Note: API expects 'social_medias' (with 's') in the payload
      const payload: API.CompanyServicePayload = {
        title: values.title,
        company_id: values.company_id,
        category_id: values.category_id,
        description: values.description,
        contact_numbers: values.contact_numbers || [],
        social_medias: values.social_medias || [],
        products: processedProducts,
      };

      const response = await updateCompanyService(record.id, payload);

      if (response.success) {
        message.success('سرویس با موفقیت ویرایش شد');
        form.resetFields();
        setProductImages({});
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش سرویس');
      }
    } catch (error) {
      console.error('Update company service error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal cancel - reset form state
   */
  const handleCancel = () => {
    form.resetFields();
    setProductImages({});
    onCancel();
  };

  /**
   * Handle removing a product - also clean up its image state
   */
  const handleRemoveProduct = (
    index: number,
    remove: (index: number) => void,
  ) => {
    // Remove the image state for this index
    setProductImages((prev) => {
      const newImages = { ...prev };
      delete newImages[index];
      // Reindex remaining images
      const reindexed: Record<number, UploadFile[]> = {};
      Object.keys(newImages).forEach((key) => {
        const keyNum = parseInt(key);
        if (keyNum > index) {
          reindexed[keyNum - 1] = newImages[keyNum];
        } else {
          reindexed[keyNum] = newImages[keyNum];
        }
      });
      return reindexed;
    });
    // Remove from form
    remove(index);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      title="ویرایش سرویس شرکت"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={900}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        {/* ====== Basic Information ====== */}
        <Card size="small" title="اطلاعات پایه" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="عنوان سرویس"
                rules={[{ required: true, message: 'عنوان را وارد کنید' }]}
              >
                <Input placeholder="عنوان سرویس" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="company_id"
                label="شرکت"
                rules={[{ required: true, message: 'شرکت را انتخاب کنید' }]}
              >
                <Select
                  placeholder="انتخاب شرکت"
                  loading={loadingCompanies}
                  showSearch
                  optionFilterProp="label"
                  options={companies.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="category_id"
                label="دسته‌بندی"
                rules={[
                  { required: true, message: 'دسته‌بندی را انتخاب کنید' },
                ]}
              >
                <Select
                  placeholder="انتخاب دسته‌بندی"
                  loading={loadingCategories}
                  showSearch
                  optionFilterProp="label"
                  options={categories.map((c) => ({
                    label: c.title,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="description"
            label="توضیحات"
            rules={[{ required: true, message: 'توضیحات را وارد کنید' }]}
          >
            <TextArea rows={4} placeholder="توضیحات سرویس" />
          </Form.Item>
        </Card>

        {/* ====== Contact Numbers ====== */}
        <Card size="small" title="شماره‌های تماس" style={{ marginBottom: 16 }}>
          <Form.List name="contact_numbers">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        rules={[
                          { required: true, message: 'نوع را انتخاب کنید' },
                        ]}
                      >
                        <Select
                          placeholder="نوع"
                          options={contactTypeOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'data']}
                        rules={[
                          { required: true, message: 'شماره را وارد کنید' },
                        ]}
                      >
                        <Input
                          placeholder="شماره تماس"
                          style={{ direction: 'ltr' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ type: 'mobile', data: '' })}
                  block
                  icon={<PlusOutlined />}
                >
                  افزودن شماره تماس
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* ====== Social Media ====== */}
        <Card
          size="small"
          title="شبکه‌های اجتماعی"
          style={{ marginBottom: 16 }}
        >
          <Form.List name="social_medias">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={8}>
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        rules={[
                          { required: true, message: 'نوع را انتخاب کنید' },
                        ]}
                      >
                        <Select
                          placeholder="نوع"
                          options={socialMediaTypeOptions}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={12}>
                      <Form.Item
                        {...restField}
                        name={[name, 'data']}
                        rules={[
                          { required: true, message: 'آدرس را وارد کنید' },
                        ]}
                      >
                        <Input
                          placeholder="آدرس لینک"
                          style={{ direction: 'ltr' }}
                        />
                      </Form.Item>
                    </Col>
                    <Col span={4}>
                      <Form.Item>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
                      </Form.Item>
                    </Col>
                  </Row>
                ))}
                <Button
                  type="dashed"
                  onClick={() => add({ type: 'instagram', data: '' })}
                  block
                  icon={<PlusOutlined />}
                >
                  افزودن شبکه اجتماعی
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* ====== Products ====== */}
        <Card size="small" title="محصولات">
          <Form.List name="products">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    {index > 0 && <Divider />}
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item
                          {...restField}
                          name={[name, 'name']}
                          label="نام محصول"
                          rules={[
                            {
                              required: true,
                              message: 'نام محصول را وارد کنید',
                            },
                          ]}
                        >
                          <Input placeholder="نام محصول" />
                        </Form.Item>
                      </Col>
                      <Col span={8} style={{ textAlign: 'left' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveProduct(index, remove)}
                        >
                          حذف محصول
                        </Button>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'minimum_price']}
                          label="حداقل قیمت (تومان)"
                        >
                          <InputNumber<number>
                            min={0}
                            style={{ width: '100%' }}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) =>
                              value?.replace(/,/g, '') as unknown as number
                            }
                            placeholder="0"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'maximum_price']}
                          label="حداکثر قیمت (تومان)"
                        >
                          <InputNumber<number>
                            min={0}
                            style={{ width: '100%' }}
                            formatter={(value) =>
                              `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',')
                            }
                            parser={(value) =>
                              value?.replace(/,/g, '') as unknown as number
                            }
                            placeholder="0"
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="تصویر محصول">
                          <Upload {...getProductUploadProps(index)}>
                            {(productImages[index]?.length || 0) === 0 && (
                              <div>
                                <PlusOutlined />
                                <div style={{ marginTop: 8 }}>آپلود</div>
                              </div>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>
                    </Row>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({ name: '', minimum_price: 0, maximum_price: 0 })
                  }
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 16 }}
                >
                  افزودن محصول
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </Modal>
  );
};

export default UpdateForm;
