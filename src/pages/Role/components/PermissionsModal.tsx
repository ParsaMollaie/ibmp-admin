import { getPermissions } from '@/services/permission';
import { getRolePermissions, updateRolePermissions } from '@/services/role';
import {
  Alert,
  Checkbox,
  Col,
  Divider,
  Modal,
  Row,
  Spin,
  Typography,
  message,
} from 'antd';
import React, { useEffect, useMemo, useState } from 'react';

const { Text } = Typography;

interface PermissionsModalProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.RoleItem | null;
}

/** Groups permission names like "services:list" into a "services" bucket for display. */
const groupByResource = (items: API.PermissionItem[]) => {
  const groups: Record<string, API.PermissionItem[]> = {};
  items.forEach((item) => {
    const resource = item.name.split(':')[0];
    if (!groups[resource]) groups[resource] = [];
    groups[resource].push(item);
  });
  return groups;
};

const PermissionsModal: React.FC<PermissionsModalProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [allPermissions, setAllPermissions] = useState<API.PermissionItem[]>(
    [],
  );
  const [selected, setSelected] = useState<string[]>([]);

  const isSuperAdmin = record?.name === 'SuperAdmin';

  useEffect(() => {
    if (!visible || !record) return;

    const load = async () => {
      setLoading(true);
      try {
        const [permissionsRes, rolePermissionsRes] = await Promise.all([
          getPermissions({ page_size: 1000 }),
          getRolePermissions(record.id),
        ]);
        setAllPermissions(permissionsRes?.data?.list || []);
        setSelected(rolePermissionsRes?.data || []);
      } catch (error) {
        console.error('Load role permissions error:', error);
        message.error('خطا در دریافت دسترسی‌ها');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [visible, record]);

  const grouped = useMemo(
    () => groupByResource(allPermissions),
    [allPermissions],
  );

  const toggle = (name: string, checked: boolean) => {
    setSelected((prev) =>
      checked ? [...prev, name] : prev.filter((p) => p !== name),
    );
  };

  const toggleGroup = (names: string[], checked: boolean) => {
    setSelected((prev) => {
      const withoutGroup = prev.filter((p) => !names.includes(p));
      return checked ? [...withoutGroup, ...names] : withoutGroup;
    });
  };

  const handleSubmit = async () => {
    if (!record) return;

    setSaving(true);
    try {
      const response = await updateRolePermissions(record.id, selected);
      if (response.success) {
        onSuccess();
      } else {
        message.error(response.message || 'خطا در بروزرسانی دسترسی‌ها');
      }
    } catch (error) {
      console.error('Update role permissions error:', error);
      message.error('خطا در ارتباط با سرور');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      title={`دسترسی‌های نقش: ${record?.title || record?.name || ''}`}
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={saving}
      okText="ذخیره"
      cancelText="انصراف"
      okButtonProps={{ disabled: isSuperAdmin }}
      width={800}
    >
      {isSuperAdmin && (
        <Alert
          type="info"
          showIcon
          message="دسترسی‌های نقش مدیر کل قابل ویرایش نیست"
          description="نقش مدیر کل همیشه تمام دسترسی‌های سیستم را دارد و از طریق دستور همگام‌سازی سرور بروزرسانی می‌شود."
          style={{ marginBottom: 16 }}
        />
      )}

      <Spin spinning={loading}>
        {Object.entries(grouped).map(([resource, items]) => {
          const names = items.map((i) => i.name);
          const allChecked = names.every((n) => selected.includes(n));
          const someChecked = names.some((n) => selected.includes(n));

          return (
            <div key={resource} style={{ marginBottom: 16 }}>
              <Checkbox
                indeterminate={someChecked && !allChecked}
                checked={allChecked}
                disabled={isSuperAdmin}
                onChange={(e) => toggleGroup(names, e.target.checked)}
              >
                <Text strong>{resource}</Text>
              </Checkbox>
              <Divider style={{ margin: '8px 0' }} />
              <Row gutter={[8, 8]}>
                {items.map((item) => (
                  <Col span={8} key={item.id}>
                    <Checkbox
                      checked={selected.includes(item.name)}
                      disabled={isSuperAdmin}
                      onChange={(e) => toggle(item.name, e.target.checked)}
                    >
                      {item.title || item.name}
                    </Checkbox>
                  </Col>
                ))}
              </Row>
            </div>
          );
        })}
      </Spin>
    </Modal>
  );
};

export default PermissionsModal;
