import { MarkerType } from 'reactflow'
import type { Edge, Node } from 'reactflow'

import { FALLBACK_NODE_HEIGHT, FALLBACK_NODE_WIDTH } from '../constants'
import type { NodeData } from '../types'

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

export const getRectIntersectionPoint = (
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

export const getEdgeEndpoints = (sourceNode: Node<NodeData>, targetNode: Node<NodeData>) => {
  const sourceCenter = getNodeCenter(sourceNode)
  const targetCenter = getNodeCenter(targetNode)

  return {
    start: getRectIntersectionPoint(sourceCenter, targetCenter),
    end: getRectIntersectionPoint(targetCenter, sourceCenter),
  }
}

export const decorateRenderedEdges = (edges: Edge[]) =>
  edges.map((edge) => ({
    ...edge,
    type: 'floating',
    sourceHandle: 'floating',
    targetHandle: 'floating',
    markerEnd: { type: MarkerType.ArrowClosed, color: '#2563eb' },
    style: { stroke: '#2563eb', strokeWidth: 2 },
  }))
