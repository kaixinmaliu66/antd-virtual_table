import { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react'
import type { Key } from 'react'
import { Empty, Spin, Table, Tag } from 'antd'
import type { TableProps } from 'antd'
import {
  childCountOf,
  countByLevel,
  countFlatten,
  generateLevel,
  type ScaleConfig,
  type TreeNode,
} from './data'

const LEVEL_LABEL: Record<number, string> = { 1: 'lv1', 2: 'lv2', 3: 'lv3', 4: 'lv4', 5: 'lv5' }
const LEVEL_COLOR: Record<number, string> = { 1: 'blue', 2: 'green', 3: 'orange', 4: 'purple', 5: 'red' }

interface Props {
  scale: ScaleConfig
  lazyDelay: number
  data: TreeNode[]
}

export default function BigTable({ scale, lazyDelay, data }: Props) {
  const [expandedKeys, setExpandedKeys] = useState<Key[]>([])
  const [loadingKeys, setLoadingKeys] = useState<Set<string>>(new Set())
  const [renderMs, setRenderMs] = useState(0)
  const [lazyLoaded, setLazyLoaded] = useState(0)
  const [dataVersion, setDataVersion] = useState(0)

  const startRef = useRef(0)
  const prevDataRef = useRef<TreeNode[]>([])
  startRef.current = performance.now()
  useLayoutEffect(() => {
    if (prevDataRef.current !== data) {
      prevDataRef.current = data
      setRenderMs(performance.now() - startRef.current)
    }
  }, [data])

  /** 展开回调：懒加载异步加载子级 */
  const handleExpand = useCallback(
    (expanded: boolean, record: TreeNode) => {
      if (!expanded) return
      if (record.children && record.children.length > 0) return

      const count = childCountOf(record.level, scale)
      if (count <= 0) return

      setLoadingKeys((prev) => {
        if (prev.has(record.key)) return prev
        const next = new Set(prev)
        next.add(record.key)
        return next
      })
      setTimeout(() => {
        const children = generateLevel(record.path, record.level + 1, count, scale)
        record.children = children
        setLoadingKeys((prev) => {
          const next = new Set(prev)
          next.delete(record.key)
          return next
        })
        setLazyLoaded((c) => c + 1)
        setDataVersion((v) => v + 1)
        setExpandedKeys((prev) => [...prev])
      }, lazyDelay)
    },
    [scale, lazyDelay],
  )

  const levelCounts = useMemo(() => countByLevel(data), [data, dataVersion])
  const flattenCount = useMemo(() => countFlatten(data), [data, dataVersion])

  const columns: TableProps<TreeNode>['columns'] = useMemo(
    () => [
      { title: '节点名称', dataIndex: 'name', width: 300, ellipsis: true },
      {
        title: '层级',
        dataIndex: 'level',
        width: 90,
        render: (level: number) => <Tag color={LEVEL_COLOR[level]}>{LEVEL_LABEL[level] ?? `第${level}层`}</Tag>,
      },
      {
        title: '子级数量',
        width: 120,
        render: (_, r) => (r.hasChildren ? childCountOf(r.level, scale).toLocaleString() : '-'),
      },
      {
        title: '状态',
        width: 110,
        render: (_, r) =>
          loadingKeys.has(r.key) ? (
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
              <Spin size="small" /> 加载中
            </span>
          ) : (
            <Tag color="processing">运行中</Tag>
          ),
      },
      {
        title: '描述',
        width: 360,
        ellipsis: true,
        render: (_, r) => `这是第 ${r.level} 层、路径 ${r.path} 的节点数据，用于模拟真实业务字段。`,
      },
    ],
    [scale, loadingKeys],
  )

  return (
    <div className="table-panel">
      <div className="panel-bar">
        <span className="metric">
          一级节点 <b>{(levelCounts[1] ?? 0).toLocaleString()}</b> 条
        </span>
        {(levelCounts[2] ?? 0) > 0 && (
          <span className="metric">
            二级节点 <b>{(levelCounts[2] ?? 0).toLocaleString()}</b> 条
          </span>
        )}
        {(levelCounts[3] ?? 0) > 0 && (
          <span className="metric">
            三级节点 <b>{(levelCounts[3] ?? 0).toLocaleString()}</b> 条
          </span>
        )}
        {(levelCounts[4] ?? 0) > 0 && (
          <span className="metric">
            四级节点 <b>{(levelCounts[4] ?? 0).toLocaleString()}</b> 条
          </span>
        )}
        {(levelCounts[5] ?? 0) > 0 && (
          <span className="metric">
            五级节点 <b>{(levelCounts[5] ?? 0).toLocaleString()}</b> 条
          </span>
        )}
        <span className="metric">
          总数据量 <b>{flattenCount.toLocaleString()}</b> 条
        </span>
        <span className="metric">
          渲染耗时 <b>{renderMs.toFixed(1)} ms</b>
        </span>
        <span className="metric">
          已懒加载 <b>{lazyLoaded}</b> 次
        </span>
      </div>

      {data.length === 0 ? (
        <div className="empty-box">
          <Empty description="请点击上方「生成数据」按钮生成测试数据" />
        </div>
      ) : (
        <Table<TreeNode>
          size="small"
          rowKey="key"
          columns={columns}
          dataSource={data}
          virtual
          scroll={{ y: 560, x: 1200 }}
          pagination={false}
          expandable={{
            expandedRowKeys: expandedKeys,
            onExpandedRowsChange: (keys) => setExpandedKeys([...keys]),
            onExpand: handleExpand,
            rowExpandable: (r) => r.hasChildren,
          }}
        />
      )}
      <div className="panel-tip">
        提示：虚拟滚动按固定行高计算滚动位置，请保持行内容为单行。点击展开图标懒加载子节点数据，收起后数据保留缓存不重复加载。
      </div>
    </div>
  )
}
