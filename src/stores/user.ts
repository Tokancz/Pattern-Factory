import { defineStore } from "pinia"
import { api } from "@/utils/api"

interface User {
  id: number
  username: string
  email: string
  factoryName: string
  isAdmin?: boolean
}

interface LoginPayload {
  email: string
  password: string
}

interface RegisterPayload {
  username: string
  email: string
  password: string
  factoryName: string
}

interface AuthResponse {
  token: string
  user: User
}

export const useUserStore = defineStore("user", {
  state: () => ({
    user: null as User | null,
    token: localStorage.getItem("token") as string | null,
    loggedIn: false,
    loading: false,
    error: null as string | null
  }),

  actions: {
    async login(payload: LoginPayload) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post<AuthResponse>("/auth/login", payload, false)
        this.token = res.token
        this.user = res.user
        this.loggedIn = true
        localStorage.setItem("token", res.token)
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Login failed"
        throw err
      } finally {
        this.loading = false
      }
    },

    async register(payload: RegisterPayload) {
      this.loading = true
      this.error = null
      try {
        const res = await api.post<AuthResponse>("/auth/register", payload, false)
        this.token = res.token
        this.user = res.user
        this.loggedIn = true
        localStorage.setItem("token", res.token)
      } catch (err) {
        this.error = err instanceof Error ? err.message : "Registration failed"
        throw err
      } finally {
        this.loading = false
      }
    },

    logout() {
      this.user = null
      this.token = null
      this.loggedIn = false
      localStorage.removeItem("token")
    },

    async restoreSession() {
      const token = localStorage.getItem("token")
      if (!token) return

      try {
        const user = await api.get<User>("/auth/me")
        this.user = user
        this.token = token
        this.loggedIn = true
      } catch {
        // Token expired or invalid
        this.logout()
      }
    }
  }
})