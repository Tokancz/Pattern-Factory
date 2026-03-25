import { defineStore } from "pinia"
import { saveGame } from "@/utils/save"

export const useUserStore = defineStore("user", {
  state: () => ({
    username: "",
    factoryName: "",
    loggedIn: false
  }),
  actions: {
    login(username: string, factoryName: string) {
      this.username = username
      this.factoryName = factoryName
      this.loggedIn = true
      saveGame() // optionally save immediately
    }
  }
})