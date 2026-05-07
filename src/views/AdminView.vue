<template>
  <Panel title="Admin">
    <div class="admin">

      <!-- User list -->
      <nav class="user-list" aria-label="Users">
        <label for="user-search" class="sr-only">Search users</label>
        <input
          id="user-search"
          v-model="search"
          type="search"
          placeholder="Search username / email..."
          class="search"
        />
        <ul role="listbox" aria-label="User list">
          <li
            v-for="u in filteredUsers"
            :key="u.id"
            role="option"
            :aria-selected="selected?.id === u.id"
          >
            <button
              class="user-row"
              :class="{ selected: selected?.id === u.id }"
              @click="selectUser(u.id)"
            >
              <span class="name">{{ u.username }}</span>
              <span v-if="u.isAdmin" class="admin-badge" aria-label="Admin user">ADMIN</span>
            </button>
          </li>
        </ul>
        <p v-if="filteredUsers.length === 0" class="empty">No users found.</p>
      </nav>

      <!-- Detail panel -->
      <section v-if="selected" class="detail" :aria-label="`Editing ${selected.username}`">
        <header class="detail-header">
          <div>
            <h2 class="detail-name">{{ selected.username }}</h2>
            <dl class="detail-meta">
              <dt>Email</dt>    <dd>{{ selected.email }}</dd>
              <dt>Factory</dt>  <dd>{{ selected.factoryName }}</dd>
              <dt>Joined</dt>   <dd>{{ new Date(selected.createdAt).toLocaleDateString() }}</dd>
            </dl>
          </div>
          <label class="admin-toggle">
            <input type="checkbox" :checked="selected.isAdmin" @change="toggleAdmin" />
            Admin
          </label>
        </header>

        <form v-if="form" class="game-values" @submit.prevent="saveChanges">
          <h3 class="section-label">Game Values</h3>
          <div class="fields">
            <label for="field-money">IGM (Money)
              <input id="field-money"       v-model.number="form.money"           type="number" min="0" />
            </label>
            <label for="field-dc">DC (Dark Coins)
              <input id="field-dc"          v-model.number="form.dc"              type="number" min="0" />
            </label>
            <label for="field-prestige">Prestige Points
              <input id="field-prestige"    v-model.number="form.prestige_points" type="number" min="0" />
            </label>
            <label for="field-level">Level
              <input id="field-level"       v-model.number="form.level"           type="number" min="1" />
            </label>
            <label for="field-exp">EXP
              <input id="field-exp"         v-model.number="form.exp"             type="number" min="0" />
            </label>
          </div>

          <p v-if="saveError"   role="alert" class="error">{{ saveError }}</p>
          <p v-if="saveSuccess" role="status" class="success">Saved.</p>

          <button type="submit" class="save-btn" :disabled="saving">
            {{ saving ? "Saving…" : "Save Changes" }}
          </button>
        </form>
      </section>

      <p v-else class="empty-detail">Select a user to edit.</p>

    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue"
import Panel from "@/components/system/Panel.vue"
import { api } from "@/utils/api"
import { useUserStore } from "@/stores/user"
import { loadGame } from "@/utils/save"

const userStore = useUserStore()

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
    // If we just edited our own save, resync the running game session so
    // the next autosave doesn't collide with the bumped save_version.
    if (selected.value.id === userStore.user?.id) {
      await loadGame()
    }
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
.sr-only { @include sr-only; }

.admin {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-columns: 220px 1fr;
  gap: 20px;
  overflow: hidden;

  // Stack the user list above the detail panel on narrow screens — at 220px
  // fixed sidebar width the detail column would otherwise be unusable.
  @include bp("md") {
    grid-template-columns: 1fr;
    grid-template-rows: minmax(120px, 30%) 1fr;
    gap: 12px;
  }
}

.user-list {
  @include flexColumn(4px, start, stretch);
  @include scrollbar;
  overflow-y: auto;
  border-right: 2px solid var(--primary);
  padding-right: 12px;

  @include bp("md") {
    border-right: none;
    border-bottom: 2px solid var(--primary);
    padding-right: 0;
    padding-bottom: 8px;
  }

  .search {
    @include input-bare;
    margin-bottom: 8px;
    padding: 6px 8px;
    font-size: 0.85em;
    width: 100%;
  }

  ul {
    @include list-reset;
    @include flexColumn(4px, start, stretch);
  }

  li { display: contents; }

  .user-row {
    @include flexRow(8px, space-between, center);
    width: 100%;
    padding: 6px 10px;
    cursor: pointer;
    background: transparent;
    color: var(--white);
    border: 1px solid transparent;
    transition: border-color 0.15s;

    &:hover, &:focus-visible { border-color: var(--primary); outline: none; }
    &.selected               { background: var(--primary); color: var(--black); }

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
  @include scrollbar;
  overflow-y: auto;

  .detail-header {
    @include flexRow(0, space-between, start);
    flex-wrap: wrap;
    gap: 12px;
  }

  .detail-name {
    font-size: 1.75em;
    color: var(--primary);
    font-weight: bold;
    margin-bottom: 6px;
  }

  .detail-meta {
    display: grid;
    grid-template-columns: auto 1fr;
    gap: 2px 10px;
    font-size: 1em;
    opacity: 0.7;

    dt { font-size: 1.2em; opacity: 1; }
  }

  .admin-toggle {
    @include flexRow(6px, end, center);
    font-size: 0.85em;
    cursor: pointer;
    input { cursor: pointer; accent-color: var(--primary); }
  }

  .game-values { @include flexColumn(14px, start, stretch); }

  .section-label { @include section-label; }

  .fields {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
    gap: 12px;

    label {
      @include flexColumn(4px, start, stretch);
      font-size: 0.8em;

      input {
        @include input-bare;
        padding: 8px 14px;
        font-size: 1.25em;
        width: 100%;
      }
    }
  }

  .error   { color: var(--error); font-size: 0.85em; }
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

    &:disabled      { opacity: 0.5; cursor: not-allowed; }
    &:focus-visible { outline: 2px solid var(--white); outline-offset: 2px; }
  }
}

.empty, .empty-detail {
  font-size: 0.85em;
  opacity: 0.4;
  font-style: italic;
}
</style>
