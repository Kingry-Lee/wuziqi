/**
 * 游戏配置管理
 */
const STORAGE_KEY = 'wuziqi-config'
const HISTORY_KEY = 'wuziqi-history'

export const defaultConfig = {
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

export const aiDifficultyOptions = [
  { value: 'beginner', label: '新手', description: 'AI 很容易出错' },
  { value: 'easy', label: '简单', description: 'AI 偶尔会失误' },
  { value: 'normal', label: '普通', description: 'AI 有一定水平' },
  { value: 'hard', label: '高手', description: 'AI 很难战胜' },
]

export const boardSizeOptions = [
  { value: 15, label: '15 × 15' },
]

export const firstPlayerOptions = [
  { value: 'black', label: '黑棋先行' },
  { value: 'white', label: '白棋先行' },
  { value: 'random', label: '随机选择' },
]

export const undoCountOptions = [
  { value: -1, label: '无限次' },
  { value: 1, label: '1 次' },
  { value: 2, label: '2 次' },
  { value: 3, label: '3 次' },
  { value: 5, label: '5 次' },
]

export class ConfigManager {
  constructor() {
    this.config = { ...defaultConfig }
    this.history = []
    this.loadConfig()
    this.loadHistory()
  }

  /**
   * 加载配置
   */
  loadConfig() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        this.config = { ...defaultConfig, ...JSON.parse(saved) }
      }
    } catch (e) {
      console.error('Failed to load config:', e)
      this.config = { ...defaultConfig }
    }
  }

  /**
   * 保存配置
   */
  saveConfig() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.config))
    } catch (e) {
      console.error('Failed to save config:', e)
    }
  }

  /**
   * 获取配置
   */
  getConfig() {
    return { ...this.config }
  }

  /**
   * 设置配置
   */
  setConfig(key, value) {
    this.config[key] = value
    this.saveConfig()
  }

  /**
   * 重置配置
   */
  resetConfig() {
    this.config = { ...defaultConfig }
    this.saveConfig()
  }

  /**
   * 加载历史对局
   */
  loadHistory() {
    try {
      const saved = localStorage.getItem(HISTORY_KEY)
      if (saved) {
        this.history = JSON.parse(saved)
      }
    } catch (e) {
      console.error('Failed to load history:', e)
      this.history = []
    }
  }

  /**
   * 保存历史对局
   */
  saveHistory() {
    try {
      // 只保留最近50局
      if (this.history.length > 50) {
        this.history = this.history.slice(-50)
      }
      localStorage.setItem(HISTORY_KEY, JSON.stringify(this.history))
    } catch (e) {
      console.error('Failed to save history:', e)
    }
  }

  /**
   * 添加历史对局记录
   */
  addGameRecord(record) {
    this.history.push({
      id: Date.now(),
      date: new Date().toISOString(),
      ...record
    })
    this.saveHistory()
  }

  /**
   * 获取历史对局
   */
  getHistory() {
    return [...this.history]
  }

  /**
   * 删除历史对局
   */
  deleteGameRecord(id) {
    this.history = this.history.filter(r => r.id !== id)
    this.saveHistory()
  }

  /**
   * 清空历史对局
   */
  clearHistory() {
    this.history = []
    this.saveHistory()
  }
}

export default ConfigManager
