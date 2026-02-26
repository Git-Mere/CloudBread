export type NodeData = {
  label: string
  color: string
  iconKey: string
  svgRaw: string
  connectionRole?: 'none' | 'source' | 'target'
}

export type PaletteItem = {
  key: string
  label: string
  svgRaw: string
  color: string
  previewSrc: string
}
