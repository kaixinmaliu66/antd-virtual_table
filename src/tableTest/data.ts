/**
 * 树形大数据生成器
 *
 * 数据模型：顶层 N 条 → 每个父节点展开后加载 childCount 个子节点 → 递归到 maxLevel 层
 * 数据采用「懒加载」策略：只有节点被展开时才生成其子级数组，
 * 避免一次性创建海量对象导致浏览器内存溢出。
 */

export interface TreeNode {
  key: string
  name: string
  /** 层级：1 = 顶层，2 = 子集，3 = 孙级 ... */
  level: number
  /** 节点路径，如 "0-3-5"，同时作为 key */
  path: string
  /** 该节点是否还有子级（决定是否显示展开图标） */
  hasChildren: boolean
  children?: TreeNode[]
}

export interface ScaleConfig {
  /** 顶层条数（默认 10000） */
  topCount: number
  /** 每个父节点的子节点数量（默认 10000，所有层级统一） */
  childCount: number
  /** 最大层级（默认 3） */
  maxLevel: number
}

export const DEFAULT_SCALE: ScaleConfig = {
  topCount: 10000,
  childCount: 10000,
  maxLevel: 3,
}

/** 第 level 层的节点展开后，子级数量（所有层级统一） */
export function childCountOf(level: number, cfg: ScaleConfig): number {
  if (level >= cfg.maxLevel) return 0
  return cfg.childCount
}

function makeNode(path: string, level: number, cfg: ScaleConfig): TreeNode {
  const hasChildren = childCountOf(level, cfg) > 0
  return {
    key: path,
    name: `节点 ${path}`,
    level,
    path,
    hasChildren,
    // 空数组让 antd 检测到树形结构从而显示展开图标，实际数据在展开时懒加载
    children: hasChildren ? [] : undefined,
  }
}

/** 生成一层节点数组（惰性：只创建本层节点，不含 children） */
export function generateLevel(
  parentPath: string,
  level: number,
  count: number,
  cfg: ScaleConfig,
): TreeNode[] {
  const list: TreeNode[] = new Array(count)
  for (let i = 0; i < count; i += 1) {
    const path = parentPath ? `${parentPath}-${i}` : `${i}`
    list[i] = makeNode(path, level, cfg)
  }
  return list
}

/** 生成顶层数据（仅顶层，不含子级） */
export function generateTopLevel(cfg: ScaleConfig): TreeNode[] {
  return generateLevel('', 1, cfg.topCount, cfg)
}

/** 统计当前已加载（含所有已展开子级）各层级的节点数 */
export function countByLevel(data: TreeNode[]): Record<number, number> {
  const counts: Record<number, number> = {}
  const stack: TreeNode[] = [...data]
  while (stack.length > 0) {
    const node = stack.pop()!
    counts[node.level] = (counts[node.level] ?? 0) + 1
    const children = node.children
    if (children && children.length > 0) {
      for (let i = 0; i < children.length; i += 1) stack.push(children[i])
    }
  }
  return counts
}

/** 统计当前已加载（含所有已展开子级）后的总行数 */
export function countFlatten(data: TreeNode[]): number {
  let n = 0
  const stack: TreeNode[] = [...data]
  while (stack.length > 0) {
    const node = stack.pop()!
    n += 1
    const children = node.children
    if (children && children.length > 0) {
      for (let i = 0; i < children.length; i += 1) stack.push(children[i])
    }
  }
  return n
}
