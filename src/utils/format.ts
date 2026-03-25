export function formatNumber(n: number): string {
  if (n < 1000) {
    n = Math.floor(n * 100) / 100// floor to 2 decimals for small numbers
    return n.toString()
  }
  const units = ["k", "M", "B", "T", "Qa", "Qi"]
  let i = -1
  while (n >= 1000 && i < units.length - 1) {
    n /= 1000
    i++
  }
 
  n = Math.floor(n * 100) / 100 // floor to 2 decimals after scaling

  return n + units[i]
}