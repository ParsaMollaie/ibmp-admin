import { updateContactProfile } from '@/services/contact-profile';
import { getCities, getProvinces } from '@/services/location';
import { DeleteOutlined, PlusOutlined } from '@ant-design/icons';
import {
  Button,
  Card,
  Col,
  Form,
  Input,
  Modal,
  Row,
  Select,
  message,
} from 'antd';
import React, { useEffect, useState } from 'react';

interface UpdateFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.ContactProfileItem | null;
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

  const [provinces, setProvinces] = useState<API.ProvinceItem[]>([]);
  const [citiesMap, setCitiesMap] = useState<Record<number, API.CityItem[]>>(
    {},
  );
  const [loadingProvinces, setLoadingProvinces] = useState(false);
  const [loadingCitiesMap, setLoadingCitiesMap] = useState<
    Record<number, boolean>
  >({});

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
      fetchProvinces();
    }
  }, [visible]);

  useEffect(() => {
    if (record && visible) {
      // Build addresses from record
      const addresses =
        record.addresses?.length > 0
          ? record.addresses.map((a) => ({
              province_id: a.province?.id,
              city_id: a.city?.id,
              address: a.address || '',
            }))
          : [];

      form.setFieldsValue({
        title: record.title,
        email: record.email,
        website: record.website,
        contact_numbers: record.contact_numbers || [],
        social_medias: record.social_medias || [],
        addresses,
      });

      // Load cities for each address row
      addresses.forEach((addr, idx) => {
        if (addr.province_id) {
          fetchCitiesForRow(addr.province_id, idx);
        }
      });
    }
  }, [record, visible, form]);

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

  const resetForm = () => {
    form.resetFields();
    setCitiesMap({});
  };

  const handleSubmit = async () => {
    if (!record) return;

    try {
      const values = await form.validateFields();
      setLoading(true);

      const payload: API.ContactProfilePayload = {
        title: values.title,
        email: values.email || null,
        website: values.website || null,
        contact_numbers: values.contact_numbers || [],
        social_medias: values.social_medias || [],
        addresses: (values.addresses || [])
          .filter((a: any) => a?.province_id && a?.city_id)
          .map((a: any) => ({
            province_id: a.province_id,
            city_id: a.city_id,
            address: a.address || undefined,
          })),
      };

      const response = await updateContactProfile(record.id, payload);

      if (response.success) {
        message.success('پروفایل تماس با موفقیت ویرایش شد');
        resetForm();
        onSuccess();
      } else {
        message.error(response.message || 'خطا در ویرایش پروفایل تماس');
      }
    } catch (error) {
      console.error('Update contact profile error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    resetForm();
    onCancel();
  };

  return (
    <Modal
      title="ویرایش پروفایل تماس"
      open={visible}
      onOk={handleSubmit}
      onCancel={handleCancel}
      confirmLoading={loading}
      okText="ذخیره تغییرات"
      cancelText="انصراف"
      width={800}
      styles={{ body: { maxHeight: '70vh', overflowY: 'auto' } }}
    >
      <Form form={form} layout="vertical">
        {/* Basic Information */}
        <Card size="small" title="اطلاعات پایه" style={{ marginBottom: 16 }}>
          {/* Show user info (read-only) */}
          {record?.user && (
            <Row gutter={16}>
              <Col span={24}>
                <Form.Item label="کاربر">
                  <Input
                    disabled
                    value={`${record.user.first_name} ${record.user.last_name} (${record.user.username})`}
                  />
                </Form.Item>
              </Col>
            </Row>
          )}

          <Row gutter={16}>
            <Col span={24}>
              <Form.Item
                name="title"
                label="عنوان"
                rules={[{ required: true, message: 'عنوان را وارد کنید' }]}
              >
                <Input placeholder="عنوان پروفایل تماس" />
              </Form.Item>
            </Col>
          </Row>

          <Row gutter={16}>
            <Col span={12}>
              <Form.Item name="email" label="ایمیل">
                <Input placeholder="ایمیل" style={{ direction: 'ltr' }} />
              </Form.Item>
            </Col>
            <Col span={12}>
              <Form.Item name="website" label="وب‌سایت">
                <Input
                  placeholder="https://example.com"
                  style={{ direction: 'ltr' }}
                />
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

        {/* Addresses */}
        <Card size="small" title="آدرس‌ها" style={{ marginBottom: 16 }}>
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
                      <Col span={7}>
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
                      <Col span={7}>
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
                            options={(citiesMap[index] || []).map((c) => ({
                              label: c.name,
                              value: c.id,
                            }))}
                          />
                        </Form.Item>
                      </Col>
                      <Col span={8}>
                        <Form.Item
                          {...restField}
                          name={[name, 'address']}
                          label="آدرس (اختیاری)"
                        >
                          <Input placeholder="آدرس" />
                        </Form.Item>
                      </Col>
                      <Col span={2}>
                        <Button
                          type="text"
                          danger
                          icon={<DeleteOutlined />}
                          onClick={() => remove(name)}
                        />
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
                >
                  افزودن آدرس
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
