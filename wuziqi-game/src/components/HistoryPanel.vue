<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="history-panel">
      <div class="panel-header">
        <h2>对局历史</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="panel-content">
        <div v-if="loading" class="empty-state">
          <p>加载中...</p>
        </div>
        <div v-else-if="history.length === 0" class="empty-state">
          <p>暂无对局记录</p>
        </div>
        
        <div v-else class="history-list">
          <div v-for="record in history" :key="record.id" class="history-item">
            <span class="history-mode">{{ record.gameMode === 'online' ? '在线对战' : '人机对战' }}</span>
            <span class="history-result" :class="record.result === '胜利' ? 'win' : 'lose'">
              {{ record.playerColor }} · {{ record.totalMoves }}手 · {{ record.result }}
            </span>
            <span class="history-time">{{ formatDate(record.date) }} · {{ formatTime(record.totalTime) }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue'
import { fetchHistory } from '../logic/api'

defineEmits(['close'])

const history = ref([])
const loading = ref(true)

onMounted(async () => {
  history.value = await fetchHistory()
  loading.value = false
})

function loadHistory() {
  fetchHistory().then(data => {
    history.value = data
  })
}

defineExpose({ loadHistory })

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}:${secs.toString().padStart(2, '0')}`
}

function formatDate(dateStr) {
  if (!dateStr) return ''
  const date = new Date(dateStr)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  const h = String(date.getHours()).padStart(2, '0')
  const min = String(date.getMinutes()).padStart(2, '0')
  const s = String(date.getSeconds()).padStart(2, '0')
  return `${y}-${m}-${d} ${h}:${min}:${s}`
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
}

.history-panel {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.panel-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  border-bottom: 1px solid #eee;
}

.panel-header h2 {
  margin: 0;
  font-size: 18px;
  color: #333;
}

.close-btn {
  background: none;
  border: none;
  font-size: 24px;
  color: #999;
  cursor: pointer;
  padding: 0;
  width: 30px;
  height: 30px;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: #999;
}

.history-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.history-item {
  background: #f9f9f9;
  border-radius: 8px;
  padding: 12px;
  text-align: center;
}

.history-mode {
  display: block;
  font-size: 12px;
  color: #666;
  margin-bottom: 4px;
}

.history-result {
  font-weight: 500;
}

.history-time {
  display: block;
  font-size: 11px;
  color: #999;
  margin-top: 4px;
}

.history-result.win {
  color: #4caf50;
}

.history-result.lose {
  color: #f44336;
}
</style>
