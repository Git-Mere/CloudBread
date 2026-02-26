import { memo } from 'react'
import type { DragEvent } from 'react'

import type { PaletteItem } from '../types'

type PaletteProps = {
  items: PaletteItem[]
  onDragStart: (event: DragEvent<HTMLDivElement>, key: string) => void
}

const PaletteComponent = ({ items, onDragStart }: PaletteProps) => (
  <section className="palette">
    {items.map((item) => (
      <div
        key={item.key}
        className="palette-item"
        draggable
        onDragStart={(event) => onDragStart(event, item.key)}
      >
        <img className="icon-chip" src={item.previewSrc} alt={item.label} draggable={false} />
        <strong>{item.label}</strong>
      </div>
    ))}
  </section>
)

export const Palette = memo(PaletteComponent)
