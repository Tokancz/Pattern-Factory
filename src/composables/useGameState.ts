import { ref, computed } from "vue"

export function useGameState() {
  const money = ref(localStorage.getItem("money") ? parseInt(localStorage.getItem("money")!) : 0)
  const dc = ref(localStorage.getItem("dc") ? parseInt(localStorage.getItem("dc")!) : 0)
  const lvl = ref(localStorage.getItem("lvl") ? parseInt(localStorage.getItem("lvl")!) : 1)
  const exp = ref(localStorage.getItem("exp") ? parseInt(localStorage.getItem("exp")!) : 0)
  const expToNextLvl = ref(localStorage.getItem("expToNextLvl") ? parseInt(localStorage.getItem("expToNextLvl")!) : 100)
  const partsSold = ref(localStorage.getItem("partsSold") ? parseInt(localStorage.getItem("partsSold")!) : 0)

  const formattedMoney = computed(() => formatNumber(money.value))
  const formattedPartsSold = computed(() => formatNumber(partsSold.value))

  function gainExp(amount: number) {
    exp.value += amount
    if (exp.value >= expToNextLvl.value) {
      exp.value = 0
      lvl.value++
      expToNextLvl.value = Math.floor(expToNextLvl.value * 1.5)
      money.value += Math.pow(lvl.value, 6)
    }
    localStorage.setItem("exp", exp.value.toString())
    localStorage.setItem("lvl", lvl.value.toString())
    localStorage.setItem("money", money.value.toString())
  }

  function formatNumber(value: number): string {
    value = Math.floor(value)
    if (value < 1000) return value.toString()
    const units = ["k", "M", "B", "T"]
    let unit = -1
    let num = value
    while (num >= 1000 && unit < units.length - 1) {
      num /= 1000
      unit++
    }
    return `${num.toFixed(num < 10 ? 1 : 0)}${units[unit]}`
  }

  return { money, dc, lvl, exp, expToNextLvl, formattedMoney, gainExp, formatNumber, partsSold, formattedPartsSold }
}