<template>
  <div class="online-panel">
    <!-- UI 风格切换 - 始终显示 -->
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

    <!-- 连接状态 -->
    <div v-if="!connected" class="connect-section">
      <h3>在线对战</h3>
      <div class="server-input">
        <input 
          v-model="serverUrl" 
          placeholder="服务器地址"
          class="input"
        />
        <button @click="handleConnect" class="btn btn-primary" :disabled="connecting">
          {{ connecting ? '连接中...' : '连接' }}
        </button>
      </div>
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- 已连接但未在房间 -->
    <div v-else-if="!roomId" class="room-section">
      <h3>在线对战</h3>
      
      <!-- 颜色选择（房主） - 以美观的色块展示，风格化后的房主颜色选择 -->
      <div class="color-selection">
        <div class="setting-label" style="margin-bottom:8px;">房主颜色</div>
        <div class="color-swatches" aria-label="房主颜色">
          <button class="swatch sw-black" :class="{ selected: hostColor==='black' }" @click="hostColor='black'" aria-label="黑棋"></button>
          <button class="swatch sw-white" :class="{ selected: hostColor==='white' }" @click="hostColor='white'" aria-label="白棋"></button>
          <button class="swatch sw-random" :class="{ selected: hostColor==='random' }" @click="hostColor='random'" aria-label="随机"></button>
        </div>
        <div class="swatch-labels" aria-hidden="true">
          <span>黑棋</span><span>白棋</span><span>随机</span>
        </div>
        <div class="color-current-label" style="margin-top:6px; font-size:12px; color:var(--color-panel-text);">
          当前选择：{{ hostColor === 'random' ? '随机' : hostColor === 'black' ? '黑棋' : '白棋' }}
        </div>
      </div>

      <!-- 创建房间 -->
      <div class="create-room">
        <button @click="handleCreateRoomWithColor" class="btn btn-primary" :disabled="creating">
          {{ creating ? '创建中...' : '创建房间' }}
        </button>
      </div>
      
      <div class="divider">或</div>
      
      <!-- 加入房间 -->
      <div class="join-room">
        <input 
          v-model="joinRoomId" 
          placeholder="输入房间号"
          class="input"
          @keyup.enter="handleJoinRoomWithColor"
        />
        <button @click="handleJoinRoomWithColor" class="btn btn-secondary" :disabled="joining || !joinRoomId">
          {{ joining ? '加入中...' : '加入' }}
        </button>
      </div>
      
      <p v-if="error" class="error">{{ error }}</p>
    </div>

    <!-- 在房间中 -->
    <div v-else class="in-room-section">
      <div class="room-info">
        <div class="room-id">
          房间号: <strong>{{ roomId }}</strong>
        </div>
        <div class="player-info">
          <span :class="['player-badge', player === 1 ? 'black' : 'white']">
            {{ player === 1 ? '黑棋 (你)' : '白棋 (你)' }}
          </span>
        </div>
        <div v-if="!gameStarted" class="waiting">
          <p v-if="player === 1">等待对手加入...</p>
          <p v-else>已进入房间</p>
        </div>
      </div>

      <!-- 游戏状态 -->
      <div v-if="gameStarted" class="game-status">
        <div v-if="gameOver" class="status-gameover">
          <span class="winner-text">
            {{ winner === player ? '你赢了!' : '你输了' }}
          </span>
        </div>
        <div v-else class="status-playing">
          <span :class="['current-player', isMyTurn ? 'your-turn' : '']">
            {{ isMyTurn ? '你的回合' : '对方回合' }}
          </span>
        </div>
      </div>

      <!-- 操作按钮 -->
      <div class="action-buttons">
        <button 
          v-if="gameStarted && isMyTurn && !gameOver" 
          @click="requestUndo" 
          class="btn btn-secondary"
        >
          请求悔棋
        </button>
        
        <button 
          v-if="gameStarted && !gameOver" 
          @click="resign" 
          class="btn btn-danger"
        >
          认输
        </button>
        
        <button 
          v-if="gameStarted && gameOver" 
          @click="requestRestart" 
          class="btn btn-primary"
        >
          重开
        </button>
        
        <button @click="leaveRoom" class="btn btn-menu">
          离开房间
        </button>
        
        <button @click="$emit('toggle-zen')" class="btn btn-zen">
          🧘 禅
        </button>
      </div>

      <!-- 对方请求悔棋 -->
      <div v-if="waitingForUndo" class="confirm-dialog">
        <p>对方请求悔棋</p>
        <div class="dialog-buttons">
          <button @click="acceptUndo" class="btn btn-primary">同意</button>
          <button @click="rejectUndo" class="btn btn-secondary">拒绝</button>
        </div>
      </div>

      <!-- 对方请求重开 -->
      <div v-if="waitingForRestart" class="confirm-dialog">
        <p>对方请求重开</p>
        <div class="dialog-buttons">
          <button @click="acceptRestart" class="btn btn-primary">同意</button>
          <button @click="rejectRestart" class="btn btn-secondary">拒绝</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, inject } from 'vue'
import { themeOptions } from '../logic/themes'

// 使用 App.vue 提供的同一个 onlineGame 实例
const onlineGame = inject('onlineGame')

const changeTheme = inject('changeTheme')
const currentTheme = inject('currentTheme')

// 新增：颜色选择（房主/来宾）
const hostColor = ref('random')
const guestColor = ref('random')

 const {
  connected,
  roomId,
  player,
  gameStarted,
  isMyTurn,
  gameOver,
  winner,
  waitingForUndo,
  waitingForRestart,
  error,
  connect,
  disconnect,
  createRoom,
  joinRoom,
  placePiece,
  requestUndo,
  acceptUndo,
  rejectUndo,
  resign,
  requestRestart,
  acceptRestart,
  rejectRestart,
} = onlineGame

const serverUrl = ref('http://156.238.250.31:3001')
const joinRoomId = ref('')
const connecting = ref(false)
const creating = ref(false)
const joining = ref(false)

function handleThemeChange(themeName) {
  changeTheme(themeName)
}

function handleCreateRoomWithColor() {
  // 使用房主颜色选项创建房间
  creating.value = true
  error.value = null
  createRoom((response) => {
    creating.value = false
    if (!response.success) {
      error.value = response.error
    }
  }, hostColor.value)
}

function handleJoinRoomWithColor() {
  // 使用来宾颜色选项加入房间
  if (!joinRoomId.value) return
  joining.value = true
  error.value = null
  joinRoom(joinRoomId.value, (response) => {
    joining.value = false
    if (!response.success) {
      error.value = response.error
    }
  }, guestColor.value)
}

async function handleConnect() {
  connecting.value = true
  error.value = null
  connect(serverUrl.value)
  
  // 等待连接
  await new Promise(resolve => setTimeout(resolve, 1000))
  connecting.value = false
}

function handleCreateRoom() {
  creating.value = true
  error.value = null
  createRoom((response) => {
    creating.value = false
    if (!response.success) {
      error.value = response.error
    }
  })
}

function handleJoinRoom() {
  // 使用颜色选项进行加入房间的包装调用
  handleJoinRoomWithColor()
  // 加入过程的回传与状态通过 handleJoinRoomWithColor 内部逻辑处理
}

function leaveRoom() {
  disconnect()
  joinRoomId.value = ''
}

// 暴露给父组件使用
defineExpose({
  placePiece,
  getBoard: () => null, // 在线模式不使用本地棋盘
  isOnlineMode: true,
  player,
  isMyTurn,
  gameOver,
  winner,
})
</script>

<style scoped>
.online-panel {
  padding: 16px;
  background: var(--color-panel);
  border-radius: var(--border-radius-panel);
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
  color: var(--color-panel-text);
}

/* UI 风格选择 */
.theme-section {
  padding: 12px;
  background: var(--color-button);
  border-radius: 8px;
  margin-bottom: 16px;
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

h3 {
  margin: 0 0 16px 0;
  text-align: center;
  color: var(--color-panel-text);
}

.connect-section, .room-section, .in-room-section {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.input {
  flex: 1;
  padding: 10px 12px;
  border: 2px solid var(--color-border);
  border-radius: 6px;
  font-size: 14px;
  background: var(--color-panel);
  color: var(--color-panel-text);
}

.input:focus {
  outline: none;
  border-color: var(--color-accent);
}

.server-input, .create-room, .join-room {
  display: flex;
  gap: 8px;
}

.divider {
  text-align: center;
  color: var(--color-text-secondary);
  font-size: 12px;
}

.room-info {
  text-align: center;
  padding: 12px;
  background: var(--color-button);
  border-radius: 8px;
}

.room-id {
  font-size: 16px;
  margin-bottom: 8px;
}

.room-id strong {
  font-size: 20px;
  color: var(--color-accent);
  letter-spacing: 2px;
}

.player-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
}

.player-badge.black {
  background: var(--color-black-piece);
  color: #fff;
}

.player-badge.white {
  background: var(--color-white-piece);
  color: var(--color-black-piece);
  border: 1px solid var(--color-border);
}

.waiting {
  margin-top: 8px;
  color: var(--color-text-secondary);
}

.game-status {
  text-align: center;
  padding: 12px;
  background: var(--color-button);
  border-radius: 8px;
}

.winner-text {
  font-size: 18px;
  font-weight: bold;
  color: #e74c3c;
}

.current-player {
  font-size: 16px;
  color: var(--color-text-secondary);
}

.current-player.your-turn {
  color: var(--color-accent);
  font-weight: bold;
}

.action-buttons {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.btn {
  flex: 1;
  min-width: 80px;
  padding: 10px 12px;
  border: none;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn:hover:not(:disabled) {
  transform: translateY(-1px);
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-accent);
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

.btn-info {
  background: #9c27b0;
  color: white;
}

.error-message {
  padding: 8px 12px;
  background: #ffebee;
  color: #c62828;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.success-message {
  padding: 8px 12px;
  background: #e8f5e9;
  color: #2e7d32;
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.info-message {
  padding: 8px 12px;
  background: var(--color-button);
  color: var(--color-text-secondary);
  border-radius: 6px;
  font-size: 13px;
  text-align: center;
}

.popup-overlay {
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
}

.popup-content {
  background: var(--color-panel);
  padding: 20px;
  border-radius: 12px;
  text-align: center;
  color: var(--color-panel-text);
}

.popup-buttons {
  display: flex;
  gap: 8px;
  margin-top: 16px;
}
/* 颜色选择 UI 皮肤化，为不同 UI 风格提供可定制化的颜色块选择 */
.color-selection { text-align: center; padding: 8px 0; }
.color-swatches { display: inline-flex; gap: 10px; justify-content: center; align-items: center; }
.swatch { width: 46px; height: 28px; border-radius: 6px; border: 2px solid transparent; box-shadow: 0 2px 6px rgba(0,0,0,.2); cursor: pointer; }
.swatch.selected { outline: 4px solid var(--color-accent); outline-offset: 0; }
.sw-black { background: #111; }
.sw-white { background: #fff; border: 1px solid #ddd; }
.sw-random { background: linear-gradient(135deg, var(--color-primary) 0%, var(--color-secondary) 100%); }
.swatch-labels { display: flex; justify-content: center; gap: 40px; font-size: 12px; color: var(--color-panel-text); margin-top: 6px; }
</style>
