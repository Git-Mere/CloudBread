import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  BaseEdge,
  Background,
  BackgroundVariant,
  Controls,
  Handle,
  getStraightPath,
  MarkerType,
  MiniMap,
  Position,
  useReactFlow,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import type { Edge, EdgeProps, Node, NodeProps, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import './App.css'

import apiGatewaySvg from '../assets/node/API GateWay.svg?raw'
import applicationSvg from '../assets/node/Application.svg?raw'
import authServiceSvg from '../assets/node/Auth Service.svg?raw'
import cacheSvg from '../assets/node/Cache.svg?raw'
import databaseSvg from '../assets/node/Database.svg?raw'
import loggingServiceSvg from '../assets/node/Logging Service.svg?raw'
import messageBrokerSvg from '../assets/node/Message Broker.svg?raw'
import monitoringSvg from '../assets/node/Monitoring.svg?raw'
import objectStorageSvg from '../assets/node/Object Storage.svg?raw'
import serverSvg from '../assets/node/Server.svg?raw'
import userSvg from '../assets/node/User.svg?raw'

type NodeData = {
  label: string
  color: string
  iconKey: string
  svgRaw: string
  connectionRole?: 'none' | 'source' | 'target'
}

type PaletteItem = {
  key: string
  label: string
  svgRaw: string
  color: string
}

const PALETTE: PaletteItem[] = [
  { key: 'Application', label: 'Application', svgRaw: applicationSvg, color: '#2563eb' },
  { key: 'API GateWay', label: 'API Gateway', svgRaw: apiGatewaySvg, color: '#16a34a' },
  { key: 'Database', label: 'Database', svgRaw: databaseSvg, color: '#0ea5e9' },
  { key: 'Server', label: 'Server', svgRaw: serverSvg, color: '#6366f1' },
  { key: 'Cache', label: 'Cache', svgRaw: cacheSvg, color: '#f59e0b' },
  { key: 'Message Broker', label: 'Message Broker', svgRaw: messageBrokerSvg, color: '#f97316' },
  { key: 'Object Storage', label: 'Object Storage', svgRaw: objectStorageSvg, color: '#06b6d4' },
  { key: 'Auth Service', label: 'Auth Service', svgRaw: authServiceSvg, color: '#7c3aed' },
  { key: 'Logging Service', label: 'Logging Service', svgRaw: loggingServiceSvg, color: '#ef4444' },
  { key: 'Monitoring', label: 'Monitoring', svgRaw: monitoringSvg, color: '#10b981' },
  { key: 'User', label: 'User', svgRaw: userSvg, color: '#334155' },
]

const FLOW_WIDTH = 1200
const FLOW_HEIGHT = 650
const FALLBACK_NODE_WIDTH = 76
const FALLBACK_NODE_HEIGHT = 90

const colorizeSvg = (rawSvg: string, color: string) =>
  rawSvg.replace('<svg ', `<svg fill="${color}" `)

const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`

const getNodeCenter = (node: Node<NodeData>) => {
  const width = node.width ?? FALLBACK_NODE_WIDTH
  const height = node.height ?? FALLBACK_NODE_HEIGHT
  const pos = node.positionAbsolute ?? node.position
  return {
    x: pos.x + width / 2,
    y: pos.y + height / 2,
    width,
    height,
  }
}

const getRectIntersectionPoint = (
  center: { x: number; y: number; width: number; height: number },
  target: { x: number; y: number },
) => {
  const dx = target.x - center.x
  const dy = target.y - center.y

  if (dx === 0 && dy === 0) {
    return { x: center.x, y: center.y }
  }

  const halfW = center.width / 2
  const halfH = center.height / 2
  const scale = 1 / Math.max(Math.abs(dx) / halfW, Math.abs(dy) / halfH)

  return {
    x: center.x + dx * scale,
    y: center.y + dy * scale,
  }
}

const FloatingStraightEdge = ({ id, source, target, markerEnd, style }: EdgeProps) => {
  const { getNode } = useReactFlow<NodeData>()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  if (!sourceNode || !targetNode) return null

  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)

  const start = getRectIntersectionPoint(sourceCenter, targetCenter)
  const end = getRectIntersectionPoint(targetCenter, sourceCenter)
  const [path] = getStraightPath({
    sourceX: start.x,
    sourceY: start.y,
    targetX: end.x,
    targetY: end.y,
  })

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
}

const IconNode = ({ data }: NodeProps<NodeData>) => {
  const iconSrc = useMemo(() => svgToDataUrl(colorizeSvg(data.svgRaw, data.color)), [data.color, data.svgRaw])

  return (
    <div className="shape-node-wrap">
      <Handle id="floating" type="target" position={Position.Top} className="hidden-handle" />
      <div className={`icon-node ${data.connectionRole ?? 'none'}`}>
        <img className="icon-image" src={iconSrc} alt={data.label} draggable={false} />
      </div>
      <div className="node-label">{data.label}</div>
      <Handle id="floating" type="source" position={Position.Top} className="hidden-handle" />
    </div>
  )
}

const NODE_TYPES = {
  iconNode: IconNode,
}

const EDGE_TYPES = {
  floating: FloatingStraightEdge,
}

function App() {
  const [nodes, setNodes, onNodesChange] = useNodesState<NodeData>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([])
  const flowWrapperRef = useRef<HTMLDivElement | null>(null)
  const [reactFlowInstance, setReactFlowInstance] = useState<ReactFlowInstance | null>(null)
  const nodeTypes = useMemo(() => NODE_TYPES, [])
  const edgeTypes = useMemo(() => EDGE_TYPES, [])
  const [sourceNodeId, setSourceNodeId] = useState<string | null>(null)
  const [targetNodeIds, setTargetNodeIds] = useState<string[]>([])

  const sourceNode = useMemo(
    () => (sourceNodeId ? nodes.find((node) => node.id === sourceNodeId) ?? null : null),
    [nodes, sourceNodeId],
  )
  const activeNodeIds = useMemo(
    () => new Set([...(sourceNodeId ? [sourceNodeId] : []), ...targetNodeIds]),
    [sourceNodeId, targetNodeIds],
  )

  const renderedNodes = useMemo(
    () =>
      nodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          connectionRole:
            sourceNodeId === node.id ? 'source' : targetNodeIds.includes(node.id) ? 'target' : 'none',
        },
      })),
    [nodes, sourceNodeId, targetNodeIds],
  )

  const renderedEdges = useMemo(() => {
    return edges.map((edge) => {
      return {
        ...edge,
        type: 'floating',
        sourceHandle: 'floating',
        targetHandle: 'floating',
        markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' },
        style: { stroke: '#2563eb', strokeWidth: 2 },
      }
    })
  }, [edges])

  const canDisconnect = useMemo(() => {
    if (!sourceNodeId || targetNodeIds.length === 0) return false
    return targetNodeIds.some((targetId) =>
      edges.some((edge) => edge.source === sourceNodeId && edge.target === targetId),
    )
  }, [edges, sourceNodeId, targetNodeIds])

  const createNode = useCallback(
    (paletteKey: string, x: number, y: number) => {
      const palette = PALETTE.find((item) => item.key === paletteKey)
      if (!palette) return

      const newNode: Node<NodeData> = {
        id: `${palette.key}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        type: 'iconNode',
        position: { x, y },
        data: {
          label: palette.label,
          color: palette.color,
          iconKey: palette.key,
          svgRaw: palette.svgRaw,
          connectionRole: 'none',
        },
      }

      setNodes((prev: Node<NodeData>[]) => [...prev, newNode])
    },
    [setNodes],
  )

  const handlePaletteDragStart = (event: React.DragEvent<HTMLDivElement>, key: string) => {
    event.dataTransfer.setData('application/x-palette-key', key)
    event.dataTransfer.effectAllowed = 'copy'
  }

  const handleCanvasDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault()
    const paletteKey = event.dataTransfer.getData('application/x-palette-key')
    if (!paletteKey || !reactFlowInstance) return

    const position = reactFlowInstance.screenToFlowPosition({
      x: event.clientX,
      y: event.clientY,
    })

    createNode(paletteKey, position.x, position.y)
  }

  const onChangeSelectedColor = useCallback(
    (color: string) => {
      if (!sourceNodeId) return
      setNodes((prev: Node<NodeData>[]) =>
        prev.map((node) =>
          node.id === sourceNodeId ? { ...node, data: { ...node.data, color } } : node,
        ),
      )
    },
    [setNodes, sourceNodeId],
  )

  const onChangeSelectedLabel = useCallback(
    (label: string) => {
      if (!sourceNodeId) return
      setNodes((prev: Node<NodeData>[]) =>
        prev.map((node) =>
          node.id === sourceNodeId ? { ...node, data: { ...node.data, label } } : node,
        ),
      )
    },
    [setNodes, sourceNodeId],
  )

  const deleteSelected = useCallback(() => {
    if (activeNodeIds.size === 0) return
    setNodes((prev: Node<NodeData>[]) => prev.filter((node) => !activeNodeIds.has(node.id)))
    setEdges((prev: Edge[]) =>
      prev.filter((edge) => !activeNodeIds.has(edge.source) && !activeNodeIds.has(edge.target)),
    )
    setSourceNodeId(null)
    setTargetNodeIds([])
  }, [activeNodeIds, setEdges, setNodes])

  const onNodeClick = useCallback(
    (_event: React.MouseEvent, node: Node<NodeData>) => {
      if (!sourceNodeId) {
        setSourceNodeId(node.id)
        setTargetNodeIds([])
        return
      }

      if (node.id === sourceNodeId) {
        setSourceNodeId(null)
        setTargetNodeIds([])
        return
      }

      setTargetNodeIds((prev) =>
        prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id],
      )
    },
    [sourceNodeId],
  )

  const connectSelected = useCallback(() => {
    if (!sourceNodeId || targetNodeIds.length === 0) return

    setEdges((prev: Edge[]) => {
      const next = [...prev]
      for (const targetId of targetNodeIds) {
        const exists = next.some((edge) => edge.source === sourceNodeId && edge.target === targetId)
        if (exists) continue
        next.push({
          id: `edge-${sourceNodeId}-${targetId}`,
          source: sourceNodeId,
          target: targetId,
        })
      }
      return next
    })

    setSourceNodeId(null)
    setTargetNodeIds([])
  }, [setEdges, sourceNodeId, targetNodeIds])

  const disconnectSelected = useCallback(() => {
    if (!sourceNodeId || targetNodeIds.length === 0) return

    setEdges((prev: Edge[]) =>
      prev.filter(
        (edge) => !(edge.source === sourceNodeId && targetNodeIds.includes(edge.target)),
      ),
    )
    setSourceNodeId(null)
    setTargetNodeIds([])
  }, [setEdges, sourceNodeId, targetNodeIds])

  const exportPng = useCallback(async () => {
    const exportSvg = `
      <svg xmlns="http://www.w3.org/2000/svg" width="${FLOW_WIDTH}" height="${FLOW_HEIGHT}" viewBox="0 0 ${FLOW_WIDTH} ${FLOW_HEIGHT}">
        <rect width="100%" height="100%" fill="#ffffff"/>
        ${nodes
          .map((node) => {
            const x = node.position.x + 70
            const y = node.position.y + 45
            const { label, svgRaw, color } = node.data
            const coloredIcon = svgToDataUrl(colorizeSvg(svgRaw, color))
            return `
              <image href="${coloredIcon}" x="${x - 30}" y="${y - 30}" width="60" height="60" />
              <text x="${x}" y="${y + 52}" font-size="13" font-family="Arial" font-weight="600" fill="#0f172a" text-anchor="middle">${label}</text>
            `
          })
          .join('')}
      </svg>
    `

    const blob = new Blob([exportSvg], { type: 'image/svg+xml;charset=utf-8' })
    const blobUrl = URL.createObjectURL(blob)

    try {
      const image = new Image()
      await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve()
        image.onerror = () => reject(new Error('PNG export failed'))
        image.src = blobUrl
      })

      const canvas = document.createElement('canvas')
      canvas.width = FLOW_WIDTH
      canvas.height = FLOW_HEIGHT
      const ctx = canvas.getContext('2d')
      if (!ctx) return
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, FLOW_WIDTH, FLOW_HEIGHT)
      ctx.drawImage(image, 0, 0)

      const link = document.createElement('a')
      link.download = 'cloud-diagram.png'
      link.href = canvas.toDataURL('image/png')
      link.click()
    } finally {
      URL.revokeObjectURL(blobUrl)
    }
  }, [nodes])

  const exportPdfByPrint = useCallback(() => {
    const viewport = flowWrapperRef.current?.querySelector('.react-flow__viewport')
    if (!viewport) return

    const popup = window.open('', '_blank', 'width=1400,height=900')
    if (!popup) return

    popup.document.write(`
      <!doctype html>
      <html>
      <head>
        <title>Cloud Diagram</title>
        <style>
          body { margin: 0; font-family: Arial, sans-serif; background: #ffffff; padding: 24px; }
          .title { margin-bottom: 12px; font-size: 16px; color: #0f172a; font-weight: 700; }
          .canvas { width: ${FLOW_WIDTH}px; height: ${FLOW_HEIGHT}px; border: 1px solid #e2e8f0; overflow: hidden; }
          .react-flow__controls, .react-flow__minimap { display: none !important; }
        </style>
      </head>
      <body>
        <div class="title">CloudBread Diagram Export</div>
        <div class="canvas">${viewport.innerHTML}</div>
        <script>window.onload = () => window.print();</script>
      </body>
      </html>
    `)
    popup.document.close()
  }, [])

  const clearAll = useCallback(() => {
    setNodes([])
    setEdges([])
    setSourceNodeId(null)
    setTargetNodeIds([])
  }, [setEdges, setNodes])

  return (
    <div className="app-shell">
      <header className="topbar">
        <div className="brand">
          <h1>CloudBread Diagram Tool</h1>
          <p>상단 SVG 아이콘을 드래그해 캔버스에 배치하고, 선택 후 색상 변경 가능합니다.</p>
        </div>

        <div className="toolbar">
          <button onClick={exportPng}>PNG Export</button>
          <button onClick={exportPdfByPrint}>PDF Export</button>
          <button onClick={deleteSelected} disabled={activeNodeIds.size === 0}>
            Delete Selected
          </button>
          <button onClick={clearAll}>Clear</button>
        </div>
      </header>

      <section className="palette">
        {PALETTE.map((item) => {
          const paletteSrc = svgToDataUrl(colorizeSvg(item.svgRaw, item.color))
          return (
            <div
              key={item.key}
              className="palette-item"
              draggable
              onDragStart={(event) => handlePaletteDragStart(event, item.key)}
            >
              <img className="icon-chip" src={paletteSrc} alt={item.label} draggable={false} />
              <strong>{item.label}</strong>
            </div>
          )
        })}
      </section>

      <main className="workspace">
        <div className="canvas-panel">
          <div
            ref={flowWrapperRef}
            className="flow-wrapper"
            onDrop={handleCanvasDrop}
            onDragOver={(event) => event.preventDefault()}
          >
            <ReactFlow
              nodes={renderedNodes}
              edges={renderedEdges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onInit={setReactFlowInstance}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
            >
              <Background variant={BackgroundVariant.Dots} gap={48} size={2.8} color="#94a3b8" />
              <Controls />
              <MiniMap />
            </ReactFlow>
          </div>
        </div>

        <aside className="json-panel controls-panel">
          <h2>Node Controls</h2>
          <p>파란 노드 1개와 빨간 타깃 노드를 선택해 연결/해제를 수행하세요.</p>
          {!sourceNode && <div className="empty-state">먼저 소스 노드를 하나 선택하세요.</div>}

          {sourceNode && (
            <>
              <label className="text-input-inline panel-field">
                Label
                <input
                  type="text"
                  value={sourceNode.data.label}
                  onChange={(event) => onChangeSelectedLabel(event.target.value)}
                  placeholder="Node label"
                />
              </label>
              <label className="color-picker-inline panel-field">
                Color
                <input
                  type="color"
                  value={sourceNode.data.color}
                  onChange={(event) => onChangeSelectedColor(event.target.value)}
                />
              </label>
              <div className="panel-buttons">
                <button
                  onClick={connectSelected}
                  disabled={!sourceNodeId || targetNodeIds.length === 0}
                >
                  Connect
                </button>
                <button onClick={disconnectSelected} disabled={!canDisconnect}>
                  Disconnect
                </button>
              </div>
            </>
          )}
        </aside>
      </main>
    </div>
  )
}

export default App
