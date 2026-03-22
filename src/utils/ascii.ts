export function generateBar(value: number, max: number, length = 16) {
  const filled = Math.round((value / max) * length)
  return `CREATING PART [${"#".repeat(filled)}${"-".repeat(length - filled)}] ${Math.floor(value)}/${max}`
}