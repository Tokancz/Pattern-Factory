<template>
  <Panel title="Ranking">
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
                {{ submitting ? "Submitting..." : "Submit My Score" }}
            </button>
        </div>
      </div>

      <!-- Loading -->
      <div v-if="loading" class="loading">Loading leaderboard...</div>

      <!-- Error -->
      <div v-else-if="loadError" class="load-error">
        Could not load leaderboard. Check your connection.
      </div>

      <!-- Table -->
      <section v-else class="table-wrapper">
        <div class="lb-row lb-header">
          <span class="rank">#</span>
          <span class="name">Factory</span>
          <span class="player">Player</span>
          <span class="prestige">PP</span>
          <span class="money">IGM</span>
          <span class="level">Level</span>
        </div>

        <div
          v-for="entry in entries"
          :key="entry.rank"
          class="lb-row"
          :class="{ 'is-me': entry.username === user.user?.username }"
        >
          <span class="rank">{{ entry.rank }}</span>
          <span class="name">{{ entry.factoryName }}</span>
          <span class="player">{{ entry.username }}</span>
          <span class="prestige">{{ formatNumber(entry.prestigePoints) }}</span>
          <span class="money">{{ formatNumber(entry.money) }}</span>
          <span class="level">Lvl {{ entry.level }}</span>
        </div>

        <div v-if="entries.length === 0" class="empty">
          No entries yet. Be the first to submit!
        </div>
    </section>
    </div>
  </Panel>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue"
import Panel from "../components/system/Panel.vue"
import { useUserStore } from "@/stores/user"
import { formatNumber } from "@/utils/format"
import { api } from "@/utils/api"
import type { LeaderboardEntry } from "shared/types"
import type { MyRankData } from "shared/types"


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

    .submit-container {
      @include flexRow(20px, start, center);
    }

    .submit-btn {
      white-space: nowrap;
    }

    .submit-msg {
      font-size: 0.9em;
      color: var(--primary);

      &.error {
        color: #ff4444;
      }
    }
  }

  .my-rank {
    @include flexRow(8px, start, center);
    font-size: 1.5em;
    color: var(--primary);
    flex-shrink: 0;

    strong {
      font-size: 1.2em;
    }
  }

  .loading, .load-error, .empty {
    text-align: center;
    opacity: 0.6;
    padding: 20px;
    font-size: 1.1em;
  }

  .load-error {
    color: #ff4444;
    opacity: 1;
  }

  .table-wrapper {
    flex: 1;
    overflow-y: auto;
    border: 1px solid rgba(255,255,255,0.15);

    &::-webkit-scrollbar {
      width: 4px;
    }
    &::-webkit-scrollbar-track {
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: var(--primary);
      border-radius: 2px;
    }
  }

  .lb-row {
    display: grid;
    grid-template-columns: 2rem 2fr 2fr repeat(3, 1fr);
    gap: 8px;
    padding: 8px 12px;
    border-bottom: 1px solid rgba(255,255,255,0.08);
    font-size: 0.9em;
    align-items: center;

    @media (width <= 768px) {
      grid-template-columns: 2.5rem repeat(4, 1fr);
      .level { display: none; }
      font-size: 0.8em;
    }

    &.lb-header {
      font-weight: bold;
      color: var(--primary);
      border-bottom: 2px solid var(--primary);
      position: sticky;
      top: 0;
      background: var(--black);
      z-index: 1;
    }

    &.is-me {
      background: rgba(192, 254, 4, 0.08);
      color: var(--primary);
    }

    .rank {
      text-align: center;
      font-weight: bold;
    }

    .money, .prestige, .level {
      text-align: right;
      font-family: monospace;
    }
  }
}
</style>