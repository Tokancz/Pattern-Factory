import { ref } from "vue"

// Tiny module-level toast queue (mirrors the singleton pattern used by
// composables/tutorial.ts and settings.ts). Any module — stores included —
// can push a transient notification without prop-drilling.
export type ToastKind = "info" | "achievement"

export interface Toast {
  id:      number
  message: string
  kind:    ToastKind
  icon?:   string
}

const toasts = ref<Toast[]>([])
let seq = 0

export function useToasts() {
  return toasts
}

export function pushToast(
  message: string,
  kind: ToastKind = "info",
  opts?: { icon?: string; ttl?: number }
): void {
  const id = ++seq
  toasts.value.push({ id, message, kind, icon: opts?.icon })
  const ttl = opts?.ttl ?? 4500
  setTimeout(() => dismissToast(id), ttl)
}

export function dismissToast(id: number): void {
  const i = toasts.value.findIndex(t => t.id === id)
  if (i !== -1) toasts.value.splice(i, 1)
}
