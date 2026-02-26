export const colorizeSvg = (rawSvg: string, color: string) =>
  rawSvg.replace('<svg ', `<svg fill="${color}" `)

export const svgToDataUrl = (svg: string) => `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`
