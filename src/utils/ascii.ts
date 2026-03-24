import { formatNumber } from "./format"

export function generateBar(value: number, max: number, length = 16) {
  const filled = Math.round((value / max) * length)
  return `[${"#".repeat(filled)}${"-".repeat(length - filled)}] ${formatNumber(Math.floor(value))}/${formatNumber(max)}`
}