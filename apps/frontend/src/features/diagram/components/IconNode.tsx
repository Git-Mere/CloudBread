import { memo, useMemo } from 'react'
import { Handle, Position } from 'reactflow'
import type { NodeProps } from 'reactflow'

import type { NodeData } from '../types'
import { colorizeSvg, svgToDataUrl } from '../utils/svg'

const IconNodeComponent = ({ data }: NodeProps<NodeData>) => {
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

export const IconNode = memo(IconNodeComponent)
