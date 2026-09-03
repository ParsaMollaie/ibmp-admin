import MapPicker from '@/components/MapPicker';
import { socialMediaTypeOptions } from '@/constants/serviceSocialMedia';
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

const reindexFileMap = (
  prev: Record<number, UploadFile[]>,
  index: number,
): Record<number, UploadFile[]> => {
  const next = { ...prev };
  delete next[index];
  const reindexed: Record<number, UploadFile[]> = {};
  Object.keys(next).forEach((key) => {
    const keyNum = parseInt(key, 10);
    reindexed[keyNum > index ? keyNum - 1 : keyNum] = next[keyNum];
  });
  return reindexed;
};

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

  const [avatarFile, setAvatarFile] = useState<UploadFile[]>([]);
  const [bannerFile, setBannerFile] = useState<UploadFile[]>([]);
  const [catalogFile, setCatalogFile] = useState<UploadFile[]>([]);
  const [certificationFiles, setCertificationFiles] = useState<
    Record<number, UploadFile[]>
  >({});
  const [completedProjectFiles, setCompletedProjectFiles] = useState<
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
              label: a.label || '',
              latitude: a.latitude ?? undefined,
              longitude: a.longitude ?? undefined,
            }))
          : [
              {
                province_id: undefined,
                city_id: undefined,
                address: '',
                label: '',
                latitude: undefined,
                longitude: undefined,
              },
            ];

      // Set initial contact profile selection
      const cpId = record.contact_profile_id || null;
      setSelectedContactProfileId(cpId);

      const keywords = record.keywords
        ? record.keywords
            .split(/[,،]/)
            .map((k) => k.trim())
            .filter(Boolean)
        : [];

      form.setFieldsValue({
        title: record.title,
        summary: record.summary,
        description: record.description,
        email: record.email,
        website: record.website,
        videos: record.videos || [],
        category_id: categoryId,
        contact_profile_id: cpId,
        addresses,
        contact_numbers: record.contact_numbers || [],
        social_medias: record.social_media || [],
        incorporation_year: record.incorporation_year || undefined,
        working_hours: record.working_hours || '',
        service_areas: record.service_areas || '',
        keywords,
        certifications:
          record.certifications?.map((c) => ({ title: c.title || '' })) || [],
        completed_projects:
          record.completed_projects?.map((p) => ({
            title: p.title || '',
            place: p.place || '',
            year: p.year || '',
            description: p.description || '',
          })) || [],
      });

      // Load cities for each address row
      addresses.forEach((addr, idx) => {
        if (addr.province_id) {
          fetchCitiesForRow(addr.province_id, idx);
        }
      });

      // Set avatar/banner/catalog previews
      setAvatarFile(
        record.avatar
          ? [
              {
                uid: '-avatar',
                name: 'avatar',
                status: 'done',
                url: record.avatar,
              },
            ]
          : [],
      );

      setBannerFile(
        record.banner
          ? [
              {
                uid: '-banner',
                name: 'banner',
                status: 'done',
                url: record.banner,
              },
            ]
          : [],
      );

      setCatalogFile(
        record.catalog
          ? [
              {
                uid: '-catalog',
                name: 'catalog',
                status: 'done',
                url: record.catalog,
              },
            ]
          : [],
      );

      // Set certification file previews
      const certFiles: Record<number, UploadFile[]> = {};
      record.certifications?.forEach((cert, index) => {
        const url = cert.file || cert.file_path;
        if (url) {
          certFiles[index] = [
            {
              uid: `-cert-${index}`,
              name: cert.title || `certificate-${index}`,
              status: 'done',
              url,
            },
          ];
        }
      });
      setCertificationFiles(certFiles);

      // Set completed project image previews
      const projectFiles: Record<number, UploadFile[]> = {};
      record.completed_projects?.forEach((project, index) => {
        const url = project.image || project.image_path;
        if (url) {
          projectFiles[index] = [
            {
              uid: `-project-${index}`,
              name: project.title || `project-${index}`,
              status: 'done',
              url,
            },
          ];
        }
      });
      setCompletedProjectFiles(projectFiles);
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

  const getBannerUploadProps = (): UploadProps => ({
    beforeUpload: (file) => {
      const isImage = file.type.startsWith('image/');
      if (!isImage) {
        message.error('فقط فایل‌های تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => setBannerFile(info.fileList),
    fileList: bannerFile,
    listType: 'picture-card',
    maxCount: 1,
  });

  const getCatalogUploadProps = (): UploadProps => ({
    beforeUpload: (file) => {
      const lowerName = file.name.toLowerCase();
      const isAllowed =
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type === 'application/zip' ||
        file.type === 'application/x-zip-compressed' ||
        file.type === 'application/vnd.rar' ||
        file.type === 'application/x-rar-compressed' ||
        lowerName.endsWith('.zip') ||
        lowerName.endsWith('.rar') ||
        file.type.startsWith('image/');
      if (!isAllowed) {
        message.error('فقط فایل‌های PDF، Word، Zip، Rar و تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) => setCatalogFile(info.fileList),
    fileList: catalogFile,
    maxCount: 1,
  });

  const getCertificationUploadProps = (index: number): UploadProps => ({
    beforeUpload: (file) => {
      const isAllowed =
        file.type === 'application/pdf' ||
        file.type === 'application/msword' ||
        file.type ===
          'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        file.type.startsWith('image/');
      if (!isAllowed) {
        message.error('فقط فایل‌های PDF، Word و تصویری مجاز هستند');
        return Upload.LIST_IGNORE;
      }
      const isLt2M = file.size / 1024 / 1024 < 2;
      if (!isLt2M) {
        message.error('حجم فایل باید کمتر از 2 مگابایت باشد');
        return Upload.LIST_IGNORE;
      }
      return false;
    },
    onChange: (info) =>
      setCertificationFiles((prev) => ({ ...prev, [index]: info.fileList })),
    fileList: certificationFiles[index] || [],
    maxCount: 1,
  });

  const getCompletedProjectUploadProps = (index: number): UploadProps => ({
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
    onChange: (info) =>
      setCompletedProjectFiles((prev) => ({
        ...prev,
        [index]: info.fileList,
      })),
    fileList: completedProjectFiles[index] || [],
    listType: 'picture-card',
    maxCount: 1,
  });

  const resetForm = () => {
    form.resetFields();
    setAvatarFile([]);
    setBannerFile([]);
    setCatalogFile([]);
    setCertificationFiles({});
    setCompletedProjectFiles({});
    setCitiesMap({});
    setContactProfiles([]);
    setSelectedContactProfileId(null);
  };

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

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

      // Process banner
      let bannerValue: string | null = null;
      if (bannerFile.length > 0) {
        const file = bannerFile[0];
        if (file.originFileObj) {
          bannerValue = await getBase64(file.originFileObj);
        } else if (file.url) {
          bannerValue = file.url;
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

      // Process certifications
      const processedCertifications: API.ServiceCertificationPayload[] = [];
      for (let i = 0; i < (values.certifications?.length || 0); i++) {
        const cert = values.certifications[i];
        const files = certificationFiles[i] || [];
        if (files.length === 0) continue;
        const file = files[0];
        const fileValue = file.originFileObj
          ? await getBase64(file.originFileObj)
          : file.url || '';
        if (!fileValue) continue;
        processedCertifications.push({
          title: cert.title || undefined,
          file: fileValue,
        });
      }

      // Process completed projects
      const processedCompletedProjects: API.ServiceCompletedProjectPayload[] =
        [];
      for (let i = 0; i < (values.completed_projects?.length || 0); i++) {
        const project = values.completed_projects[i];
        const files = completedProjectFiles[i] || [];
        if (files.length === 0) continue;
        const file = files[0];
        const imageValue = file.originFileObj
          ? await getBase64(file.originFileObj)
          : file.url || '';
        if (!imageValue) continue;
        processedCompletedProjects.push({
          title: project.title || undefined,
          place: project.place || undefined,
          year: project.year || undefined,
          description: project.description || undefined,
          image: imageValue,
        });
      }

      const payload: API.ServiceEngineersPayload = {
        title: values.title,
        summary: values.summary,
        description: values.description,
        email: values.email,
        website: values.website || undefined,
        videos: (values.videos || []).filter((v: string) => !!v),
        avatar: avatarValue,
        banner: bannerValue,
        catalog: catalogValue,
        incorporation_year: values.incorporation_year || undefined,
        working_hours: values.working_hours || undefined,
        service_areas: values.service_areas || undefined,
        keywords: values.keywords?.length
          ? values.keywords.join('، ')
          : undefined,
        certifications: processedCertifications,
        completed_projects: processedCompletedProjects,
        category_id: values.category_id,
        contact_profile_id: values.contact_profile_id || null,
        addresses: (values.addresses || []).map((a: any) => ({
          province_id: a.province_id,
          city_id: a.city_id,
          address: a.address || undefined,
          label: a.label || undefined,
          latitude: typeof a.latitude === 'number' ? a.latitude : undefined,
          longitude: typeof a.longitude === 'number' ? a.longitude : undefined,
        })),
        contact_numbers: values.contact_numbers || [],
        social_medias: values.social_medias || [],
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

  const handleRemoveCertification = (
    index: number,
    remove: (index: number) => void,
  ) => {
    setCertificationFiles((prev) => reindexFileMap(prev, index));
    remove(index);
  };

  const handleRemoveCompletedProject = (
    index: number,
    remove: (index: number) => void,
  ) => {
    setCompletedProjectFiles((prev) => reindexFileMap(prev, index));
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

  const handleAddressPositionChange = (
    rowIndex: number,
    latitude: number,
    longitude: number,
  ) => {
    if (selectedContactProfileId) return;
    const addresses = form.getFieldValue('addresses') || [];
    addresses[rowIndex] = { ...addresses[rowIndex], latitude, longitude };
    form.setFieldsValue({ addresses });
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

        {/* Extra details */}
        <Card size="small" title="اطلاعات تکمیلی" style={{ marginBottom: 16 }}>
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item name="incorporation_year" label="سال شروع فعالیت">
                <InputNumber
                  min={1200}
                  max={1500}
                  style={{ width: '100%' }}
                  placeholder="1400"
                />
              </Form.Item>
            </Col>
            <Col span={16}>
              <Form.Item name="working_hours" label="ساعات کاری">
                <Input
                  placeholder="مثلاً شنبه تا چهارشنبه، ساعت ۹ الی ۱۷"
                  maxLength={255}
                />
              </Form.Item>
            </Col>
          </Row>
          <Form.Item name="service_areas" label="مناطق تحت پوشش">
            <Input placeholder="مناطق ارائه خدمت" maxLength={500} />
          </Form.Item>
          <Form.Item name="keywords" label="کلمات کلیدی">
            <Select
              mode="tags"
              tokenSeparators={[',', '،']}
              placeholder="کلمه کلیدی را وارد کرده و Enter بزنید"
              open={false}
            />
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
                      <Col span={6}>
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
                      <Col span={6}>
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
                      <Col span={5}>
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
                      <Col span={5}>
                        <Form.Item
                          {...restField}
                          name={[name, 'label']}
                          label="برچسب"
                        >
                          <Input
                            placeholder="مثلاً دفتر مرکزی"
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
                    <Form.Item
                      label="موقعیت روی نقشه"
                      shouldUpdate
                      style={{ marginBottom: 0 }}
                    >
                      {() => {
                        const latitude = form.getFieldValue([
                          'addresses',
                          name,
                          'latitude',
                        ]);
                        const longitude = form.getFieldValue([
                          'addresses',
                          name,
                          'longitude',
                        ]);
                        return (
                          <MapPicker
                            latitude={
                              typeof latitude === 'number'
                                ? latitude
                                : undefined
                            }
                            longitude={
                              typeof longitude === 'number'
                                ? longitude
                                : undefined
                            }
                            onChange={(lat, lng) =>
                              handleAddressPositionChange(index, lat, lng)
                            }
                          />
                        );
                      }}
                    </Form.Item>
                  </div>
                ))}
                <Button
                  type="dashed"
                  onClick={() =>
                    add({
                      province_id: undefined,
                      city_id: undefined,
                      address: '',
                      label: '',
                      latitude: undefined,
                      longitude: undefined,
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

        {/* Videos */}
        <Card size="small" title="ویدئوهای معرفی" style={{ marginBottom: 16 }}>
          <Form.List name="videos">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }) => (
                  <Row key={key} gutter={16} align="middle">
                    <Col span={20}>
                      <Form.Item
                        {...restField}
                        name={name}
                        extra={
                          fields[0]?.key === key
                            ? 'لینک embed ویدئو از یوتیوب یا آپارات (مثلاً: https://www.aparat.com/video/video/embed/videohash/xxxx/vt/frame)'
                            : undefined
                        }
                      >
                        <Input
                          placeholder="لینک embed ویدئو را وارد کنید"
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
                  onClick={() => add('')}
                  block
                  icon={<PlusOutlined />}
                >
                  افزودن ویدئو
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Avatar, Banner & Catalog */}
        <Card
          size="small"
          title="آواتار، بنر و کاتالوگ"
          style={{ marginBottom: 16 }}
        >
          <Row gutter={16}>
            <Col span={8}>
              <Form.Item label="آواتار">
                <Upload {...getAvatarUploadProps()}>
                  {avatarFile.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>آپلود</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="بنر">
                <Upload {...getBannerUploadProps()}>
                  {bannerFile.length === 0 && (
                    <div>
                      <PlusOutlined />
                      <div style={{ marginTop: 8 }}>آپلود بنر</div>
                    </div>
                  )}
                </Upload>
              </Form.Item>
            </Col>
            <Col span={8}>
              <Form.Item label="کاتالوگ (PDF, Word, Zip, Rar, تصویر)">
                <Upload {...getCatalogUploadProps()}>
                  <Button icon={<PlusOutlined />}>آپلود کاتالوگ</Button>
                </Upload>
              </Form.Item>
            </Col>
          </Row>
        </Card>

        {/* Certifications */}
        <Card size="small" title="گواهینامه‌ها" style={{ marginBottom: 16 }}>
          <Form.List name="certifications">
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
                          label="عنوان گواهینامه"
                        >
                          <Input placeholder="عنوان گواهینامه" />
                        </Form.Item>
                      </Col>
                      <Col span={10}>
                        <Form.Item label="فایل گواهینامه">
                          <Upload {...getCertificationUploadProps(index)}>
                            {(certificationFiles[index]?.length || 0) === 0 && (
                              <Button icon={<PlusOutlined />}>آپلود</Button>
                            )}
                          </Upload>
                        </Form.Item>
                      </Col>
                      <Col span={4} style={{ textAlign: 'left' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            handleRemoveCertification(index, remove)
                          }
                        >
                          حذف
                        </Button>
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
                  افزودن گواهینامه
                </Button>
              </>
            )}
          </Form.List>
        </Card>

        {/* Completed Projects */}
        <Card size="small" title="پروژه‌های انجام شده">
          <Form.List name="completed_projects">
            {(fields, { add, remove }) => (
              <>
                {fields.map(({ key, name, ...restField }, index) => (
                  <div key={key}>
                    {index > 0 && <Divider />}
                    <Row gutter={16} align="middle">
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'title']}
                          label="عنوان پروژه"
                        >
                          <Input placeholder="عنوان پروژه" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'place']}
                          label="محل اجرا"
                        >
                          <Input placeholder="محل اجرا" />
                        </Form.Item>
                      </Col>
                      <Col span={4}>
                        <Form.Item
                          {...restField}
                          name={[name, 'year']}
                          label="سال اجرا"
                        >
                          <Input placeholder="1400" />
                        </Form.Item>
                      </Col>
                      <Col span={4} style={{ textAlign: 'left' }}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() =>
                            handleRemoveCompletedProject(index, remove)
                          }
                        >
                          حذف
                        </Button>
                      </Col>
                    </Row>
                    <Row gutter={16}>
                      <Col span={16}>
                        <Form.Item
                          {...restField}
                          name={[name, 'description']}
                          label="توضیحات"
                        >
                          <TextArea rows={2} placeholder="توضیحات پروژه" />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item label="تصویر پروژه">
                          <Upload {...getCompletedProjectUploadProps(index)}>
                            {(completedProjectFiles[index]?.length || 0) ===
                              0 && (
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
                    add({ title: '', place: '', year: '', description: '' })
                  }
                  block
                  icon={<PlusOutlined />}
                  style={{ marginTop: 16 }}
                >
                  افزودن پروژه
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
