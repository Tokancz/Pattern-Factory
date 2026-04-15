<template>
  <Panel title="Admin">
    <div class="admin">

      <!-- User list -->
      <div class="user-list">
        <input v-model="search" placeholder="Search username / email..." class="search" />
        <div
          v-for="u in filteredUsers"
          :key="u.id"
          class="user-row"
          :class="{ selected: selected?.id === u.id }"
          @click="selectUser(u.id)"
        >
          <span class="name">{{ u.username }}</span>
          <span v-if="u.isAdmin" class="admin-badge">ADMIN</span>
        </div>
        <p v-if="filteredUsers.length === 0" class="empty">No users found.</p>
      </div>

      <!-- Detail panel -->
      <div v-if="selected" class="detail">
        <div class="detail-header">
          <div>
            <p class="detail-name">{{ selected.username }}</p>
            <p class="detail-sub">{{ selected.email }}</p>
            <p class="detail-sub">Factory: {{ selected.factoryName }}</p>
            <p class="detail-sub">Joined: {{ new Date(selected.createdAt).toLocaleDateString() }}</p>
          </div>
          <label class="admin-toggle">
            <input type="checkbox" :checked="selected.isAdmin" @change="toggleAdmin" />
            Admin
          </label>
        </div>

        <p class="section-label">GAME VALUES</p>
        <div v-if="form" class="fields">
          <label>
            IGM (Money)
            <input v-model.number="form.money" type="number" min="0" />
          </label>
          <label>
            DC (Dark Coins)
            <input v-model.number="form.dc" type="number" min="0" />
          </label>
          <label>
            Prestige Points
            <input v-model.number="form.prestige_points" type="number" min="0" />
          </label>
          <label>
            Level
            <input v-model.number="form.level" type="number" min="1" />
          </label>
          <label>
            EXP
            <input v-model.number="form.exp" type="number" min="0" />
          </label>
        </div>

        <p v-if="saveError" class="error">{{ saveError }}</p>
        <p v-if="saveSuccess" class="success">Saved.</p>

        <button class="save-btn" :disabled="saving" @click="saveChanges">
          {{ saving ? "Saving…" : "Save Changes" }}
        </button>
      </div>

      <p v-else class="empty-detail">Select a user to edit.</p>

    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import Panel from "@/components/system/Panel.vue"
import { api } from "@/utils/api"

interface AdminUser {
  id: number
  username: string
  email: string
  factoryName: string
  isAdmin: boolean
  createdAt: string
  lastLogin: string
}

interface UserDetail extends AdminUser {
  save: {
    money: number
    dc: number
    prestige_points: number
    level: number
    exp: number
    unlocked_slots: number
  } | null
}

interface SaveForm {
  money: number
  dc: number
  prestige_points: number
  level: number
  exp: number
}

const users       = ref<AdminUser[]>([])
const selected    = ref<UserDetail | null>(null)
const form        = ref<SaveForm | null>(null)
const search      = ref("")
const saving      = ref(false)
const saveError   = ref("")
const saveSuccess = ref(false)

const filteredUsers = computed(() => {
  const q = search.value.toLowerCase()
  if (!q) return users.value
  return users.value.filter(u =>
    u.username.toLowerCase().includes(q) ||
    u.email.toLowerCase().includes(q)
  )
})

onMounted(async () => {
  users.value = await api.get<AdminUser[]>("/admin/users")
})

async function selectUser(id: number) {
  saveError.value   = ""
  saveSuccess.value = false
  const detail = await api.get<UserDetail>(`/admin/users/${id}`)
  selected.value = detail
  form.value = detail.save
    ? { ...detail.save }
    : { money: 0, dc: 0, prestige_points: 0, level: 1, exp: 0 }
}

async function saveChanges() {
  if (!selected.value || !form.value) return
  saving.value      = true
  saveError.value   = ""
  saveSuccess.value = false
  try {
    await api.patch(`/admin/users/${selected.value.id}/save`, form.value)
    saveSuccess.value = true
    // refresh list entry if it carries visible state
    await selectUser(selected.value.id)
  } catch (err) {
    saveError.value = err instanceof Error ? err.message : "Save failed"
  } finally {
    saving.value = false
  }
}

async function toggleAdmin(e: Event) {
  if (!selected.value) return
  const isAdmin = (e.target as HTMLInputElement).checked
  try {
    await api.patch(`/admin/users/${selected.value.id}`, { isAdmin })
    selected.value.isAdmin = isAdmin
    const u = users.value.find(u => u.id === selected.value!.id)
    if (u) u.isAdmin = isAdmin
  } catch (err) {
    alert(err instanceof Error ? err.message : "Failed to update admin status")
    // revert checkbox
    ;(e.target as HTMLInputElement).checked = !isAdmin
  }
}
</script>

<style scoped lang="scss">
.admin {
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  height: 100%;
  overflow: hidden;
}

.user-list {
  @include flexColumn(4px, start, stretch);
  overflow-y: auto;
  border-right: 2px solid var(--primary);
  padding-right: 12px;

  .search {
    margin-bottom: 8px;
    padding: 6px 8px;
    background: transparent;
    border: 1px solid var(--primary);
    color: var(--white);
    font-size: 0.85em;
    width: 100%;
  }

  .user-row {
    padding: 6px 10px;
    cursor: pointer;
    @include flexRow(8px, space-between, center);
    border: 1px solid transparent;
    transition: border-color 0.15s;

    &:hover     { border-color: var(--primary); }
    &.selected  { background: var(--primary); color: var(--black); }

    .name { font-size: 0.9em; }

    .admin-badge {
      font-size: 0.65em;
      letter-spacing: 0.1em;
      padding: 1px 5px;
      border: 1px solid currentColor;
    }
  }
}

.detail {
  @include flexColumn(14px, start, stretch);
  overflow-y: auto;

  .detail-header {
    @include flexRow(0, space-between, start);
  }

  .detail-name { font-size: 1.3em; color: var(--primary); font-weight: bold; }
  .detail-sub  { font-size: 0.8em; opacity: 0.7; }

  .admin-toggle {
    @include flexRow(6px, end, center);
    font-size: 0.85em;
    cursor: pointer;
    input { cursor: pointer; accent-color: var(--primary); }
  }

  .section-label {
    font-size: 0.7em;
    letter-spacing: 0.15em;
    opacity: 0.5;
    border-bottom: 1px solid var(--primary);
    padding-bottom: 4px;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;

    label {
      @include flexColumn(4px, start, stretch);
      font-size: 0.8em;
      opacity: 0.8;

      input {
        padding: 6px 8px;
        background: transparent;
        border: 1px solid var(--primary);
        color: var(--white);
        font-size: 1em;
        width: 100%;
      }
    }
  }

  .error   { color: #f44; font-size: 0.85em; }
  .success { color: #4f4; font-size: 0.85em; }

  .save-btn {
    align-self: flex-start;
    padding: 8px 24px;
    background: var(--primary);
    color: var(--black);
    font-weight: bold;
    cursor: pointer;
    border: none;
    transition: opacity 0.2s;

    &:disabled { opacity: 0.5; cursor: not-allowed; }
  }
}

.empty, .empty-detail {
  font-size: 0.85em;
  opacity: 0.4;
  font-style: italic;
}
</style>
