import { getCategoryTree } from '@/services/category';
import { message, Select, Space, Tag } from 'antd';
import React, { useCallback, useEffect, useState } from 'react';

interface CategoryCascadeSelectProps {
  value?: string;
  onChange?: (categoryId: string | undefined) => void;
  /**
   * The record's full nested category ({title, parent: {title, parent: ...}}) — used only to seed
   * which level-1/2/3 option is pre-selected when editing an existing record. Not managed by
   * Form.Item (that's what `value`/`onChange` are for); this mirrors how the surrounding form
   * already seeds its other fields directly from the record, not through the field's own value.
   */
  initialCategory?: API.ServiceCategory | null;
}

/**
 * Walk the parent chain (leaf-first, as the API returns it) and reverse to read root → leaf.
 */
const buildCategoryIdChain = (
  category?: API.ServiceCategory | null,
): string[] => {
  if (!category) return [];
  const ids: string[] = [category.id];

  let current = category.parent;
  while (current) {
    ids.push(current.id);
    current = current.parent;
  }

  return ids.reverse();
};

const buildCategoryTitleChain = (
  category?: API.ServiceCategory | null,
): string[] => {
  if (!category) return [];
  const titles: string[] = [category.title];

  let current = category.parent;
  while (current) {
    titles.push(current.title);
    current = current.parent;
  }

  return titles.reverse();
};

/**
 * Three cascading level-1/2/3 selects over a category tree, mirroring the pattern already used
 * by `Services/components/UpdateCategoryForm.tsx` — adapted here as a plain Form.Item-compatible
 * controlled field (single leaf category id in/out) so it drops into any `Form.Item name="category_id"`.
 */
const CategoryCascadeSelect: React.FC<CategoryCascadeSelectProps> = ({
  value,
  onChange,
  initialCategory,
}) => {
  const [treeLoading, setTreeLoading] = useState(false);
  const [categoryTree, setCategoryTree] = useState<API.CategoryTreeItem[]>([]);

  const [level1, setLevel1] = useState<string | undefined>(undefined);
  const [level2, setLevel2] = useState<string | undefined>(undefined);
  const [level3, setLevel3] = useState<string | undefined>(undefined);

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
    fetchCategoryTree();
  }, [fetchCategoryTree]);

  // Seed level1/2/3 from the record's category chain once the tree is available.
  useEffect(() => {
    if (categoryTree.length === 0) return;
    const idChain = buildCategoryIdChain(initialCategory);
    setLevel1(idChain[0] || value || undefined);
    setLevel2(idChain[1] || undefined);
    setLevel3(idChain[2] || undefined);
    // Only re-seed when the source record (or the tree finishing loading) changes, not on every
    // onChange-driven level update below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialCategory, categoryTree.length]);

  const level2Options = level1
    ? categoryTree.find((c) => c.id === level1)?.children || []
    : [];

  const level3Options = level2
    ? level2Options.find((c) => c.id === level2)?.children || []
    : [];

  const emitChange = (l1?: string, l2?: string, l3?: string) => {
    onChange?.(l3 || l2 || l1 || undefined);
  };

  const handleLevel1Change = (newValue: string) => {
    setLevel1(newValue);
    setLevel2(undefined);
    setLevel3(undefined);
    emitChange(newValue, undefined, undefined);
  };

  const handleLevel2Change = (newValue: string) => {
    setLevel2(newValue);
    setLevel3(undefined);
    emitChange(level1, newValue, undefined);
  };

  const handleLevel3Change = (newValue: string) => {
    setLevel3(newValue);
    emitChange(level1, level2, newValue);
  };

  const currentCategoryPath = buildCategoryTitleChain(initialCategory);

  return (
    <div>
      {currentCategoryPath.length > 0 && (
        <div style={{ marginBottom: 8 }}>
          <span style={{ marginLeft: 8, color: '#888' }}>دسته‌بندی فعلی:</span>
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

      <Space direction="vertical" style={{ width: '100%' }} size={8}>
        <Select
          placeholder="دسته‌بندی سطح اول"
          value={level1}
          onChange={handleLevel1Change}
          loading={treeLoading}
          style={{ width: '100%' }}
          showSearch
          optionFilterProp="label"
          options={categoryTree.map((c) => ({ label: c.title, value: c.id }))}
        />

        {level1 && level2Options.length > 0 && (
          <Select
            placeholder="دسته‌بندی سطح دوم"
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
        )}

        {level2 && level3Options.length > 0 && (
          <Select
            placeholder="دسته‌بندی سطح سوم"
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
        )}
      </Space>
    </div>
  );
};

export default CategoryCascadeSelect;
