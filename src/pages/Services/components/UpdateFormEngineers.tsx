import { getCategories } from '@/services/category';
import { getContactProfiles } from '@/services/contact-profile';
import { getCities, getProvinces } from '@/services/location';
import { updateServiceEngineers } from '@/services/service';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import type { UploadFile, UploadProps } from 'antd';
import {
  Button,
  Card,
  Col,
  Divider,
  Form,
  Input,
  Modal,
  Row,
  Select,
  Tag,
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

const UpdateFormEngineers: React.FC<UpdateFormProps> = ({
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
  const [citiesMap, setCitiesMap] = useState<Record<number, API.CityItem[]>>(
    {},
  );
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCitiesMap, setLoadingCitiesMap] = useState<
    Record<number, boolean>
  >({});

  /**
   * Avatar image
   */
  const [avatarFile, setAvatarFile] = useState<UploadFile[]>([]);

  /**
   * Work sample images - keyed by index
   */
  const [workSampleImages, setWorkSampleImages] = useState<
    Record<number, UploadFile[]>
  >({});

  // Contact profile state
  const [contactProfiles, setContactProfiles] = useState<
    API.ContactProfileItem[]
  >([]);
  const [loadingContactProfiles, setLoadingContactProfiles] = useState(false);
  const [selectedContactProfileId, setSelectedContactProfileId] = useState<
    string | null
  >(null);

  // Fetch contact profiles for the service's user
  const fetchContactProfiles = async (userId: string) => {
    setLoadingContactProfiles(true);
    try {
      const response = await getContactProfiles({
        user_id: userId,
        page_size: 100,
      });
      if (response.success && response.data?.list) {
        setContactProfiles(response.data.list);
      }
    } catch (error) {
      console.error('Error fetching contact profiles:', error);
    } finally {
      setLoadingContactProfiles(false);
    }
  };

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

  const fetchCitiesForRow = async (provinceId: string, rowIndex: number) => {
    setLoadingCitiesMap((prev) => ({ ...prev, [rowIndex]: true }));
    try {
      const response = await getCities(provinceId);
      if (response.success && response.data?.list) {
        setCitiesMap((prev) => ({ ...prev, [rowIndex]: response.data.list }));
      }
    } catch (error) {
      console.error('Error fetching cities:', error);
    } finally {
      setLoadingCitiesMap((prev) => ({ ...prev, [rowIndex]: false }));
    }
  };

  useEffect(() => {
    if (visible) {
      fetchCategories();
      fetchProvinces();
    }
  }, [visible]);

  // Fetch contact profiles when record/visible changes
  useEffect(() => {
    if (visible && record?.user?.id) {
      fetchContactProfiles(record.user.id);
    }
    if (!visible) {
      setContactProfiles([]);
      setSelectedContactProfileId(null);
    }
  }, [visible, record]);

  useEffect(() => {
    if (record && visible && categories.length > 0) {
      // The API returns the assigned category (already the leaf) with a
      // parent chain pointing toward the root — no traversal needed here.
      const categoryId = record.category?.id;

      // Build addresses from record
      const addresses =
        record.addresses?.length > 0
          ? record.addresses.map((a) => ({
              province_id: a.province?.id,
              city_id: a.city?.id,
              address: a.address || '',
            }))
          : record.province?.id
          ? [
              {
                province_id: record.province.id,
                city_id: record.city?.id,
                address: '',
              },
            ]
          : [{ province_id: undefined, city_id: undefined, address: '' }];

      // Set initial contact profile selection
      const cpId = record.contact_profile_id || null;
      setSelectedContactProfileId(cpId);

      form.setFieldsValue({
        title: record.title,
        summary: record.summary,
        description: record.description,
        email: record.email,
        website: record.website,
        video: record.video || '',
        category_id: categoryId,
        contact_profile_id: cpId,
        // province_id: record.province?.id, // deprecated — use addresses
        // city_id: record.city?.id, // deprecated — use addresses
        addresses,
        contact_numbers: record.contact_numbers || [],
        social_medias: record.social_media || [],
        work_samples:
          record.work_samples?.map((ws) => ({
            title: ws.title || '',
          })) || [],
      });

      // Load cities for each address row
      addresses.forEach((addr, idx) => {
        if (addr.province_id) {
          fetchCitiesForRow(addr.province_id, idx);
        }
      });

      // Set avatar image
      if (record.avatar) {
        setAvatarFile([
          {
            uid: '-avatar',
            name: 'avatar',
            status: 'done',
            url: record.avatar,
          },
        ]);
      } else {
        setAvatarFile([]);
      }

      // Set work sample images
      const images: Record<number, UploadFile[]> = {};
      record.work_samples?.forEach((sample, index) => {
        if (sample.image) {
          images[index] = [
            {
              uid: `-${index}`,
              name: `sample-${index}`,
              status: 'done',
              url: sample.image,
            },
          ];
        }
      });
      setWorkSampleImages(images);
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

  const getAvatarUploadProps = (): UploadProps => ({
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فقط فایل‌های تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      const isLt500K = file.size / 1024 < 500;
      if (!isLt500K) {
        message.error('حجم تصویر باید کمتر از 500 کیلوبایت باشد');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => setAvatarFile(info.fileList),
    fileList: avatarFile,
    listType: 'picture-card',
    maxCount: 1,
  });

  const handleWorkSampleImageChange = (
    index: number,
    info: { fileList: UploadFile[] },
  ) => {
    setWorkSampleImages((prev) => ({
      ...prev,
      [index]: info.fileList,
    }));
  };

  const getWorkSampleUploadProps = (index: number): UploadProps => ({
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
    onChange: (info) => handleWorkSampleImageChange(index, info),
    fileList: workSampleImages[index] || [],
    listType: 'picture-card',
    maxCount: 1,
  });

  const resetForm = () => {
    form.resetFields();
    setAvatarFile([]);
    setWorkSampleImages({});
    setCitiesMap({});
    setContactProfiles([]);
    setSelectedContactProfileId(null);
  };

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      // Process work samples with images
      const processedWorkSamples: API.ServiceWorkSamplePayload[] = [];

      for (let i = 0; i < (values.work_samples?.length || 0); i++) {
        const sample = values.work_samples[i];
        const imageFiles = workSampleImages[i] || [];

        let imageValue = '';

        if (imageFiles.length > 0) {
          const file = imageFiles[0];
          if (file.originFileObj) {
            imageValue = await getBase64(file.originFileObj);
          } else if (file.url) {
            imageValue = file.url;
          }
        }

        processedWorkSamples.push({
          title: sample.title || '',
          image: imageValue,
        });
      }

      // Process avatar
      let avatarValue: string | null = null;
      if (avatarFile.length > 0) {
        const file = avatarFile[0];
        if (file.originFileObj) {
          avatarValue = await getBase64(file.originFileObj);
        } else if (file.url) {
          avatarValue = file.url;
        }
      }

      const payload: API.ServiceEngineersPayload = {
        title: values.title,
        summary: values.summary,
        description: values.description,
        email: values.email,
        website: values.website || undefined,
        video: values.video || null,
        avatar: avatarValue,
        category_id: values.category_id,
        contact_profile_id: values.contact_profile_id || null,
        // province_id: values.province_id, // deprecated — use addresses
        // city_id: values.city_id, // deprecated — use addresses
        addresses: (values.addresses || []).map((a: any) => ({
          province_id: a.province_id,
          city_id: a.city_id,
          address: a.address || undefined,
        })),
        contact_numbers: values.contact_numbers || [],
        social_medias: values.social_medias || [],
        work_samples: processedWorkSamples,
      };

      const response = await updateServiceEngineers(record.id, payload);

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

  const handleRemoveWorkSample = (
    index: number,
    remove: (index: number) => void,
  ) => {
    setWorkSampleImages((prev) => {
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

  const handleAddressProvinceChange = (
    provinceId: string,
    rowIndex: number,
  ) => {
    const addresses = form.getFieldValue('addresses') || [];
    if (addresses[rowIndex]) {
      addresses[rowIndex].city_id = undefined;
      form.setFieldsValue({ addresses });
    }
    setCitiesMap((prev) => ({ ...prev, [rowIndex]: [] }));
    if (provinceId) {
      fetchCitiesForRow(provinceId, rowIndex);
    }
  };

  return (
    <Modal
      title="ویرایش خدمت مهندسی"
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
            <Col span={12}>
              <Form.Item name="website" label="وب‌سایت">
                <Input
                  placeholder="https://example.com"
                  style={{ direction: 'ltr' }}
                />
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

        {/* Addresses */}
        <Card size="small" title="آدرس‌ها" style={{ marginBottom: 16 }}>
          {selectedContactProfileId && (
            <div style={{ marginBottom: 12, color: '#faad14' }}>
              آدرس‌ها از پروفایل تماس بارگذاری خواهد شد. فیلدهای زیر غیرفعال
              هستند.
            </div>
          )}
          <Form.List name="addresses">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div
                    key={key}
                    style={{
                      marginBottom: 16,
                      padding: 12,
                      border: '1px solid #f0f0f0',
                      borderRadius: 8,
                    }}
                  >
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'province_id']}
                          label="استان"
                          rules={[
                            { required: true, message: 'استان را انتخاب کنید' },
                          ]}
                        >
                          <Select
                            placeholder="انتخاب استان"
                            loading={loadingProvinces}
                            showSearch
                            optionFilterProp="label"
                            disabled={!!selectedContactProfileId}
                            onChange={(val) =>
                              handleAddressProvinceChange(val, index)
                            }
                            options={provinces.map((p) => ({
                              label: p.name,
                              value: p.id,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'city_id']}
                          label="شهرستان"
                          rules={[
                            {
                              required: true,
                              message: 'شهرستان را انتخاب کنید',
                            },
                          ]}
                        >
                          <Select
                            placeholder="انتخاب شهرستان"
                            loading={loadingCitiesMap[index] || false}
                            showSearch
                            optionFilterProp="label"
                            disabled={!!selectedContactProfileId}
                            options={(citiesMap[index] || []).map((c) => ({
                              label: c.name,
                              value: c.id,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        <Form.Item
                          {...restField}
                          name={[name, 'address']}
                          label="آدرس (اختیاری)"
                        >
                          <Input
                            placeholder="آدرس"
                            disabled={!!selectedContactProfileId}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        {fields.length > 1 && (
                          <Button
                            type="text"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => remove(name)}
                            disabled={!!selectedContactProfileId}
                          />
                        )}
                      </Col>
                    </Row>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      province_id: undefined,
                      city_id: undefined,
                      address: '',
                    })
                  }
                  block
                  icon={<PlusOutlined />}
                  disabled={!!selectedContactProfileId}
                >
                  افزودن آدرس
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Contact Profile Selector */}
        <Card size="small" title="پروفایل تماس" style={{ marginBottom: 16 }}>
          <Form.Item
            name="contact_profile_id"
            label="انتخاب پروفایل تماس"
            extra="با انتخاب پروفایل تماس، اطلاعات تماس از پروفایل بارگذاری می‌شود و فیلدهای دستی غیرفعال می‌شوند."
          >
            <Select
              placeholder="بدون پروفایل (دستی)"
              allowClear
              loading={loadingContactProfiles}
              onChange={(value) => setSelectedContactProfileId(value || null)}
              options={contactProfiles.map((cp) => ({
                label: cp.title,
                value: cp.id,
              }))}
            />
          </Form.Item>
        </Card>

        {/* Contact Numbers */}
        <Card size="small" title="شماره‌های تماس" style={{ marginBottom: 16 }}>
          {selectedContactProfileId && (
            <div style={{ marginBottom: 12, color: '#faad14' }}>
              اطلاعات تماس از پروفایل تماس بارگذاری خواهد شد. فیلدهای زیر
              غیرفعال هستند.
            </div>
          )}
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
                          disabled={!!selectedContactProfileId}
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
                          disabled={!!selectedContactProfileId}
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
                          disabled={!!selectedContactProfileId}
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
                  disabled={!!selectedContactProfileId}
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
          {selectedContactProfileId && (
            <div style={{ marginBottom: 12, color: '#faad14' }}>
              اطلاعات شبکه‌های اجتماعی از پروفایل تماس بارگذاری خواهد شد.
              فیلدهای زیر غیرفعال هستند.
            </div>
          )}
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
                          disabled={!!selectedContactProfileId}
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
                          disabled={!!selectedContactProfileId}
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
                          disabled={!!selectedContactProfileId}
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
                  disabled={!!selectedContactProfileId}
                >
                  افزودن شبکه اجتماعی
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Video */}
        <Card size="small" title="ویدئو معرفی" style={{ marginBottom: 16 }}>
          <Form.Item
            name="video"
            label="لینک ویدئو"
            extra="لینک embed ویدئو از یوتیوب یا آپارات (مثلاً: https://www.aparat.com/video/video/embed/videohash/xxxx/vt/frame)"
          >
            <TextArea
              rows={2}
              placeholder="لینک embed ویدئو را وارد کنید"
              style={{ direction: 'ltr' }}
            />
          </Form.Item>
        </Card>

        {/* Avatar */}
        <Card size="small" title="آواتار" style={{ marginBottom: 16 }}>
          <Form.Item label="تصویر">
            <Upload {...getAvatarUploadProps()}>
              {avatarFile.length === 0 && (
                <div>
                  <PlusOutlined />
                  <div style={{ marginTop: 8 }}>آپلود</div>
                </div>
              )}
            </Upload>
          </Form.Item>
        </Card>

        {/* Work Samples */}
        <Card size="small" title="نمونه کارها">
          <Form.List name="work_samples">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    {index > 0 && <Divider />}
                    <Row gutter={16} align="middle">
                      <Col span={10}>
                        <Form.Item
                          {...restField}
                          name={[name, 'title']}
                          label="عنوان نمونه کار"
                        >
                          <Input placeholder="عنوان (اختیاری)" />
                        </Form.Item>
                      </Col>
                      <Col span={6}>
                        {record?.work_samples?.[index]?.status && (
                          <Tag
                            color={
                              record.work_samples[index].status === 'active'
                                ? 'green'
                                : 'red'
                            }
                          >
                            {record.work_samples[index].status === 'active'
                              ? 'فعال'
                              : 'غیرفعال'}
                          </Tag>
                        )}
                      </Col>
                      <Col span={8} style={{ textAlign: 'left' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => handleRemoveWorkSample(index, remove)}
                        >
                          حذف نمونه کار
                        </Button>
                      </Col>
                    </Row>

                    <Row gutter={16}>
                      <Col span={8}>
                        <Form.Item label="تصویر نمونه کار">
                          <Upload {...getWorkSampleUploadProps(index)}>
                            {(workSampleImages[index]?.length || 0) === 0 && (
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
                  onClick={() => add({ title: '' })}
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 16 }}
                >
                  افزودن نمونه کار
                </Button>
              </>
            )}
          </Form.List>
        </Card>
      </Form>
    </Modal>
  );
};

export default UpdateFormEngineers;
