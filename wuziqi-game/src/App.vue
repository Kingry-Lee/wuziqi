<script setup>
import { ref, onMounted, onUnmounted, provide, watch, nextTick } from 'vue'
import GameBoard from './components/GameBoard.vue'
import ControlPanel from './components/ControlPanel.vue'
import OnlinePanel from './components/OnlinePanel.vue'
import SettingsPanel from './components/SettingsPanel.vue'
import HistoryPanel from './components/HistoryPanel.vue'
import { useGame } from './composables/useGame'
import { useOnlineGame } from './composables/useOnlineGame'
import { applyTheme, getTheme } from './logic/themes'
import { getPipHtml } from './logic/pip'

const { initGame, startGame, setConfig, getConfig, undo, placePiece, gameOver, isAIThinking, cells, lastMove, board, gameStarted } = useGame()
const onlineGame = useOnlineGame()

// 专门用于 PiP 同步的数据
const pipData = ref({ cells: [], lastMove: null })

const showSettings = ref(false)
const showHistory = ref(false)
const historyPanelRef = ref(null)
const gameMode = ref('ai')
const currentTheme = ref('default')
const zenMode = ref(false)
const showZenButton = ref(false)
const boardKey = ref(0)
const boardScale = ref(1)
const bossMode = ref(false)

provide('gameMode', gameMode)
provide('onlineGame', onlineGame)

function applyCurrentTheme() {
  const config = getConfig()
  currentTheme.value = config.uiTheme || 'default'
  const theme = getTheme(currentTheme.value)
  applyTheme(theme)
}

function handleKeydown(e) {
  if (e.key === 'F9' || (e.ctrlKey && e.shiftKey && e.key === 'H')) {
    e.preventDefault()
    bossMode.value = !bossMode.value
  }
}

function toggleZenMode() {
  zenMode.value = !zenMode.value
  if (zenMode.value) {
    document.documentElement.classList.add('zen-mode')
    boardScale.value = 1
  } else {
    document.documentElement.classList.remove('zen-mode')
    showZenButton.value = false
    boardScale.value = 1
  }
}

function adjustZoom(delta) {
  const newScale = boardScale.value + delta
  if (newScale >= 0.5 && newScale <= 2) {
    boardScale.value = newScale
  }
}

let pipWindow = null

function openPipMode() {
  if (pipWindow && !pipWindow.closed) {
    pipWindow.focus()
    return
  }
  
  const theme = getTheme(currentTheme.value)
  const freshCells = board.value.cells.map(row => [...row])
  const freshLastMove = board.value.lastMove ? { ...board.value.lastMove } : null
  
  pipWindow = window.open(
    '',
    'wuziqi-pip',
    'width=400,height=400,top=100,left=100,menubar=no,toolbar=no,location=no,status=no,scrollbars=no,resizable=yes'
  )
  
  if (pipWindow) {
    pipWindow.document.write(getPipHtml(theme, freshCells, freshLastMove))
    pipWindow.document.close()
  }
}

// 监听画中画窗口的点击
window.addEventListener('message', (e) => {
  if (e.data.type === 'pip-click') {
    const { row, col } = e.data
    if (gameMode.value === 'online') {
      // 在线模式
      if (!onlineGame.gameOver.value && onlineGame.isMyTurn.value) {
        onlineGame.placePiece(row, col)
      }
    } else {
      // AI/本地模式
      if (!gameOver.value && !isAIThinking.value) {
        placePiece(row, col)
      }
    }
  }
})

// AI模式：监听 board 变化
watch(() => board.value.version, () => {
  if (gameMode.value !== 'online') {
    pipData.value = {
      cells: board.value.cells.map(row => [...row]),
      lastMove: board.value.lastMove ? JSON.parse(JSON.stringify(board.value.lastMove)) : null
    }
    if (pipWindow && !pipWindow.closed) {
      updatePipBoard()
    }
  }
}, { immediate: true })

// 在线模式：监听 onlineGame.cells 变化
watch(() => onlineGame.cells.value, () => {
  if (gameMode.value === 'online') {
    pipData.value = {
      cells: onlineGame.cells.value.map(row => [...row]),
      lastMove: onlineGame.lastMove.value ? JSON.parse(JSON.stringify(onlineGame.lastMove.value)) : null
    }
    if (pipWindow && !pipWindow.closed) {
      updatePipBoard()
    }
  }
}, { deep: true, immediate: true })

// 监听游戏模式变化，切换 PiP 数据源
watch(gameMode, (newMode) => {
  if (pipWindow && !pipWindow.closed) {
    if (newMode === 'online') {
      pipData.value = {
        cells: onlineGame.cells.value.map(row => [...row]),
        lastMove: onlineGame.lastMove.value ? JSON.parse(JSON.stringify(onlineGame.lastMove.value)) : null
      }
    } else {
      pipData.value = {
        cells: board.value.cells.map(row => [...row]),
        lastMove: board.value.lastMove ? JSON.parse(JSON.stringify(board.value.lastMove)) : null
      }
    }
    updatePipBoard()
  }
})

watch(currentTheme, () => {
  if (pipWindow && !pipWindow.closed) {
    const theme = getTheme(currentTheme.value)
    pipWindow.document.write(getPipHtml(theme, pipData.value.cells, pipData.value.lastMove))
    pipWindow.document.close()
  }
})

function updatePipBoard() {
  if (!pipWindow || pipWindow.closed) return
  try {
    const message = { 
      type: 'pip-update', 
      cells: JSON.parse(JSON.stringify(pipData.value.cells)),
      lastMove: pipData.value.lastMove ? JSON.parse(JSON.stringify(pipData.value.lastMove)) : null
    }
    pipWindow.postMessage(message, '*')
  } catch (e) {
    console.error('[PiP] postMessage error:', e)
  }
}

function handleZenUndo() {
  undo()
}

function handleStartGame() {
  startGame()
}

onMounted(() => {
  initGame()
  applyCurrentTheme()
  window.addEventListener('keydown', handleKeydown)
})

onUnmounted(() => {
  window.removeEventListener('keydown', handleKeydown)
})

function handleModeChange(mode) {
  gameMode.value = mode
  if (mode === 'ai') {
    setConfig('gameMode', mode)
    initGame()
  }
}

function handleThemeChange(themeName) {
  setConfig('uiTheme', themeName)
  currentTheme.value = themeName
  applyCurrentTheme()
  boardKey.value++
}

function handleSettingsApply() {
  initGame()
  applyCurrentTheme()
  boardKey.value++
}

function openHistory() {
  showHistory.value = true
  nextTick(() => {
    historyPanelRef.value?.loadHistory()
  })
}

provide('changeTheme', handleThemeChange)
provide('currentTheme', currentTheme)
</script>

<template>
  <!-- Boss Key 隐藏界面 -->
  <div v-if="bossMode" class="boss-mode">
    <div class="boss-message">请按 F9 或 Ctrl+Shift+H 退出</div>
  </div>
  
  <div v-else class="app-container" :class="{ 'zen-mode': zenMode }">
    <header class="app-header" v-if="!zenMode">
      <h1>五子棋</h1>
      <div class="mode-selector">
        <button 
          :class="['mode-btn', { active: gameMode === 'ai' }]"
          @click="handleModeChange('ai')"
        >
          人机对战
        </button>
        <button 
          :class="['mode-btn', { active: gameMode === 'online' }]"
          @click="handleModeChange('online')"
        >
          在线对战
        </button>
      </div>
    </header>
    
    <!-- Zen 模式按钮 - 左上角 -->
    <div v-if="zenMode" class="zen-corner-controls top-left">
      <button 
        class="zen-toggle-btn zen-mode"
        @click="toggleZenMode"
      >
        ✕
      </button>
      
      <button 
        v-if="gameMode !== 'online'" 
        class="zen-undo-btn zen-mode"
        @click="handleZenUndo"
      >
        悔
      </button>
    </div>
    
    <!-- Zen 模式按钮 - 右下角 -->
    <div v-if="zenMode" class="zen-corner-controls bottom-right">
      <button 
        class="zen-toggle-btn zen-mode"
        @click="toggleZenMode"
      >
        ✕
      </button>
      
      <button 
        v-if="gameMode !== 'online'" 
        class="zen-undo-btn zen-mode"
        @click="handleZenUndo"
      >
        悔
      </button>
    </div>
    
    <main class="game-container">
      <div 
        class="board-wrapper"
        :style="zenMode ? { transform: `scale(${boardScale})` } : {}"
      >
        <GameBoard 
          :key="boardKey"
          :mode="gameMode" 
          :onlineGame="gameMode === 'online' ? onlineGame : null" 
          :zenMode="zenMode"
        />
        <!-- 开始游戏按钮 -->
        <div v-if="gameMode === 'ai' && !gameStarted" class="start-game-overlay">
          <button class="start-game-btn" @click="handleStartGame">
            开始对战
          </button>
        </div>
      </div>
      
      <!-- ZEN 模式缩放控制 - 固定定位，不随棋盘缩放 -->
      <div v-if="zenMode" class="zen-zoom-controls">
        <button @click="adjustZoom(0.1)">+</button>
        <span>{{ Math.round(boardScale * 100) }}%</span>
        <button @click="adjustZoom(-0.1)">-</button>
        <button class="pip-btn" @click="openPipMode" title="画中画">⧉</button>
      </div>
      
      <aside class="sidebar" v-if="!zenMode">
        <ControlPanel 
          v-if="gameMode !== 'online'"
          @open-settings="showSettings = true"
          @open-history="openHistory"
          @toggle-zen="toggleZenMode"
        />
        
        <OnlinePanel 
          v-else 
          @toggle-zen="toggleZenMode"
        />
      </aside>
    </main>

    <SettingsPanel 
      v-if="showSettings && gameMode !== 'online'" 
      @close="showSettings = false"
      @apply="handleSettingsApply"
    />

    <HistoryPanel 
      v-if="showHistory" 
      ref="historyPanelRef"
      @close="showHistory = false"
    />
  </div>
</template>

<style>
:root {
  --color-primary: #667eea;
  --color-secondary: #764ba2;
  --color-background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  --color-board: #deb887;
  --color-board-line: #8b4513;
  --color-black-piece: #1a1a1a;
  --color-white-piece: #f5f5f5;
  --color-text: #ffffff;
  --color-text-secondary: rgba(255,255,255,0.8);
  --color-button: rgba(255,255,255,0.1);
  --color-button-hover: rgba(255,255,255,0.2);
  --color-button-active: #4caf50;
  --color-panel: white;
  --color-panel-text: #333333;
  --color-border: rgba(255,255,255,0.3);
  --color-accent: #4caf50;
  --color-button-text: #ffffff;
  --border-radius-button: 20px;
  --border-radius-panel: 16px;
  --border-radius-piece: 50%;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
  --box-shadow: none;
}

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

html, body {
  width: 100%;
  min-height: 100%;
}

body {
  font-family: var(--font-family);
  background: var(--color-background);
  background-attachment: fixed;
  min-height: 100vh;
  min-height: 100dvh;
}

#app {
  width: 100%;
  min-height: 100vh;
  min-height: 100dvh;
}

html.zen-mode, html.zen-mode body {
  overflow: hidden;
  margin: 0;
  padding: 0;
}
</style>

<style scoped>
.app-container {
  width: 100%;
  max-width: 1200px;
  margin: 0 auto;
  padding: 16px;
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
}

.app-header {
  text-align: center;
  padding: 12px 0;
  margin-bottom: 16px;
}

.app-header h1 {
  color: var(--color-text);
  font-size: 28px;
  font-weight: 600;
  text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.3);
  margin-bottom: 12px;
}

.mode-selector {
  display: flex;
  justify-content: center;
  gap: 8px;
  flex-wrap: wrap;
}

.mode-btn {
  padding: 8px 16px;
  border: 2px solid var(--color-border);
  border-radius: var(--border-radius-button);
  background: var(--color-button);
  color: var(--color-button-text, var(--color-text));
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
}

.mode-btn:hover {
  background: var(--color-button-hover);
}

.mode-btn.active {
  background: var(--color-button-active);
  border-color: var(--color-button-active);
  color: white;
}

.game-container {
  display: flex;
  gap: 24px;
  flex: 1;
  align-items: flex-start;
  justify-content: center;
}

.board-wrapper {
  flex: 1;
  max-width: 600px;
  width: 100%;
  position: relative;
}

.sidebar {
  width: 320px;
  flex-shrink: 0;
}

/* Zen 模式 */
.app-container.zen-mode {
  padding: 0;
  max-width: 100%;
  width: 100vw;
  height: 100vh;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
}

.app-container.zen-mode .game-container {
  justify-content: center;
  align-items: center;
  width: 100%;
  height: 100%;
  padding: 0;
}

.app-container.zen-mode .board-wrapper {
  display: flex;
  justify-content: center;
  align-items: center;
}

/* Zen 模式缩放控制 */
.zen-zoom-controls {
  position: fixed;
  bottom: 20px;
  left: 50%;
  transform: translateX(-50%);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  background: rgba(0, 0, 0, 0.5);
  padding: 8px 16px;
  border-radius: 20px;
  z-index: 100;
}

.zen-zoom-controls span {
  color: white;
  font-size: 14px;
  min-width: 50px;
  text-align: center;
  line-height: 1;
}

.zen-zoom-controls button {
  width: 36px;
  height: 36px;
  min-width: 36px;
  border-radius: 50%;
  border: none;
  background: rgba(255, 255, 255, 0.2);
  color: white;
  font-size: 24px;
  font-weight: normal;
  cursor: pointer;
  display: block;
  text-align: center;
  padding: 0;
  margin: 0;
  line-height: 36px;
}

.zen-zoom-controls button:hover {
  background: rgba(255, 255, 255, 0.3);
}

.zen-zoom-controls .pip-btn {
  font-size: 18px;
  margin-left: 8px;
}

/* Zen 模式四角按钮 */
.zen-corner-controls {
  position: fixed;
  display: flex;
  gap: 8px;
  z-index: 100;
}

.zen-corner-controls.top-left {
  top: 16px;
  left: 16px;
}

.zen-corner-controls.bottom-right {
  bottom: 16px;
  right: 16px;
}

.zen-toggle-btn,
.zen-undo-btn {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  border: none;
  font-size: 18px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  background: rgba(255, 255, 255, 0.15);
  color: rgba(255, 255, 255, 0.8);
  backdrop-filter: blur(4px);
}

.zen-toggle-btn:hover,
.zen-undo-btn:hover {
  background: rgba(255, 255, 255, 0.25);
  transform: scale(1.1);
}

.zen-toggle-btn {
  background: rgba(244, 67, 54, 0.2);
  color: #ff6b6b;
}

.zen-toggle-btn:hover {
  background: rgba(244, 67, 54, 0.4);
}

.zen-undo-btn {
  font-size: 14px;
  font-weight: 600;
}

.zen-undo-btn:hover {
  background: rgba(76, 175, 80, 0.3);
  color: #81c784;
}

@media (max-width: 768px) {
  .game-container {
    flex-direction: column;
    align-items: center;
  }

  .board-wrapper {
    width: 100%;
    max-width: min(600px, 90vw);
  }

  .sidebar {
    width: 100%;
    max-width: 600px;
  }
}

@media (max-width: 480px) {
  .app-container {
    padding: 8px;
  }

  .app-header h1 {
    font-size: 24px;
  }

  .mode-btn {
    padding: 6px 12px;
    font-size: 12px;
  }

  .board-wrapper {
    width: 95vw;
    max-width: 95vw;
  }

  .sidebar {
    width: 95vw;
  }
}

/* Boss Key 隐藏模式 */
.boss-mode {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #1a1a1a;
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 9999;
}

.boss-message {
  color: #666;
  font-size: 14px;
  font-family: monospace;
}

/* 开始游戏遮罩 */
.start-game-overlay {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 50;
  border-radius: 12px;
  backdrop-filter: blur(4px);
}

.start-game-btn {
  padding: 18px 48px;
  font-size: 1.4rem;
  font-weight: 700;
  background: linear-gradient(135deg, var(--color-primary, #667eea) 0%, var(--color-secondary, #764ba2) 100%);
  color: var(--color-text, #ffffff);
  border: none;
  border-radius: var(--border-radius-button, 30px);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
  text-transform: uppercase;
  letter-spacing: 2px;
}

.start-game-btn:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 30px rgba(102, 126, 234, 0.7);
}

.start-game-btn:active {
  transform: translateY(0);
}
</style>
