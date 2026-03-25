import { formatNumber } from "./format"

export function generateBar(value: number, max: number, length = 16) {
  // Clamp value to [0, max] so the bar never receives out-of-range input
  const safeValue = Math.max(0, Math.min(value, max))
  const safMax = max > 0 ? max : 1 // guard against zero-max divide

  const filled = Math.round((safeValue / safMax) * length)
  const clampedFilled = Math.max(0, Math.min(filled, length))

  return `[${"#".repeat(clampedFilled)}${"-".repeat(length - clampedFilled)}] ${formatNumber(Math.floor(safeValue))}/${formatNumber(safMax)}`
}