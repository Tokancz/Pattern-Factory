import { createRouter, createWebHistory } from "vue-router"
import { playSound } from "@/utils/sound"

import PatternView from "@/views/PatternView.vue"
import UpgradeView from "@/views/UpgradeView.vue"
import SynergyView from "@/views/SynergyView.vue"
import MachineView from "@/views/MachineView.vue"
import InventoryView from "@/views/InventoryView.vue"
import PrestigeView from "@/views/PrestigeView.vue"
import Leaderboard from "@/views/Leaderboard.vue"
import AdminView from "@/views/AdminView.vue"

const routes = [
  { path: "/",           redirect: "/patterns" },
  { path: "/patterns",   component: PatternView },
  { path: "/upgrades",   component: UpgradeView },
  { path: "/synergies",  component: SynergyView },
  { path: "/machines",   component: MachineView },
  { path: "/inventory",  component: InventoryView },
  { path: "/prestige",   component: PrestigeView },
  { path: "/leaderboard", component: Leaderboard },
  {
    path: "/admin",
    component: AdminView,
    beforeEnter: () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return "/patterns"
        const part = token.split(".")[1]
        if (!part) return "/patterns"
        const payload = JSON.parse(atob(part))
        if (!payload.isAdmin) return "/patterns"
      } catch {
        return "/patterns"
      }
    }
  },
  { path: "/:pathMatch(.*)*", redirect: "/patterns" }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})

router.afterEach((to, from) => {
  if (from.path && to.path !== from.path) playSound("tabClick")
})
