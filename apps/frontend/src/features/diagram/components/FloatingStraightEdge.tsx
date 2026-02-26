import { BaseEdge, getStraightPath, useReactFlow } from 'reactflow'
import type { EdgeProps } from 'reactflow'

import type { NodeData } from '../types'
import { getEdgeEndpoints } from '../utils/edge'

export const FloatingStraightEdge = ({ id, source, target, markerEnd, style }: EdgeProps) => {
  const { getNode } = useReactFlow<NodeData>()
  const sourceNode = getNode(source)
  const targetNode = getNode(target)

  if (!sourceNode || !targetNode) return null

  const { start, end } = getEdgeEndpoints(sourceNode, targetNode)
  const [path] = getStraightPath({
    sourceX: start.x,
    sourceY: start.y,
    targetX: end.x,
    targetY: end.y,
  })

  return <BaseEdge id={id} path={path} markerEnd={markerEnd} style={style} />
}
