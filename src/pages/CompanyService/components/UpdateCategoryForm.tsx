import { getCategoryTree } from '@/services/category';
import { updateCompanyServiceCategory } from '@/services/company-service';
import { message, Modal, Select, Space, Spin, Tag } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

interface UpdateCategoryFormProps {
  visible: boolean;
  onCancel: () => void;
  onSuccess: () => void;
  record: API.CompanyServiceItem | null;
}

/**
 * Build the category chain (from root to leaf) by walking up the parent references
 */
const buildCategoryChain = (
  category: API.CompanyServiceCategory | null,
): string[] => {
  if (!category) return [];
  const parts: string[] = [];

  const collectParents = (
    cat: {
      id: string;
      title: string;
      parent: { id: string; title: string; parent: any } | null;
    } | null,
  ) => {
    if (cat) {
      collectParents(cat.parent);
      parts.push(cat.title);
    }
  };

  collectParents(category.parent);
  parts.push(category.title);
  return parts;
};

/**
 * Walk up the parent chain to collect IDs from root to leaf
 */
const buildCategoryIdChain = (
  category: API.CompanyServiceCategory | null,
): string[] => {
  if (!category) return [];
  const ids: string[] = [];

  const collectParents = (
    cat: {
      id: string;
      title: string;
      parent: { id: string; title: string; parent: any } | null;
    } | null,
  ) => {
    if (cat) {
      collectParents(cat.parent);
      ids.push(cat.id);
    }
  };

  collectParents(category.parent);
  ids.push(category.id);
  return ids;
};

const UpdateCategoryForm: React.FC<UpdateCategoryFormProps> = ({
  visible,
  onCancel,
  onSuccess,
  record,
}) => {
  const [loading, setLoading] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeItem[]>([]);

  // Selected values for each level
  const [level1, setLevel1] = useState<string | undefined>(undefined);
  const [level2, setLevel2] = useState<string | undefined>(undefined);
  const [level3, setLevel3] = useState<string | undefined>(undefined);

  // Fetch category tree when modal opens
  const fetchCategoryTree = useCallback(async () => {
    setTreeLoading(true);
    try {
      const response = await getCategoryTree();
      if (response.success) {
        setCategoryTree(response.data || []);
      }
    } catch {
      message.error('خطا در دریافت دسته‌بندی‌ها');
    } finally {
      setTreeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      fetchCategoryTree();
    }
  }, [visible, fetchCategoryTree]);

  // Pre-populate selections from current record's category chain
  useEffect(() => {
    if (visible && record && categoryTree.length > 0) {
      const idChain = buildCategoryIdChain(record.category);

      setLevel1(idChain[0] || undefined);
      setLevel2(idChain[1] || undefined);
      setLevel3(idChain[2] || undefined);
    }
  }, [visible, record, categoryTree]);

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setLevel1(undefined);
      setLevel2(undefined);
      setLevel3(undefined);
      setCategoryTree([]);
    }
  }, [visible]);

  // Get children for level 2 based on level 1 selection
  const level2Options = level1
    ? categoryTree.find((c) => c.id === level1)?.children || []
    : [];

  // Get children for level 3 based on level 2 selection
  const level3Options = level2
    ? level2Options.find((c) => c.id === level2)?.children || []
    : [];

  const handleLevel1Change = (value: string) => {
    setLevel1(value);
    setLevel2(undefined);
    setLevel3(undefined);
  };

  const handleLevel2Change = (value: string) => {
    setLevel2(value);
    setLevel3(undefined);
  };

  const handleLevel3Change = (value: string) => {
    setLevel3(value);
  };

  // The category_id to send = deepest selected level
  const getSelectedCategoryId = (): string | undefined => {
    if (level3) return level3;
    if (level2) return level2;
    return level1;
  };

  const handleSubmit = async () => {
    if (!record) return;

    const categoryId = getSelectedCategoryId();
    if (!categoryId) {
      message.warning('لطفا یک دسته‌بندی انتخاب کنید');
      return;
    }

    setLoading(true);
    try {
      const response = await updateCompanyServiceCategory(
        record.id,
        categoryId,
      );
      if (response.success) {
        message.success('دسته‌بندی با موفقیت تغییر کرد');
        onSuccess();
      } else {
        message.error(response.message || 'خطا در تغییر دسته‌بندی');
      }
    } catch {
      message.error('خطا در ارتباط با سرور');
    } finally {
      setLoading(false);
    }
  };

  const currentCategoryPath = record ? buildCategoryChain(record.category) : [];

  return (
    <Modal
      title="تغییر دسته‌بندی"
      open={visible}
      onOk={handleSubmit}
      onCancel={onCancel}
      confirmLoading={loading}
      okText="ذخیره"
      cancelText="انصراف"
      width={500}
    >
      <Spin spinning={treeLoading}>
        {/* Current category path */}
        {currentCategoryPath.length > 0 && (
          <div style={{ marginBottom: 16 }}>
            <span style={{ marginLeft: 8, color: '#888' }}>
              دسته‌بندی فعلی:
            </span>
            <Space size={4}>
              {currentCategoryPath.map((part, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <span style={{ color: '#ccc' }}>/</span>}
                  <Tag>{part}</Tag>
                </React.Fragment>
              ))}
            </Space>
          </div>
        )}

        {/* Level 1: Root categories */}
        <div style={{ marginBottom: 12 }}>
          <div style={{ marginBottom: 4, fontWeight: 500 }}>
            دسته‌بندی سطح اول
          </div>
          <Select
            placeholder="انتخاب دسته‌بندی سطح اول"
            value={level1}
            onChange={handleLevel1Change}
            style={{ width: '100%' }}
            showSearch
            optionFilterProp="label"
            options={categoryTree.map((c) => ({
              label: c.title,
              value: c.id,
            }))}
          />
        </div>

        {/* Level 2: Children of selected root */}
        {level1 && level2Options.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>
              دسته‌بندی سطح دوم
            </div>
            <Select
              placeholder="انتخاب دسته‌بندی سطح دوم"
              value={level2}
              onChange={handleLevel2Change}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={level2Options.map((c) => ({
                label: c.title,
                value: c.id,
              }))}
            />
          </div>
        )}

        {/* Level 3: Children of selected level 2 */}
        {level2 && level3Options.length > 0 && (
          <div style={{ marginBottom: 12 }}>
            <div style={{ marginBottom: 4, fontWeight: 500 }}>
              دسته‌بندی سطح سوم
            </div>
            <Select
              placeholder="انتخاب دسته‌بندی سطح سوم"
              value={level3}
              onChange={handleLevel3Change}
              style={{ width: '100%' }}
              showSearch
              optionFilterProp="label"
              options={level3Options.map((c) => ({
                label: c.title,
                value: c.id,
              }))}
            />
          </div>
        )}
      </Spin>
    </Modal>
  );
};

export default UpdateCategoryForm;
