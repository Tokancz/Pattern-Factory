import { createApp } from "vue"
import { createPinia } from "pinia"
import App from "./App.vue"
import { router } from "./router"
// Side-effect import: applies the persisted animations preference to <html>
// before first paint (and respects prefers-reduced-motion on first visit).
import "./composables/settings"

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

app.mount("#app")