import { createRouter, createWebHistory } from "vue-router"

import PatternView from "@/views/PatternView.vue"
import UpgradeView from "@/views/UpgradeView.vue"
import MachineView from "@/views/MachineView.vue"
import InventoryView from "@/views/InventoryView.vue"
import PrestigeView from "@/views/PrestigeView.vue"
import Leaderboard from "@/views/Leaderboard.vue"

const routes = [
  { path: "/",           redirect: "/patterns" },
  { path: "/patterns",   component: PatternView },
  { path: "/upgrades",   component: UpgradeView },
  { path: "/machines",   component: MachineView },
  { path: "/inventory",  component: InventoryView },
  { path: "/prestige",   component: PrestigeView },
  { path: "/leaderboard", component: Leaderboard },
  { path: "/:pathMatch(.*)*", redirect: "/patterns" }
]

export const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes
})
