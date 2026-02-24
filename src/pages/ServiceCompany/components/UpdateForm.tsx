import { getCategories } from '@/services/category';
import { getCities, getProvinces } from '@/services/company';
import { updateServiceCompany } from '@/services/service';
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

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ServiceItem | null;
}

const contactTypeOptions = [
  { label: 'تلفن', value: 'phone' },
  { label: 'موبایل', value: 'mobile' },
];

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

  const [categories, setCategories] = useState<API.CategoryItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(false);

  const [provinces, setProvinces] = useState<API.ProvinceItem[]>([]);
  const [cities, setCities] = useState<API.CityItem[]>([]);
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  const [productImages, setProductImages] = useState<
    Record<number, UploadFile[]>
  >({});

  const [logoFile, setLogoFile] = useState<UploadFile[]>([]);
  const [catalogFile, setCatalogFile] = useState<UploadFile[]>([]);

  // Fetch dropdown data
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

  const fetchProvinces = async () => {
    setLoadingProvinces(true);
    try {
      const response = await getProvinces();
      if (response.success && response.data?.list) {
        setProvinces(response.data.list);
      }
    } catch (error) {
      console.error('Error fetching provinces:', error);
    } finally {
      setLoadingProvinces(false);
    }
  };

  const fetchCities = async (provinceId: string) => {
    setLoadingCities(true);
    try {
      const response = await getCities(provinceId);
      if (response.success && response.data?.list) {
        setCities(response.data.list);
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCities(false);
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCategories();
      fetchProvinces();
    }
  }, [visible]);

  useEffect(() => {
    if (record && visible && categories.length > 0) {
      // Find the leaf category ID by walking the child chain
      let categoryId = record.category?.id;
      if (record.category?.child) {
        let current: API.ServiceCategoryChild | null = record.category.child;
        while (current) {
          categoryId = current.id;
          current = current.child;
        }
      }

      form.setFieldsValue({
        title: record.title,
        summary: record.summary,
        description: record.description,
        email: record.email,
        category_id: categoryId,
        province_id: record.province?.id,
        city_id: record.city?.id,
        address: record.company?.address,
        contact_numbers: record.contact_numbers || [],
        social_medias: record.social_media || [],
        products:
          record.products?.map((p) => ({
            name: p.name,
            minimum_price: p.minimum_price,
            maximum_price: p.maximum_price,
          })) || [],
      });

      // Load cities for the province
      if (record.province?.id) {
        fetchCities(record.province.id);
      }

      // Set logo preview
      if (record.company?.logo) {
        setLogoFile([
          {
            uid: '-logo',
            name: 'logo',
            status: 'done',
            url: record.company.logo,
          },
        ]);
      }

      // Set catalog preview
      if (record.company?.catalog) {
        setCatalogFile([
          {
            uid: '-catalog',
            name: 'catalog',
            status: 'done',
            url: record.company.catalog,
          },
        ]);
      }

      // Set product images
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
  }, [record, visible, categories, form]);

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (error) => reject(error);
    });
  };

  const handleProductImageChange = (
    index: number,
    info: { fileList: UploadFile[] },
  ) => {
    setProductImages((prev) => ({
      ...prev,
      [index]: info.fileList,
    }));
  };

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
      return false;
    },
    onChange: (info) => handleProductImageChange(index, info),
    fileList: productImages[index] || [],
    listType: 'picture-card',
    maxCount: 1,
  });

  const getLogoUploadProps = (): UploadProps => ({
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فقط فایل‌های تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => setLogoFile(info.fileList),
    fileList: logoFile,
    listType: 'picture-card',
    maxCount: 1,
  });

  const getCatalogUploadProps = (): UploadProps => ({
    beforeUpload: (file) => {
      const isPdf = file.type === 'application/pdf';
      if (!isPdf) {
        message.error('فقط فایل‌های PDF مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => setCatalogFile(info.fileList),
    fileList: catalogFile,
    maxCount: 1,
  });

  const resetForm = () => {
    form.resetFields();
    setProductImages({});
    setLogoFile([]);
    setCatalogFile([]);
    setCities([]);
  };

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Process products with images
      const processedProducts: API.ServiceProductPayload[] = [];
      for (let i = 0; i < (values.products?.length || 0); i++) {
        const product = values.products[i];
        const imageFiles = productImages[i] || [];
        let imageValue = '';

        if (imageFiles.length > 0) {
          const file = imageFiles[0];
          if (file.originFileObj) {
            imageValue = await getBase64(file.originFileObj);
          } else if (file.url) {
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

      // Process logo
      let logoValue: string | null = null;
      if (logoFile.length > 0) {
        const file = logoFile[0];
        if (file.originFileObj) {
          logoValue = await getBase64(file.originFileObj);
        } else if (file.url) {
          logoValue = file.url;
        }
      }

      // Process catalog
      let catalogValue: string | null = null;
      if (catalogFile.length > 0) {
        const file = catalogFile[0];
        if (file.originFileObj) {
          catalogValue = await getBase64(file.originFileObj);
        } else if (file.url) {
          catalogValue = file.url;
        }
      }

      const payload: API.ServiceCompanyPayload = {
        title: values.title,
        summary: values.summary,
        description: values.description,
        email: values.email,
        category_id: values.category_id,
        province_id: values.province_id,
        city_id: values.city_id,
        address: values.address,
        logo: logoValue,
        catalog: catalogValue,
        contact_numbers: values.contact_numbers || [],
        social_medias: values.social_medias || [],
        products: processedProducts,
      };

      const response = await updateServiceCompany(record.id, payload);

      if (response.success) {
        message.success('خدمت با موفقیت ویرایش شد');
        resetForm();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش خدمت');
      }
    } catch (error) {
      console.error('Update service error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  const handleRemoveProduct = (
    index: number,
    remove: (index: number) => void,
  ) => {
    setProductImages((prev) => {
      const newImages = { ...prev };
      delete newImages[index];
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
    remove(index);
  };

  const handleProvinceChange = (provinceId: string) => {
    form.setFieldsValue({ city_id: undefined });
    setCities([]);
    if (provinceId) {
      fetchCities(provinceId);
    }
  };

  return (
    <Modal
      title="ویرایش خدمت شرکت"
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
        {/* Basic Information */}
        <Card size="small" title="اطلاعات پایه" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="عنوان خدمت"
                rules={[{ required: true, message: 'عنوان را وارد کنید' }]}
              >
                <Input placeholder="عنوان خدمت" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="summary" label="خلاصه">
                <Input placeholder="خلاصه خدمت" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="email" label="ایمیل">
                <Input placeholder="ایمیل" style={{ direction: 'ltr' }} />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={24}>
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
            <TextArea rows={4} placeholder="توضیحات خدمت" />
          </Form.Item>
        </Card>

        {/* Location */}
        <Card size="small" title="موقعیت مکانی" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="province_id" label="استان">
                <Select
                  placeholder="انتخاب استان"
                  loading={loadingProvinces}
                  showSearch
                  optionFilterProp="label"
                  onChange={handleProvinceChange}
                  options={provinces.map((p) => ({
                    label: p.name,
                    value: p.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="city_id" label="شهرستان">
                <Select
                  placeholder="انتخاب شهرستان"
                  loading={loadingCities}
                  showSearch
                  optionFilterProp="label"
                  options={cities.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item name="address" label="آدرس">
                <Input placeholder="آدرس" />
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Logo & Catalog */}
        <Card size="small" title="لوگو و کاتالوگ" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item label="لوگو">
                <Upload {...getLogoUploadProps()}>
                  {logoFile.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>آپلود لوگو</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item label="کاتالوگ (PDF)">
                <Upload {...getCatalogUploadProps()}>
                  <Button icon={<PlusOutlined />}>آپلود کاتالوگ</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Contact Numbers */}
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

        {/* Social Media */}
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

        {/* Products */}
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
