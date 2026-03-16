import { ref, computed, reactive } from 'vue'
import { Board } from '../logic/board'
import { AI } from '../logic/ai'
import { ConfigManager } from '../logic/config'
import { saveToServer } from '../logic/api'

// 全局配置管理器
const configManager = new ConfigManager()

// 游戏状态
const board = ref(new Board(15))
const ai = ref(new AI('normal'))
const isAIThinking = ref(false)
const gameStats = reactive({
  blackTime: 0,
  whiteTime: 0,
  startTime: null,
  currentTurnTime: 0,
})

const gameStarted = ref(false)

let timerInterval = null

export function useGame() {
  /**
   * 初始化游戏
   */
  function initGame() {
    const config = configManager.getConfig()
    
    board.value.reset(config.boardSize)
    
    ai.value.setDifficulty(config.aiDifficulty)
    
    if (config.firstPlayer === 'random') {
      board.value.currentPlayer = Math.random() < 0.5 ? 1 : 2
    } else if (config.firstPlayer === 'white') {
      board.value.currentPlayer = 2
    } else {
      board.value.currentPlayer = 1
    }

    gameStats.blackTime = 0
    gameStats.whiteTime = 0
    gameStats.startTime = Date.now()
    gameStats.currentTurnTime = 0

    stopTimer()
    gameStarted.value = false
  }

  function startGame() {
    gameStats.startTime = Date.now()
    gameStarted.value = true
    startTimer()
    
    if (configManager.getConfig().gameMode === 'ai' && board.value.currentPlayer === 2) {
      makeAIMove()
    }
  }

  /**
   * 开始计时
   */
  function startTimer() {
    stopTimer()
    timerInterval = setInterval(() => {
      if (!board.value.gameOver) {
        if (board.value.currentPlayer === 1) {
          gameStats.blackTime++
        } else {
          gameStats.whiteTime++
        }
      }
    }, 1000)
  }

  /**
   * 停止计时
   */
  function stopTimer() {
    if (timerInterval) {
      clearInterval(timerInterval)
      timerInterval = null
    }
  }

  function placePiece(row, col) {
    if (isAIThinking.value || board.value.gameOver) return false

    const config = configManager.getConfig()
    const player = config.gameMode === 'ai' ? 1 : board.value.currentPlayer
    
    const success = board.value.placePiece(row, col, player)
    
    if (success) {
      if (board.value.gameOver) {
        stopTimer()
        saveToHistory()
      } else if (board.value.currentPlayer === 2 && configManager.getConfig().gameMode === 'ai') {
        makeAIMove()
      }
    }

    return success
  }

  async function makeAIMove() {
    if (board.value.gameOver) return

    isAIThinking.value = true
    
    await new Promise(resolve => setTimeout(resolve, 100))
    
    const config = configManager.getConfig()
    const aiPlayer = 2
    
    const move = ai.value.getNextMove(board.value, aiPlayer)
    
    if (move) {
      board.value.placePiece(move.row, move.col, aiPlayer)
    }
    
    isAIThinking.value = false
    
    if (board.value.gameOver) {
      stopTimer()
      saveToHistory()
    }
  }

  /**
   * 悔棋
   */
  function undo() {
    const config = configManager.getConfig()
    const gameMode = config.gameMode
    
    // 悔棋次数检查
    // 这里简化处理，实际可以记录每方的悔棋次数
    
    if (gameMode === 'ai') {
      // 人机模式：撤销两步（玩家一步 + AI一步）
      board.value.undo()
      setTimeout(() => board.value.undo(), 50)
    } else {
      // 双人模式：撤销一步
      board.value.undo()
    }
  }

  /**
   * 重新开始
   */
  function restart() {
    initGame()
  }

  /**
   * 认输
   */
  function resign() {
    board.value.gameOver = true
    board.value.winner = board.value.currentPlayer === 1 ? 2 : 1
    stopTimer()
    
    // 记录到历史
    saveToHistory()
  }

  function saveToHistory() {
    const winner = board.value.winner
    const config = configManager.getConfig()
    
    let playerColor = 1
    if (config.gameMode === 'ai') {
      playerColor = config.firstPlayer === 'white' ? 2 : 1
    }
    
    const playerWon = winner === playerColor
    
    let winnerText = ''
    if (winner === 1) {
      winnerText = config.gameMode === 'ai' ? (config.firstPlayer === 'black' ? '玩家' : 'AI') : '黑棋'
    } else if (winner === 2) {
      winnerText = config.gameMode === 'ai' ? (config.firstPlayer === 'white' ? '玩家' : 'AI') : '白棋'
    }

    const record = {
      boardSize: board.value.size,
      gameMode: config.gameMode,
      aiDifficulty: config.aiDifficulty,
      playerColor: playerColor === 1 ? '黑棋' : '白棋',
      result: playerWon ? '胜利' : '失败',
      winner: winnerText,
      totalMoves: board.value.moveHistory.length,
      totalTime: gameStats.blackTime + gameStats.whiteTime,
      date: new Date().toLocaleString('zh-CN'),
    }
    
    configManager.addGameRecord(record)
    saveToServer(record)
  }

  /**
   * 获取当前棋盘
   */
  function getBoard() {
    return board.value
  }

  /**
   * 获取配置
   */
  function getConfig() {
    return configManager.getConfig()
  }

  /**
   * 设置配置
   */
  function setConfig(key, value) {
    configManager.setConfig(key, value)
  }

  /**
   * 获取历史记录
   */
  function getHistory() {
    return configManager.getHistory()
  }

  /**
   * 删除历史记录
   */
  function deleteHistory(id) {
    configManager.deleteGameRecord(id)
  }

  /**
   * 清空历史记录
   */
  function clearHistory() {
    configManager.clearHistory()
  }

  /**
   * 导出当前局面（存档）
   */
  function exportGame() {
    return {
      board: board.value.exportState(),
      config: configManager.getConfig(),
      stats: { ...gameStats },
    }
  }

  /**
   * 导入局面（读档）
   */
  function importGame(data) {
    if (data.board) {
      board.value.importState(data.board)
    }
    if (data.config) {
      Object.entries(data.config).forEach(([key, value]) => {
        configManager.setConfig(key, value)
      })
    }
    if (data.stats) {
      Object.assign(gameStats, data.stats)
    }
  }

  // 计算属性
  const currentPlayer = computed(() => board.value.currentPlayer)
  const gameOver = computed(() => board.value.gameOver)
  const winner = computed(() => board.value.winner)
  const boardSize = computed(() => board.value.size)
  const cells = computed(() => board.value.cells)
  const lastMove = computed(() => board.value.lastMove)
  const moveHistory = computed(() => board.value.moveHistory)
  const isGameModeAI = computed(() => configManager.getConfig().gameMode === 'ai')

  return {
    // 状态
    board,
    isAIThinking,
    gameStats,
    gameStarted,
    
    // 计算属性
    currentPlayer,
    gameOver,
    winner,
    boardSize,
    cells,
    lastMove,
    moveHistory,
    isGameModeAI,
    
    // 方法
    initGame,
    startGame,
    placePiece,
    undo,
    restart,
    resign,
    getConfig,
    setConfig,
    getHistory,
    deleteHistory,
    clearHistory,
    exportGame,
    importGame,
  }
}

export default useGame
