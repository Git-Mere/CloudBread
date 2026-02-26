import apiGatewaySvg from '../../../assets/node/API GateWay.svg?raw'
import applicationSvg from '../../../assets/node/Application.svg?raw'
import authServiceSvg from '../../../assets/node/Auth Service.svg?raw'
import cacheSvg from '../../../assets/node/Cache.svg?raw'
import databaseSvg from '../../../assets/node/Database.svg?raw'
import loggingServiceSvg from '../../../assets/node/Logging Service.svg?raw'
import messageBrokerSvg from '../../../assets/node/Message Broker.svg?raw'
import monitoringSvg from '../../../assets/node/Monitoring.svg?raw'
import objectStorageSvg from '../../../assets/node/Object Storage.svg?raw'
import serverSvg from '../../../assets/node/Server.svg?raw'
import userSvg from '../../../assets/node/User.svg?raw'

import type { PaletteItem } from './types'
import { colorizeSvg, svgToDataUrl } from './utils/svg'

export const FLOW_WIDTH = 1200
export const FLOW_HEIGHT = 650
export const FALLBACK_NODE_WIDTH = 76
export const FALLBACK_NODE_HEIGHT = 90

const RAW_PALETTE: Omit<PaletteItem, 'previewSrc'>[] = [
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

export const PALETTE: PaletteItem[] = RAW_PALETTE.map((item) => ({
  ...item,
  previewSrc: svgToDataUrl(colorizeSvg(item.svgRaw, item.color)),
}))

export const PALETTE_BY_KEY: Record<string, PaletteItem> = Object.fromEntries(
  PALETTE.map((item) => [item.key, item]),
)
