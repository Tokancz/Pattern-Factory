import { createRouter, createWebHistory } from "vue-router"

import PatternView from "@/views/PatternView.vue"
import UpgradeView from "@/views/UpgradeView.vue"
import MachineView from "@/views/MachineView.vue"
import InventoryView from "@/views/InventoryView.vue"
import PrestigeView from "@/views/PrestigeView.vue"
import Leaderboard from "@/views/Leaderboard.vue"

const routes = [
  { path: "/", redirect: "/Pattern-Factory/patterns" },

  { path: "/Pattern-Factory/patterns", component: PatternView },
  { path: "/Pattern-Factory/upgrades", component: UpgradeView },
  { path: "/Pattern-Factory/machines", component: MachineView },
  { path: "/Pattern-Factory/inventory", component: InventoryView },
  { path: "/Pattern-Factory/prestige", component: PrestigeView },
  { path: "/Pattern-Factory/leaderboard", component: Leaderboard }
]

export const router = createRouter({
  history: createWebHistory(),
  routes
})