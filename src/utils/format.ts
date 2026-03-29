export function formatNumber(n: number): string {
  if (isNaN(n) || !isFinite(n)) return "0"
  if (n < 0) return "-" + formatNumber(-n)
  if (n < 1000) {
    n = Math.floor(n * 100) / 100
    return n.toString()
  }

  const units = ["k", "M", "B", "T", "Qa", "Qi", "Sx", "Sp", "Oc", "No", "Dc"]
  let i = -1
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000
    i++
  }

  n = Math.floor(n * 100) / 100
  return n + units[i]!
}