import { useState } from 'react'
import { Alert, Button, Divider, InputNumber, Space, Tag, Typography } from 'antd'
import BigTable from './tableTest/BigTable'
import {
  DEFAULT_SCALE,
  generateTopLevel,
  type ScaleConfig,
  type TreeNode,
} from './tableTest/data'

export default function App() {
  const [scale, setScale] = useState<ScaleConfig>({ ...DEFAULT_SCALE })
  const [lazyDelay, setLazyDelay] = useState(300)
  const [genMs, setGenMs] = useState<number | null>(null)
  const [data, setData] = useState<TreeNode[]>([])
  const [version, setVersion] = useState(0)

  const setNum = (key: keyof ScaleConfig, value: number | null) => {
    setScale((prev) => ({ ...prev, [key]: value ?? 0 }))
  }

  const generateData = () => {
    const t0 = performance.now()
    const result = generateTopLevel(scale)
    setGenMs(performance.now() - t0)
    setData(result)
    setVersion((v) => v + 1)
  }

  return (
    <div className="test-page">
      <header className="test-header">
        <div className="test-header-left">
          <Typography.Title level={4} style={{ margin: 0 }}>
            antd Table 虚拟滚动 + 懒加载 大数据量测试台
          </Typography.Title>
          <Typography.Text type="secondary">
            顶层 {scale.topCount.toLocaleString()} 条 · 每节点 {scale.childCount.toLocaleString()} 个子节点 ·
            最大层级 {scale.maxLevel} 层
          </Typography.Text>
        </div>
      </header>

      <Alert
        className="test-alert"
        type="info"
        showIcon
        message="虚拟滚动 + 懒加载：首屏只渲染顶层数据，点击展开时异步加载子节点，DOM 中仅保留可视区域内的行。"
      />

      <section className="test-config">
        <Space wrap size="middle">
          <label>
            顶层条数
            <InputNumber
              size="small"
              min={1}
              max={200000}
              value={scale.topCount}
              onChange={(v) => setNum('topCount', v)}
            />
          </label>
          <label>
            每节点子级数
            <InputNumber
              size="small"
              min={1}
              max={200000}
              value={scale.childCount}
              onChange={(v) => setNum('childCount', v)}
            />
          </label>
          <label>
            最大层级
            <InputNumber
              size="small"
              min={1}
              max={5}
              value={scale.maxLevel}
              onChange={(v) => setNum('maxLevel', v)}
            />
          </label>
          <label>
            懒加载延迟(ms)
            <InputNumber
              size="small"
              min={0}
              max={5000}
              value={lazyDelay}
              onChange={(v) => setLazyDelay(v ?? 300)}
            />
          </label>
          <Button size="small" type="primary" onClick={generateData}>
            生成数据
          </Button>
          {genMs !== null && (
            <Tag color="blue">数据生成耗时 {genMs.toFixed(2)} ms</Tag>
          )}
        </Space>
        <Typography.Text type="warning" className="test-warn">
          提示：数据按需生成——只有节点被展开时才创建其子级数组。每个父节点展开后加载
          {scale.childCount.toLocaleString()} 个子节点，懒加载避免了浏览器内存溢出。
        </Typography.Text>
      </section>

      <Divider style={{ margin: '12px 0' }} />

      <BigTable key={version} scale={scale} lazyDelay={lazyDelay} data={data} />
    </div>
  )
}
