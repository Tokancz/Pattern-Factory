<template>
  <Transition name="settings-fade">
    <div
      v-if="open"
      class="settings-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      @click.self="close"
      @keydown.esc="close"
    >
      <div class="settings-panel">
        <h2 id="settings-title">SETTINGS</h2>

        <section class="settings-group">
          <h3>Audio</h3>

          <div class="setting-row">
            <label for="music-vol">Music</label>
            <input
              id="music-vol"
              type="range" min="0" max="100" step="1"
              v-model.number="musicPct"
            >
            <span class="value">{{ musicPct }}%</span>
          </div>

          <div class="setting-row">
            <label for="sfx-vol">Effects</label>
            <input
              id="sfx-vol"
              type="range" min="0" max="100" step="1"
              v-model.number="sfxPct"
              @change="testSfx"
            >
            <span class="value">{{ sfxPct }}%</span>
          </div>
        </section>

        <section class="settings-group">
          <h3>Display</h3>

          <div class="setting-row">
            <label for="anim-toggle">Animations</label>
            <button
              id="anim-toggle"
              type="button"
              role="switch"
              class="switch"
              :class="{ on: animations }"
              :aria-checked="animations"
              @click="animations = !animations"
            >
              <span class="knob" aria-hidden="true"></span>
              <span class="switch-label">{{ animations ? "On" : "Off" }}</span>
            </button>
          </div>
        </section>

        <section class="settings-group">
          <h3>Save data</h3>
          <p class="hint">
            Export your progress to a file or restore it on another device.
            Save files are checksum-protected — edited files won't load.
          </p>

          <div class="save-actions">
            <button type="button" class="button" @click="onExport">Export save</button>
            <button type="button" class="button" @click="triggerImport">Import save</button>
            <input
              ref="fileInput"
              type="file"
              accept=".pfsave,application/json,text/plain"
              hidden
              @change="onImport"
            >
          </div>

          <p v-if="message" class="save-msg" :class="messageType" role="status">
            {{ message }}
          </p>
        </section>

        <button type="button" class="settings-close" @click="close">Close</button>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { ref, computed } from "vue"
import {
  useMusicVolume, useSfxVolume, setMusicVolume, setSfxVolume, playSound
} from "@/utils/sound"
import { useAnimationsEnabled } from "@/composables/settings"
import { exportSave, importSave } from "@/utils/save"

defineProps<{ open: boolean }>()
const emit = defineEmits<{ (e: "close"): void }>()

function close() { emit("close") }

const musicVol  = useMusicVolume()
const sfxVol    = useSfxVolume()
const animations = useAnimationsEnabled()

const musicPct = computed({
  get: () => Math.round(musicVol.value * 100),
  set: v => setMusicVolume(v / 100)
})
const sfxPct = computed({
  get: () => Math.round(sfxVol.value * 100),
  set: v => setSfxVolume(v / 100)
})

// Audible feedback so the player can hear what the effects slider does.
function testSfx() { playSound("pop") }

const fileInput = ref<HTMLInputElement | null>(null)
const message = ref("")
const messageType = ref<"ok" | "error">("ok")

function setMessage(text: string, type: "ok" | "error") {
  message.value = text
  messageType.value = type
}

function onExport() {
  try {
    const contents = exportSave()
    const blob = new Blob([contents], { type: "application/octet-stream" })
    const url = URL.createObjectURL(blob)
    const stamp = new Date().toISOString().slice(0, 10)
    const a = document.createElement("a")
    a.href = url
    a.download = `pattern-factory-${stamp}.pfsave`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMessage("Save exported.", "ok")
  } catch {
    setMessage("Export failed.", "error")
  }
}

function triggerImport() {
  fileInput.value?.click()
}

async function onImport(e: Event) {
  const input = e.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!confirm("Importing will overwrite your current progress. Continue?")) {
    input.value = ""
    return
  }

  try {
    const text = await file.text()
    const result = await importSave(text)
    if (result.ok) {
      setMessage("Save imported successfully.", "ok")
      playSound("victory")
    } else {
      setMessage(result.error ?? "Import failed.", "error")
      playSound("error")
    }
  } catch {
    setMessage("Couldn't read that file.", "error")
    playSound("error")
  } finally {
    input.value = ""
  }
}
</script>

<style scoped lang="scss">
.settings-overlay {
  @include flexColumn(0, center, center);
  position: fixed;
  inset: 0;
  z-index: 800;
  background-color: rgba(0, 0, 0, 0.88);
  backdrop-filter: blur(6px);
  -webkit-backdrop-filter: blur(6px);
}

.settings-panel {
  @include flexColumn(24px, start, stretch);
  width: min(560px, 92vw);
  max-height: 90dvh;
  padding: 36px 44px;
  background-color: var(--black);
  color: var(--white);
  border: 2px solid var(--primary);
  overflow-y: auto;

  @include bp("sm") { padding: 24px 20px; gap: 18px; }

  h2 {
    font-family: "ivy-presto";
    font-size: 2.6em;
    color: var(--primary);
    letter-spacing: 4px;
    text-align: center;

    @include bp("sm") { font-size: 2em; letter-spacing: 2px; }
  }

  .settings-group {
    @include flexColumn(14px, start, stretch);
    border-top: 1px solid var(--primary);
    padding-top: 16px;

    h3 {
      font-size: 1.1em;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: var(--primary);
      opacity: 0.85;
    }

    .hint {
      font-size: 0.9em;
      line-height: 1.45;
      opacity: 0.7;
    }
  }

  .setting-row {
    @include flexRow(16px, space-between, center);

    label {
      flex: 0 0 90px;
      font-size: 1.05em;
    }

    input[type="range"] {
      flex: 1;
      accent-color: var(--primary);
      cursor: pointer;
      height: 4px;
    }

    .value {
      flex: 0 0 48px;
      text-align: end;
      font-variant-numeric: tabular-nums;
      opacity: 0.85;
    }
  }

  // ─── On/off switch ─────────────────────────────────────────────────────
  .switch {
    @include flexRow(8px, start, center);
    position: relative;
    width: 64px;
    height: 30px;
    padding: 0 8px 0 6px;
    background: var(--secondary);
    border: 2px solid var(--primary);
    border-radius: 999px;
    cursor: pointer;
    transition: background-color 0.2s ease;

    .knob {
      position: absolute;
      top: 3px;
      left: 3px;
      width: 20px;
      height: 20px;
      background: var(--white);
      border-radius: 50%;
      transition: transform 0.2s ease, background-color 0.2s ease;
    }

    .switch-label {
      margin-left: auto;
      font-size: 0.75em;
      letter-spacing: 0.05em;
      opacity: 0.85;
    }

    &.on {
      background: var(--primary);
      .knob { transform: translateX(34px); background: var(--black); }
      .switch-label { color: var(--black); margin-left: 0; margin-right: auto; }
    }
  }

  .save-actions {
    @include flexRow(12px, start, center);
    flex-wrap: wrap;

    .button {
      flex: 1;
      min-width: 140px;
      text-align: center;
      border: 2px solid var(--primary);
      background: var(--black);
      color: var(--primary);

      &:hover { background: var(--primary); color: var(--black); box-shadow: none; }
    }
  }

  .save-msg {
    font-size: 0.9em;
    &.ok    { color: var(--primary); }
    &.error { color: var(--error); }
  }

  .settings-close {
    align-self: center;
    margin-top: 4px;
    padding: 12px 32px;
    font-size: 1em;
    font-weight: bold;
    letter-spacing: 0.1em;
    background: var(--primary);
    color: var(--black);
    border: 2px solid var(--primary);
    cursor: pointer;
    transition: 0.2s;

    &:hover { background: var(--black); color: var(--primary); }
  }
}

.settings-fade-enter-active,
.settings-fade-leave-active { transition: opacity 0.25s ease; }
.settings-fade-enter-from,
.settings-fade-leave-to     { opacity: 0; }
</style>
