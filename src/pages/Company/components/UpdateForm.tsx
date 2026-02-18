import {
  getCities,
  getCompany,
  getProvinces,
  updateCompany,
} from '@/services/company';
import { MinusCircleOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Space,
  Spin,
  Upload,
  message,
} from 'antd';
import type { UploadFile } from 'antd/es/upload/interface';
import React, { useEffect, useState } from 'react';

const { TextArea } = Input;

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CompanyItem | null;
}

// ============================================
// STATIC OPTIONS FOR DROPDOWNS
// ============================================

// Contact number type options
const contactTypeOptions = [
  { label: 'تلفن', value: 'phone' },
  { label: 'موبایل', value: 'mobile' },
];

// Social media type options
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
  const [fetchingData, setFetchingData] = useState(false);

  // Province & City dropdown states
  const [provinces, setProvinces] = useState<API.ProvinceItem[]>([]);
  const [cities, setCities] = useState<API.CityItem[]>([]);
  const [provincesLoading, setProvincesLoading] = useState(false);
  const [citiesLoading, setCitiesLoading] = useState(false);

  // File upload states
  const [logoFileList, setLogoFileList] = useState<UploadFile[]>([]);
  const [catalogFileList, setCatalogFileList] = useState<UploadFile[]>([]);
  const [logoChanged, setLogoChanged] = useState(false);
  const [catalogChanged, setCatalogChanged] = useState(false);

  // ============================================
  // HELPER FUNCTIONS
  // ============================================

  /**
   * Convert uploaded file to base64 string
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
   * Reset all form state to initial values
   */
  const handleReset = () => {
    form.resetFields();
    setLogoFileList([]);
    setCatalogFileList([]);
    setLogoChanged(false);
    setCatalogChanged(false);
    setCities([]);
  };

  // ============================================
  // DATA FETCHING FUNCTIONS
  // ============================================

  /**
   * Fetch all provinces for the dropdown
   */
  const fetchProvinces = async () => {
    setProvincesLoading(true);
    try {
      const response = await getProvinces();
      if (response.success && response.data?.list) {
        setProvinces(response.data.list);
      }
    } catch (error) {
      console.error('Failed to fetch provinces:', error);
      message.error('خطا در دریافت لیست استان‌ها');
    } finally {
      setProvincesLoading(false);
    }
  };

  /**
   * Fetch cities for a given province
   */
  const fetchCities = async (provinceId: string) => {
    if (!provinceId) {
      setCities([]);
      return;
    }

    setCitiesLoading(true);
    try {
      const response = await getCities(provinceId);
      if (response.success && response.data?.list) {
        setCities(response.data.list);
      }
    } catch (error) {
      console.error('Failed to fetch cities:', error);
      message.error('خطا در دریافت لیست شهرها');
    } finally {
      setCitiesLoading(false);
    }
  };

  /**
   * Fetch complete company data and populate the form
   * We fetch fresh data because the list response may not include all fields
   */
  const fetchAndPopulateForm = async () => {
    if (!record?.id) return;

    setFetchingData(true);
    try {
      // Fetch provinces first
      await fetchProvinces();

      // Fetch complete company data
      const response = await getCompany(record.id);

      if (response.success && response.data) {
        const company = response.data;

        // Fetch cities for the company's province
        if (company.province?.id) {
          await fetchCities(company.province.id);
        }

        // Populate form with company data
        form.setFieldsValue({
          name: company.name,
          summary: company.summary,
          description: company.description || '',
          email: company.email || '',
          province_id: company.province?.id,
          city_id: company.city?.id,
          address: company.address || '',
          // Transform social_media to social_medias for form
          contact_numbers:
            company.contact_numbers?.length > 0
              ? company.contact_numbers
              : [{ type: 'mobile', data: '' }],
          social_medias:
            company.social_media?.length > 0
              ? company.social_media
              : [{ type: 'instagram', data: '' }],
        });

        // Set up logo preview if exists
        if (company.logo) {
          setLogoFileList([
            {
              uid: '-1',
              name: 'logo',
              status: 'done',
              url: company.logo,
            },
          ]);
        }

        // Set up catalog preview if exists
        if (company.catalog) {
          setCatalogFileList([
            {
              uid: '-1',
              name: 'catalog',
              status: 'done',
              url: company.catalog,
            },
          ]);
        }
      }
    } catch (error) {
      console.error('Failed to fetch company data:', error);
      message.error('خطا در دریافت اطلاعات شرکت');
    } finally {
      setFetchingData(false);
    }
  };

  // ============================================
  // EFFECTS
  // ============================================

  /**
   * When modal opens with a record, fetch and populate data
   */
  useEffect(() => {
    if (visible && record) {
      fetchAndPopulateForm();
    }
  }, [visible, record]);

  // ============================================
  // EVENT HANDLERS
  // ============================================

  /**
   * Handle province selection change
   * Clears city selection and fetches new cities
   */
  const handleProvinceChange = (provinceId: string) => {
    form.setFieldValue('city_id', undefined);
    fetchCities(provinceId);
  };

  /**
   * Handle form submission
   */
  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Process logo
      let logoValue: string | null = null;
      if (logoChanged) {
        if (logoFileList.length > 0 && logoFileList[0].originFileObj) {
          logoValue = await getBase64(logoFileList[0].originFileObj);
        }
        // else logoValue stays null (image was removed)
      } else {
        // Keep existing logo URL if not changed
        logoValue = record.logo;
      }

      // Process catalog
      let catalogValue: string | null = null;
      if (catalogChanged) {
        if (catalogFileList.length > 0 && catalogFileList[0].originFileObj) {
          catalogValue = await getBase64(catalogFileList[0].originFileObj);
        }
        // else catalogValue stays null (file was removed)
      } else {
        // Keep existing catalog URL if not changed
        catalogValue = record.catalog;
      }

      // Build payload - note the field name difference: social_medias (with 's')
      const payload: API.CompanyPayload = {
        name: values.name,
        summary: values.summary,
        description: values.description || '',
        email: values.email,
        province_id: values.province_id,
        city_id: values.city_id,
        address: values.address || '',
        logo: logoValue,
        catalog: catalogValue,
        contact_numbers:
          values.contact_numbers?.filter((c: API.CompanyContactNumber) =>
            c.data?.trim(),
          ) || [],
        social_medias:
          values.social_medias?.filter((s: API.CompanySocialMedia) =>
            s.data?.trim(),
          ) || [],
      };

      const response = await updateCompany(record.id, payload);

      if (response.success) {
        message.success('شرکت با موفقیت بروزرسانی شد');
        handleReset();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی شرکت');
      }
    } catch (error) {
      console.error('Update company error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle modal cancel
   */
  const handleCancel = () => {
    handleReset();
    onCancel();
  };

  /**
   * Handle logo upload change
   */
  const handleLogoChange = ({ fileList: newFileList }: any) => {
    setLogoFileList(newFileList.slice(-1));
    setLogoChanged(true);
  };

  /**
   * Handle catalog upload change
   */
  const handleCatalogChange = ({ fileList: newFileList }: any) => {
    setCatalogFileList(newFileList.slice(-1));
    setCatalogChanged(true);
  };

  // ============================================
  // RENDER
  // ============================================

  return (
    <Modal
      title="ویرایش شرکت"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={800}
      destroyOnClose
    >
      {fetchingData ? (
        <div style={{ textAlign: 'center', padding: '40px 0' }}>
          <Spin size="large" tip="در حال دریافت اطلاعات..." />
        </div>
      ) : (
        <Form
          form={form}
          layout="vertical"
          initialValues={{
            contact_numbers: [{ type: 'mobile', data: '' }],
            social_medias: [{ type: 'instagram', data: '' }],
          }}
        >
          {/* Company Header Info */}
          {record && (
            <div
              style={{
                marginBottom: 16,
                padding: 12,
                background: '#f5f5f5',
                borderRadius: 8,
              }}
            >
              <div style={{ fontWeight: 600 }}>{record.name}</div>
              <div style={{ fontSize: 12, color: '#666', marginTop: 4 }}>
                کد: {record.code} | {record.province?.name} -{' '}
                {record.city?.name}
              </div>
            </div>
          )}

          {/* Basic Information Section */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="name"
                label="نام شرکت"
                rules={[
                  { required: true, message: 'لطفاً نام شرکت را وارد کنید' },
                ]}
              >
                <Input placeholder="نام شرکت" />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="email"
                label="ایمیل"
                rules={[
                  { required: true, message: 'لطفاً ایمیل را وارد کنید' },
                  { type: 'email', message: 'فرمت ایمیل صحیح نیست' },
                ]}
              >
                <Input
                  placeholder="email@example.com"
                  style={{ direction: 'ltr' }}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item
            name="summary"
            label="خلاصه"
            rules={[{ required: true, message: 'لطفاً خلاصه را وارد کنید' }]}
          >
            <TextArea rows={2} placeholder="خلاصه‌ای کوتاه از شرکت" />
          </Form.Item>

          <Form.Item
            name="description"
            label="توضیحات کامل"
            rules={[{ required: true, message: 'لطفاً توضیحات را وارد کنید' }]}
          >
            <TextArea rows={4} placeholder="توضیحات کامل شرکت" />
          </Form.Item>

          {/* Location Section */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item
                name="province_id"
                label="استان"
                rules={[
                  { required: true, message: 'لطفاً استان را انتخاب کنید' },
                ]}
              >
                <Select
                  placeholder="انتخاب استان"
                  loading={provincesLoading}
                  onChange={handleProvinceChange}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={provinces.map((p) => ({
                    label: p.name,
                    value: p.id,
                  }))}
                />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item
                name="city_id"
                label="شهر"
                rules={[
                  { required: true, message: 'لطفاً شهر را انتخاب کنید' },
                ]}
              >
                <Select
                  placeholder="ابتدا استان را انتخاب کنید"
                  loading={citiesLoading}
                  disabled={cities.length === 0}
                  showSearch
                  filterOption={(input, option) =>
                    (option?.label as string)
                      ?.toLowerCase()
                      .includes(input.toLowerCase())
                  }
                  options={cities.map((c) => ({
                    label: c.name,
                    value: c.id,
                  }))}
                />
              </Form.Item>
            </Col>
          </Row>

          <Form.Item name="address" label="آدرس">
            <TextArea rows={2} placeholder="آدرس کامل شرکت" />
          </Form.Item>

          {/* File Uploads Section */}
          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="logo" label="لوگو">
                <Upload
                  listType="picture-card"
                  fileList={logoFileList}
                  onChange={handleLogoChange}
                  onRemove={() => {
                    setLogoChanged(true);
                    return true;
                  }}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*"
                >
                  {logoFileList.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>آپلود لوگو</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="catalog" label="کاتالوگ">
                <Upload
                  listType="picture-card"
                  fileList={catalogFileList}
                  onChange={handleCatalogChange}
                  onRemove={() => {
                    setCatalogChanged(true);
                    return true;
                  }}
                  beforeUpload={() => false}
                  maxCount={1}
                  accept="image/*,.pdf"
                >
                  {catalogFileList.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>آپلود کاتالوگ</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
          </Row>

          {/* Contact Numbers Section - Dynamic List */}
          <Form.Item label="شماره‌های تماس">
            <Form.List name="contact_numbers">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{ display: 'flex', marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        rules={[
                          { required: true, message: 'نوع را انتخاب کنید' },
                        ]}
                        style={{ width: 120 }}
                      >
                        <Select
                          options={contactTypeOptions}
                          placeholder="نوع"
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'data']}
                        rules={[
                          { required: true, message: 'شماره را وارد کنید' },
                        ]}
                        style={{ width: 200 }}
                      >
                        <Input
                          placeholder="شماره تماس"
                          style={{ direction: 'ltr' }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ color: '#ff4d4f' }}
                        />
                      )}
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add({ type: 'mobile', data: '' })}
                    icon={<PlusOutlined />}
                    style={{ width: '100%' }}
                  >
                    افزودن شماره تماس
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>

          {/* Social Media Section - Dynamic List */}
          <Form.Item label="شبکه‌های اجتماعی">
            <Form.List name="social_medias">
              {(fields, { add, remove }) => (
                <>
                  {fields.map(({ key, name, ...restField }) => (
                    <Space
                      key={key}
                      style={{ display: 'flex', marginBottom: 8 }}
                      align="baseline"
                    >
                      <Form.Item
                        {...restField}
                        name={[name, 'type']}
                        rules={[
                          { required: true, message: 'نوع را انتخاب کنید' },
                        ]}
                        style={{ width: 120 }}
                      >
                        <Select
                          options={socialMediaTypeOptions}
                          placeholder="نوع"
                        />
                      </Form.Item>
                      <Form.Item
                        {...restField}
                        name={[name, 'data']}
                        rules={[
                          { required: true, message: 'لینک را وارد کنید' },
                        ]}
                        style={{ width: 280 }}
                      >
                        <Input
                          placeholder="لینک یا شناسه"
                          style={{ direction: 'ltr' }}
                        />
                      </Form.Item>
                      {fields.length > 1 && (
                        <MinusCircleOutlined
                          onClick={() => remove(name)}
                          style={{ color: '#ff4d4f' }}
                        />
                      )}
                    </Space>
                  ))}
                  <Button
                    type="dashed"
                    onClick={() => add({ type: 'instagram', data: '' })}
                    icon={<PlusOutlined />}
                    style={{ width: '100%' }}
                  >
                    افزودن شبکه اجتماعی
                  </Button>
                </>
              )}
            </Form.List>
          </Form.Item>
        </Form>
      )}
    </Modal>
  );
};

export default UpdateForm;
