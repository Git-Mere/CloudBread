import type { Node } from 'reactflow'

import { FLOW_HEIGHT, FLOW_WIDTH } from '../constants'
import type { NodeData } from '../types'
import { colorizeSvg, svgToDataUrl } from './svg'

export const exportDiagramPng = async (nodes: Node<NodeData>[]) => {
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
}

export const exportDiagramPdfByPrint = (viewport: Element | null) => {
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
}
