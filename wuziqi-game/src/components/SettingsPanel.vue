<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="settings-panel">
      <div class="panel-header">
        <h2>游戏设置</h2>
        <button class="close-btn" @click="$emit('close')">×</button>
      </div>
      
      <div class="panel-content">
        <!-- 游戏模式 -->
        <div class="setting-group">
          <label class="setting-label">游戏模式</label>
          <div class="button-group">
            <button 
              :class="['option-btn', { active: config.gameMode === 'ai' }]"
              @click="updateConfig('gameMode', 'ai')">
              人机对战
            </button>
          </div>
        </div>

        <!-- AI 难度 -->
        <div v-if="config.gameMode === 'ai'" class="setting-group">
          <label class="setting-label">AI 难度</label>
          <div class="difficulty-buttons">
            <button 
              v-for="opt in aiDifficultyOptions" 
              :key="opt.value"
              :class="['option-btn difficulty', { active: config.aiDifficulty === opt.value }]"
              @click="updateConfig('aiDifficulty', opt.value)"
              :title="opt.description">
              {{ opt.label }}
            </button>
          </div>
          <p v-if="config.aiDifficulty" class="difficulty-desc">
            {{ getDifficultyDesc(config.aiDifficulty) }}
          </p>
        </div>

        <!-- 先手选择 -->
        <div class="setting-group">
          <label class="setting-label">先手方</label>
          <div class="button-group">
            <button 
              v-for="opt in firstPlayerOptions" 
              :key="opt.value"
              :class="['option-btn', { active: config.firstPlayer === opt.value }]"
              @click="updateConfig('firstPlayer', opt.value)">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 悔棋次数 -->
        <div class="setting-group">
          <label class="setting-label">悔棋次数</label>
          <div class="button-group">
            <button 
              v-for="opt in undoCountOptions" 
              :key="opt.value"
              :class="['option-btn', { active: config.undoCount === opt.value }]"
              @click="updateConfig('undoCount', opt.value)">
              {{ opt.label }}
            </button>
          </div>
        </div>

        <!-- 音效开关 -->
        <div class="setting-group">
          <label class="setting-label">游戏音效</label>
          <div class="toggle-switch">
            <input 
              type="checkbox" 
              id="sound-toggle"
              :checked="config.soundEnabled"
              @change="updateConfig('soundEnabled', $event.target.checked)"
            />
            <label for="sound-toggle" class="toggle-label">
              <span class="toggle-slider"></span>
            </label>
          </div>
        </div>
      </div>

      <div class="panel-footer">
        <button class="btn btn-reset" @click="resetConfig">恢复默认设置</button>
        <button class="btn btn-primary" @click="applyAndClose">应用并开始</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, inject } from 'vue'
import { useGame } from '../composables/useGame'
import { 
  aiDifficultyOptions, 
  firstPlayerOptions, 
  undoCountOptions 
} from '../logic/config'

const emit = defineEmits(['close', 'apply'])
const { getConfig, setConfig, restart } = useGame()

const changeTheme = inject('changeTheme', () => {})
const currentTheme = inject('currentTheme')

const config = ref({
  gameMode: 'ai',
  aiDifficulty: 'normal',
  firstPlayer: 'black',
  undoCount: 3,
  boardSize: 15
})

const difficultyDesc = {
  beginner: 'AI 落子较为随机，适合初学者练习',
  easy: 'AI 偶尔会犯错，但基本能看出简单攻势',
  normal: 'AI 有一定策略性，需要认真对待',
  hard: 'AI 很强，建议高手挑战'
}

function handleThemeChange(themeName) {
  updateConfig('uiTheme', themeName)
  changeTheme?.(themeName)
}

onMounted(() => {
  config.value = { ...getConfig() }
})

function updateConfig(key, value) {
  config.value[key] = value
}

function getDifficultyDesc(level) {
  return difficultyDesc[level] || ''
}

function resetConfig() {
  const defaultConfig = {
    boardSize: 15,
    firstPlayer: 'black',
    forbiddenMode: false,
    winCondition: 5,
    undoCount: -1,
    aiDifficulty: 'normal',
    gameMode: 'ai',
    timeRecord: true,
    soundEnabled: true,
    uiTheme: 'default',
  }
  config.value = { ...defaultConfig }
  changeTheme?.('default')
}

function applyAndClose() {
  // 保存所有配置
  Object.entries(config.value).forEach(([key, value]) => {
    setConfig(key, value)
  })
  
  // 重新开始游戏
  restart()
  
  emit('apply')
  emit('close')
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

.settings-panel {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover {
  color: #333;
}

.panel-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.setting-group {
  margin-bottom: 20px;
}

.setting-label {
  display: block;
  font-size: 14px;
  font-weight: 500;
  color: #333;
  margin-bottom: 10px;
}

.button-group {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.option-btn {
  padding: 8px 16px;
  border: 2px solid var(--color-border);
  border-radius: 8px;
  background: var(--color-button);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.2s;
  color: var(--color-panel-text);
  font-weight: 500;
}

.option-btn:hover {
  border-color: var(--color-accent);
}

.option-btn.active {
  background: var(--color-button-active);
  border-color: var(--color-button-active);
  color: white;
}

.option-btn.difficulty {
  flex: 1;
  text-align: center;
}

.difficulty-buttons {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 8px;
}

.difficulty-desc {
  margin-top: 8px;
  font-size: 12px;
  color: #666;
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
  padding: 8px;
  border: 2px solid #ddd;
  border-radius: 8px;
  background: #f5f5f5;
  cursor: pointer;
  transition: all 0.2s;
}

.theme-btn:hover {
  border-color: #4caf50;
}

.theme-btn.active {
  background: #4caf50;
  border-color: #4caf50;
}

.theme-btn.active .theme-name {
  color: white;
}

.theme-preview {
  width: 40px;
  height: 40px;
  border-radius: 4px;
  margin-bottom: 4px;
  border: 1px solid #ccc;
}

.theme-preview-default {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

.theme-preview-pixel {
  background: linear-gradient(180deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid #00ff00;
}

.theme-preview-neon {
  background: linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%);
  box-shadow: 0 0 8px #ff00ff;
}

.theme-preview-minimal {
  background: #f5f5f5;
  border: 2px solid #333;
}

.theme-preview-warm {
  background: linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%);
}

.theme-preview-ocean {
  background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
}

.theme-name {
  font-size: 12px;
  color: var(--color-panel-text, #333);
}

.toggle-switch {
  display: flex;
  align-items: center;
}

.toggle-switch input {
  display: none;
}

.toggle-label {
  position: relative;
  display: inline-block;
  width: 48px;
  height: 26px;
}

.toggle-slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: #ccc;
  border-radius: 26px;
  transition: 0.3s;
}

.toggle-slider:before {
  position: absolute;
  content: "";
  height: 20px;
  width: 20px;
  left: 3px;
  bottom: 3px;
  background: white;
  border-radius: 50%;
  transition: 0.3s;
}

input:checked + .toggle-label .toggle-slider {
  background: #4caf50;
}

input:checked + .toggle-label .toggle-slider:before {
  transform: translateX(22px);
}

.panel-footer {
  display: flex;
  gap: 12px;
  padding: 16px 20px;
  border-top: 1px solid #eee;
}

.btn {
  flex: 1;
  padding: 12px;
  border: none;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
}

.btn-primary {
  background: #4caf50;
  color: white;
}

.btn-primary:hover {
  background: #45a049;
}

.btn-reset {
  background: #f5f5f5;
  color: #666;
}

.btn-reset:hover {
  background: #eee;
}
</style>
