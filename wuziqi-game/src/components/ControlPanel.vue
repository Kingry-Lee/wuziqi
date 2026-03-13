<template>
  <div class="control-panel">
    <!-- 游戏状态显示 -->
    <div class="game-status">
      <div v-if="gameOver" class="status-gameover">
        <span class="winner-text">
          {{ winner === 1 ? '黑棋' : '白棋' }} 获胜！
        </span>
      </div>
      <div v-else class="status-playing">
        <span :class="['current-player', currentPlayer === 1 ? 'black' : 'white']">
          {{ currentPlayer === 1 ? '黑棋' : '白棋' }} {{ isAIThinking ? '思考中...' : '落子' }}
        </span>
      </div>
    </div>

    <!-- 计时显示 -->
    <div class="timer-display">
      <div class="timer-item" :class="{ active: currentPlayer === 1 }">
        <span class="timer-label">黑棋</span>
        <span class="timer-value">{{ formatTime(gameStats.blackTime) }}</span>
      </div>
      <div class="timer-divider">:</div>
      <div class="timer-item" :class="{ active: currentPlayer === 2 }">
        <span class="timer-label">白棋</span>
        <span class="timer-value">{{ formatTime(gameStats.whiteTime) }}</span>
      </div>
    </div>

    <!-- UI 风格切换 -->
    <div class="theme-section">
      <label class="setting-label">UI 风格</label>
      <div class="theme-grid">
        <button 
          v-for="opt in themeOptions" 
          :key="opt.value"
          :class="['theme-btn', { active: currentTheme === opt.value }]"
          @click="handleThemeChange(opt.value)"
        >
          <span class="theme-preview" :class="'theme-preview-' + opt.value"></span>
          <span class="theme-name">{{ opt.label }}</span>
        </button>
      </div>
    </div>

    <!-- 操作按钮 -->
    <div class="action-buttons">
      <button class="btn btn-primary" @click="restart">
        重开
      </button>
      <button class="btn btn-secondary" @click="undo" :disabled="moveHistory.length === 0 || gameOver">
        悔棋
      </button>
      <button class="btn btn-danger" @click="resign" :disabled="gameOver">
        认输
      </button>
    </div>

    <!-- 菜单位置 -->
    <div class="menu-buttons">
      <button class="btn btn-menu" @click="$emit('open-settings')">
        ⚙️ 设置
      </button>
      <button class="btn btn-menu" @click="$emit('open-history')">
        📋 历史
      </button>
      <button class="btn btn-zen" @click="$emit('toggle-zen')">
        🧘 禅
      </button>
    </div>
  </div>
</template>

<script setup>
import { inject } from 'vue'
import { useGame } from '../composables/useGame'
import { themeOptions } from '../logic/themes'

const { 
  currentPlayer, 
  gameOver, 
  winner, 
  gameStats, 
  moveHistory,
  isAIThinking,
  restart, 
  undo, 
  resign 
} = useGame()

const changeTheme = inject('changeTheme')
const currentTheme = inject('currentTheme')

function handleThemeChange(themeName) {
  changeTheme(themeName)
}

defineEmits(['open-settings', 'open-history', 'toggle-zen'])

function formatTime(seconds) {
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}
</script>

<style scoped>
.control-panel {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 16px;
  background: var(--color-panel);
  border-radius: var(--border-radius-panel);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  color: var(--color-panel-text);
}

.game-status {
  text-align: center;
  padding: 12px;
  background: var(--color-button);
  border-radius: 8px;
}

.status-gameover {
  animation: pulse 1s infinite;
}

@keyframes pulse {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

.winner-text {
  font-size: 20px;
  font-weight: bold;
  color: #e74c3c;
}

.current-player {
  font-size: 18px;
  font-weight: 500;
}

.current-player.black {
  color: var(--color-black-piece);
}

.current-player.white {
  color: var(--color-panel-text);
  opacity: 0.7;
}

.timer-display {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 8px;
  padding: 12px;
  background: var(--color-button);
  border-radius: 8px;
}

.timer-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 16px;
  border-radius: 6px;
  transition: all 0.3s;
}

.timer-item.active {
  background: var(--color-button-hover);
  box-shadow: 0 0 0 2px var(--color-accent);
}

.timer-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.timer-value {
  font-size: 24px;
  font-weight: bold;
  font-family: monospace;
  color: var(--color-panel-text);
}

.timer-divider {
  font-size: 24px;
  font-weight: bold;
}

.timer-value {
  font-size: 24px;
  font-weight: bold;
  font-family: monospace;
  color: #333;
}

.timer-divider {
  font-size: 24px;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.btn {
  flex: 1;
  min-width: 80px;
  padding: 10px 16px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-secondary {
  background: #2196f3;
  color: white;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-menu {
  background: #9e9e9e;
  color: white;
}

.menu-buttons {
  display: flex;
  gap: 8px;
}

.menu-buttons .btn {
  flex: 1;
}

/* UI 风格选择 */
.theme-section {
  padding: 12px;
  background: var(--color-button);
  border-radius: 8px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  margin-bottom: 8px;
  color: var(--color-panel-text);
}

.theme-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 8px;
}

.theme-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 8px 4px;
  border: 2px solid transparent;
  border-radius: 8px;
  background: var(--color-panel);
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  transform: translateY(-2px);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
}

.theme-btn.active {
  border-color: var(--color-accent);
}

.theme-preview {
  width: 24px;
  height: 24px;
  border-radius: 4px;
  margin-bottom: 4px;
  border: 1px solid rgba(0, 0, 0, 0.1);
}

.theme-preview-default {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.theme-preview-pixel {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
}

.theme-preview-neon {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
}

.theme-preview-minimal {
  background: #f5f5f5;
}

.theme-preview-warm {
  background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
}

.theme-preview-ocean {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.theme-name {
  font-size: 11px;
  color: var(--color-panel-text);
}
</style>
