import { memo } from 'react'
import type { Node } from 'reactflow'

import type { NodeData } from '../types'

type NodeControlsPanelProps = {
  sourceNode: Node<NodeData> | null
  sourceNodeId: string | null
  targetCount: number
  canDisconnect: boolean
  onChangeLabel: (label: string) => void
  onChangeColor: (color: string) => void
  onConnect: () => void
  onDisconnect: () => void
}

const NodeControlsPanelComponent = ({
  sourceNode,
  sourceNodeId,
  targetCount,
  canDisconnect,
  onChangeLabel,
  onChangeColor,
  onConnect,
  onDisconnect,
}: NodeControlsPanelProps) => (
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
            onChange={(event) => onChangeLabel(event.target.value)}
            placeholder="Node label"
          />
        </label>
        <label className="color-picker-inline panel-field">
          Color
          <input
            type="color"
            value={sourceNode.data.color}
            onChange={(event) => onChangeColor(event.target.value)}
          />
        </label>
        <div className="panel-buttons">
          <button onClick={onConnect} disabled={!sourceNodeId || targetCount === 0}>
            Connect
          </button>
          <button onClick={onDisconnect} disabled={!canDisconnect}>
            Disconnect
          </button>
        </div>
      </>
    )}
  </aside>
)

export const NodeControlsPanel = memo(NodeControlsPanelComponent)
