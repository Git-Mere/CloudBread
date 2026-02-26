import { useCallback, useMemo, useRef, useState } from 'react'
import ReactFlow, {
  Background,
  BackgroundVariant,
  Controls,
  MiniMap,
  useEdgesState,
  useNodesState,
} from 'reactflow'
import type { DragEvent, MouseEvent } from 'react'
import type { Edge, Node, ReactFlowInstance } from 'reactflow'
import 'reactflow/dist/style.css'
import './App.css'

import { NodeControlsPanel } from './features/diagram/components/NodeControlsPanel'
import { Palette } from './features/diagram/components/Palette'
import { PALETTE, PALETTE_BY_KEY } from './features/diagram/constants'
import { EDGE_TYPES, NODE_TYPES } from './features/diagram/reactflowConfig'
import type { NodeData } from './features/diagram/types'
import { decorateRenderedEdges } from './features/diagram/utils/edge'
import { exportDiagramPdfByPrint, exportDiagramPng } from './features/diagram/utils/export'

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
  const targetNodeIdSet = useMemo(() => new Set(targetNodeIds), [targetNodeIds])

  const activeNodeIds = useMemo(
    () => new Set([...(sourceNodeId ? [sourceNodeId] : []), ...targetNodeIds]),
    [sourceNodeId, targetNodeIds],
  )

  const renderedNodes = useMemo(
    () =>
      nodes.map((node) => {
        const nextRole =
          sourceNodeId === node.id ? 'source' : targetNodeIdSet.has(node.id) ? 'target' : 'none'
        if (node.data.connectionRole === nextRole) return node
        return {
          ...node,
          data: {
            ...node.data,
            connectionRole: nextRole,
          },
        }
      }),
    [nodes, sourceNodeId, targetNodeIdSet],
  )

  const renderedEdges = useMemo(() => decorateRenderedEdges(edges), [edges])

  const canDisconnect = useMemo(() => {
    if (!sourceNodeId || targetNodeIds.length === 0) return false
    return targetNodeIds.some((targetId) =>
      edges.some((edge) => edge.source === sourceNodeId && edge.target === targetId),
    )
  }, [edges, sourceNodeId, targetNodeIds])

  const clearSelection = useCallback(() => {
    setSourceNodeId(null)
    setTargetNodeIds([])
  }, [])

  const createNode = useCallback(
    (paletteKey: string, x: number, y: number) => {
      const palette = PALETTE_BY_KEY[paletteKey]
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

  const handlePaletteDragStart = (event: DragEvent<HTMLDivElement>, key: string) => {
    event.dataTransfer.setData('application/x-palette-key', key)
    event.dataTransfer.effectAllowed = 'copy'
  }

  const handleCanvasDrop = (event: DragEvent<HTMLDivElement>) => {
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
        prev.map((node) => {
          if (node.id !== sourceNodeId || node.data.color === color) return node
          return { ...node, data: { ...node.data, color } }
        }),
      )
    },
    [setNodes, sourceNodeId],
  )

  const onChangeSelectedLabel = useCallback(
    (label: string) => {
      if (!sourceNodeId) return
      setNodes((prev: Node<NodeData>[]) =>
        prev.map((node) => {
          if (node.id !== sourceNodeId || node.data.label === label) return node
          return { ...node, data: { ...node.data, label } }
        }),
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
    clearSelection()
  }, [activeNodeIds, clearSelection, setEdges, setNodes])

  const onNodeClick = useCallback(
    (_event: MouseEvent, node: Node<NodeData>) => {
      if (!sourceNodeId) {
        setSourceNodeId(node.id)
        setTargetNodeIds([])
        return
      }

      if (node.id === sourceNodeId) {
        clearSelection()
        return
      }

      setTargetNodeIds((prev) =>
        prev.includes(node.id) ? prev.filter((id) => id !== node.id) : [...prev, node.id],
      )
    },
    [clearSelection, sourceNodeId],
  )

  const connectSelected = useCallback(() => {
    if (!sourceNodeId || targetNodeIds.length === 0) return

    setEdges((prev: Edge[]) => {
      const next = [...prev]
      for (const targetId of targetNodeIds) {
        const exists = next.some((edge) => edge.source === sourceNodeId && edge.target === targetId)
        if (!exists) {
          next.push({
            id: `edge-${sourceNodeId}-${targetId}`,
            source: sourceNodeId,
            target: targetId,
          })
        }
      }
      return next
    })

    clearSelection()
  }, [clearSelection, setEdges, sourceNodeId, targetNodeIds])

  const disconnectSelected = useCallback(() => {
    if (!sourceNodeId || targetNodeIds.length === 0) return

    setEdges((prev: Edge[]) =>
      prev.filter(
        (edge) => !(edge.source === sourceNodeId && targetNodeIdSet.has(edge.target)),
      ),
    )

    clearSelection()
  }, [clearSelection, setEdges, sourceNodeId, targetNodeIdSet, targetNodeIds.length])

  const exportPng = useCallback(async () => {
    await exportDiagramPng(nodes)
  }, [nodes])

  const exportPdfByPrint = useCallback(() => {
    const viewport = flowWrapperRef.current?.querySelector('.react-flow__viewport')
    exportDiagramPdfByPrint(viewport ?? null)
  }, [])

  const clearAll = useCallback(() => {
    setNodes([])
    setEdges([])
    clearSelection()
  }, [clearSelection, setEdges, setNodes])

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

      <Palette items={PALETTE} onDragStart={handlePaletteDragStart} />

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

        <NodeControlsPanel
          sourceNode={sourceNode}
          sourceNodeId={sourceNodeId}
          targetCount={targetNodeIds.length}
          canDisconnect={canDisconnect}
          onChangeLabel={onChangeSelectedLabel}
          onChangeColor={onChangeSelectedColor}
          onConnect={connectSelected}
          onDisconnect={disconnectSelected}
        />
      </main>
    </div>
  )
}

export default App
