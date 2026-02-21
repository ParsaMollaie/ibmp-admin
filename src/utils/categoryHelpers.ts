export interface LeafCategory {
  id: string;
  title: string;
  path: string;
}

/**
 * Recursively collect all leaf categories (nodes without children) from a category tree.
 * Each leaf includes its full breadcrumb path like "سازه > قالب > روغن".
 */
export function collectLeafCategories(
  tree: API.CategoryTreeItem[],
  parentPath: string = '',
): LeafCategory[] {
  const leaves: LeafCategory[] = [];

  for (const node of tree) {
    const currentPath = parentPath
      ? `${parentPath} > ${node.title}`
      : node.title;

    if (!node.children || node.children.length === 0) {
      leaves.push({
        id: node.id,
        title: node.title,
        path: currentPath,
      });
    } else {
      leaves.push(...collectLeafCategories(node.children, currentPath));
    }
  }

  return leaves;
}

/**
 * Build a lookup map from category title to ID.
 * Also tracks duplicate titles so callers can detect ambiguity.
 *
 * @returns map: title→id (first match), duplicates: title→id[] (all matches for ambiguous names)
 */
export function buildCategoryLookup(leaves: LeafCategory[]): {
  map: Map<string, string>;
  duplicates: Map<string, string[]>;
} {
  const map = new Map<string, string>();
  const duplicates = new Map<string, string[]>();

  for (const leaf of leaves) {
    const title = leaf.title.trim();
    if (map.has(title)) {
      // Track as duplicate
      if (!duplicates.has(title)) {
        duplicates.set(title, [map.get(title)!]);
      }
      duplicates.get(title)!.push(leaf.id);
    } else {
      map.set(title, leaf.id);
    }
  }

  return { map, duplicates };
}

/**
 * Build a lookup map from full category path to ID.
 * Used to disambiguate categories with duplicate titles.
 */
export function buildPathLookup(leaves: LeafCategory[]): Map<string, string> {
  const pathMap = new Map<string, string>();

  for (const leaf of leaves) {
    pathMap.set(leaf.path.trim(), leaf.id);
  }

  return pathMap;
}
