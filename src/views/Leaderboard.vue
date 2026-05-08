<template>
  <Panel title="Registry">
    <div class="leaderboard">

      <div class="submit-row">
        <div v-if="myRank" class="my-rank">
            <span>Your rank:</span>
            <strong>#{{ myRank.rank }}</strong>
        </div>
        <div class="submit-container">
            <p v-if="submitMessage" class="submit-msg" :class="{ error: submitError }">
                {{ submitMessage }}
            </p>
            <button class="button submit-btn" @click="submitScore" :disabled="submitting">
                {{ submitting ? "Submitting..." : "Submit Run" }}
            </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">Loading the Registry...</div>

      <!-- Error -->
      <div v-else-if="loadError" class="load-error">
        Could not load the Registry. Check your connection.
      </div>

      <!-- Table -->
      <div v-else class="table-wrapper">
        <table class="lb-table" aria-label="Architects' Registry">
          <thead>
            <tr>
              <th scope="col" class="rank">#</th>
              <th scope="col" class="name">Engine</th>
              <th scope="col" class="player">Architect</th>
              <th scope="col" class="title">Title</th>
              <th scope="col" class="glyphs">Γ</th>
              <th scope="col" class="prestige">PP</th>
              <th scope="col" class="money">IGM</th>
              <th scope="col" class="level">Level</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="entry in entries"
              :key="entry.rank"
              :class="{ 'is-me': entry.username === user.user?.username }"
            >
              <td class="rank">{{ entry.rank }}</td>
              <td class="name">{{ entry.factoryName }}</td>
              <td class="player">{{ entry.username }}</td>
              <td class="title">{{ architectTitle(entry.ascensionCount, entry.endgameState === 'stabilized') }}</td>
              <td class="glyphs">{{ formatNumber(entry.glyphs) }}</td>
              <td class="prestige">{{ formatNumber(entry.prestigePoints) }}</td>
              <td class="money">{{ formatNumber(entry.money) }}</td>
              <td class="level">Lvl {{ entry.level }}</td>
            </tr>
            <tr v-if="entries.length === 0">
              <td colspan="8" class="empty">No Architects on record yet. Be the first to submit!</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import Panel from "../components/system/Panel.vue"
import { useUserStore } from "@/stores/user"
import { formatNumber } from "@/utils/format"
import { architectTitle } from "@/utils/architect"
import { api } from "@/utils/api"

interface LeaderboardEntry {
  rank: number
  username: string
  factoryName: string
  prestigePoints: number
  level: number
  money: number
  ascensionCount: number
  glyphs: number
  endgameState: string | null
}

interface MyRankData {
  rank: number
  money: number
}

const user = useUserStore()

const entries = ref<LeaderboardEntry[]>([])
const myRank = ref<MyRankData | null>(null)
const loading = ref(true)
const loadError = ref(false)
const submitting = ref(false)
const submitMessage = ref("")
const submitError = ref(false)

async function fetchLeaderboard() {
  loading.value = true
  loadError.value = false
  try {
    const data = await api.get<LeaderboardEntry[]>("/leaderboard", false)
    entries.value = data
  } catch {
    loadError.value = true
  } finally {
    loading.value = false
  }
}

async function fetchMyRank() {
  if (!user.loggedIn) return
  try {
    const data = await api.get<MyRankData>("/leaderboard/me")
    myRank.value = data
  } catch {
    // Not submitted yet — that's fine
  }
}

async function submitScore() {
  submitting.value = true
  submitMessage.value = ""
  submitError.value = false
  try {
    await api.post("/leaderboard/submit", {})
    submitMessage.value = "Score submitted!"
    await fetchLeaderboard()
    await fetchMyRank()
  } catch (err) {
    submitError.value = true
    submitMessage.value = err instanceof Error ? err.message : "Submission failed"
  } finally {
    submitting.value = false
  }
}

onMounted(() => {
  fetchLeaderboard()
  fetchMyRank()
})
</script>

<style scoped lang="scss">
.leaderboard {
  width: 100%;
  height: 100%;
  @include flexColumn(16px, start, stretch);
  padding-top: 12px;
  overflow: hidden;

  .submit-row {
    @include flexRow(20px, space-between, center);
    flex-shrink: 0;
    flex-wrap: wrap;

    .submit-container { @include flexRow(20px, start, center); }
    .submit-btn       { white-space: nowrap; }

    .submit-msg {
      font-size: 0.9em;
      color: var(--primary);

      &.error { color: var(--error); }
    }
  }

  .my-rank {
    @include flexRow(8px, start, center);
    font-size: 1.5em;
    color: var(--primary);
    flex-shrink: 0;

    strong { font-size: 1.2em; }
  }

  .loading, .load-error, .empty {
    text-align: center;
    opacity: 0.6;
    padding: 20px;
    font-size: 1.1em;
  }

  .load-error { color: var(--error); opacity: 1; }

  .table-wrapper {
    @include scrollbar(4px);
    flex: 1;
    overflow: auto;
  }

  .lb-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 0.9em;

    @include bp("md") {
      font-size: 0.8em;
      .level { display: none; }
    }
    @include bp("sm") {
      font-size: 0.75em;
      .player { display: none; }
    }

    thead tr {
      position: sticky;
      top: 0;
      background: var(--black);
      z-index: 1;

      th {
        font-weight: bold;
        color: var(--primary);
        border-bottom: 2px solid var(--primary);
        padding: 8px 12px;
        text-align: left;
      }
    }

    tbody tr {
      border-bottom: 1px solid rgba(255,255,255,0.08);

      &.is-me {
        background: rgba(192, 254, 4, 0.08);
        color: var(--primary);
      }

      td { padding: 8px 12px; }
    }

    .rank {
      text-align: center;
      font-weight: bold;
      width: 2rem;
    }

    .money, .prestige, .level, .glyphs {
      text-align: right;
      font-family: monospace;
    }
  }
}
</style>