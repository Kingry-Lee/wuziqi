import { ref, reactive, computed } from 'vue'
import { io } from 'socket.io-client'
import { Board } from '../logic/board'
import { saveToServer } from '../logic/api'

const DEFAULT_SERVER_URL = 'http://156.238.250.31:3001'

export function useOnlineGame() {
  const socket = ref(null)
  const connected = ref(false)
  const roomId = ref(null)
  const player = ref(null) // 1: 黑棋(房主), 2: 白棋(访客)
  const opponentConnected = ref(false)
  const gameStarted = ref(false)
  const board = ref(new Board(15))
  const isMyTurn = ref(false)
  const gameOver = ref(false)
  const winner = ref(null)
  const waitingForUndo = ref(false)
  const waitingForRestart = ref(false)

  // 错误信息
  const error = ref(null)

  // 连接到服务器
  function connect(serverUrl = DEFAULT_SERVER_URL) {
    if (socket.value?.connected) return

    socket.value = io(serverUrl, {
      transports: ['websocket', 'polling']
    })

    socket.value.on('connect', () => {
      connected.value = true
      console.log('Connected to server')
    })

    socket.value.on('disconnect', () => {
      connected.value = false
      console.log('Disconnected from server')
    })

    // 玩家加入
    socket.value.on('player-joined', () => {
      opponentConnected.value = true
    })

    // 游戏开始
    socket.value.on('game-start', (data) => {
      gameStarted.value = true
      board.value.reset(data.boardSize)
      updateTurn(data.currentPlayer)
    })

    // 对方落子
    socket.value.on('piece-placed', (data) => {
      // 检查是否是自己的落子（已经本地更新过了，跳过）
      if (data.player === player.value) return
      
      // 对方落子
      board.value.cells[data.row][data.col] = data.player
      board.value.moveHistory.push({ row: data.row, col: data.col, player: data.player })
      board.value.lastMove = { row: data.row, col: data.col }
      updateTurn(data.currentPlayer)
    })

    // 游戏结束
    socket.value.on('game-over', (data) => {
      gameOver.value = true
      winner.value = data.winner
      saveOnlineHistory()
    })

    // 对方离开
    socket.value.on('player-left', (data) => {
      opponentConnected.value = false
      gameStarted.value = false
      error.value = '对方已离开房间'
    })

    // 悔棋请求
    socket.value.on('undo-requested', () => {
      waitingForUndo.value = true
    })

    // 悔棋完成
    socket.value.on('undo-completed', (data) => {
      if (board.value.moveHistory.length > 0) {
        const lastMove = board.value.moveHistory.pop()
        board.value.cells[lastMove.row][lastMove.col] = 0
      }
      board.value.lastMove = data.lastMove
      updateTurn(data.currentPlayer)
      waitingForUndo.value = false
    })

    // 重新开始请求
    socket.value.on('restart-requested', () => {
      waitingForRestart.value = true
    })

    // 重新开始
    socket.value.on('game-restarted', (data) => {
      board.value.reset(data.boardSize)
      gameOver.value = false
      winner.value = null
      updateTurn(data.currentPlayer)
      waitingForRestart.value = false
    })

    socket.value.on('connect_error', (err) => {
      error.value = '无法连接到服务器: ' + err.message
    })
  }

  // 断开连接
  function disconnect() {
    if (socket.value) {
      socket.value.disconnect()
      socket.value = null
    }
    resetState()
  }

  // 重置状态
  function resetState() {
    roomId.value = null
    player.value = null
    opponentConnected.value = false
    gameStarted.value = false
    board.value.reset(15)
    isMyTurn.value = false
    gameOver.value = false
    winner.value = null
    waitingForUndo.value = false
    waitingForRestart.value = false
    error.value = null
  }

  // 更新回合
  function updateTurn(currentPlayer) {
    isMyTurn.value = currentPlayer === player.value
  }

  // 创建房间
  function createRoom(callback) {
    if (!socket.value) {
      callback?.({ success: false, error: '未连接到服务器' })
      return
    }

    socket.value.emit('create-room', (response) => {
      if (response.success) {
        roomId.value = response.roomId
        player.value = response.player
        board.value.reset(response.boardSize)
      }
      callback?.(response)
    })
  }

  // 加入房间
  function joinRoom(inputRoomId, callback) {
    if (!socket.value) {
      callback?.({ success: false, error: '未连接到服务器' })
      return
    }

    const targetRoomId = inputRoomId.toUpperCase()
    socket.value.emit('join-room', targetRoomId, (response) => {
      if (response.success) {
        roomId.value = response.roomId
        player.value = response.player
        opponentConnected.value = true
      }
      callback?.(response)
    })
  }

  // 落子
  function placePiece(row, col) {
    if (!gameStarted.value || gameOver.value || !isMyTurn.value) return false
    
    // 检查位置是否有效
    if (!board.value.isEmpty(row, col)) return false

    // 本地先更新（乐观更新，提供更好的用户体验）
    board.value.cells[row][col] = player.value
    board.value.moveHistory.push({ row, col, player: player.value })
    board.value.lastMove = { row, col }
    isMyTurn.value = false // 先设为不是自己的回合，等待服务器响应
    
    socket.value.emit('place-piece', { row, col, player: player.value }, (response) => {
      if (!response.success) {
        // 如果服务器失败，回滚本地更新
        board.value.cells[row][col] = 0
        board.value.moveHistory.pop()
        board.value.lastMove = board.value.moveHistory.length > 0 
          ? board.value.moveHistory[board.value.moveHistory.length - 1] 
          : null
        isMyTurn.value = true
        error.value = response.error
      }
      // 如果成功，服务器会广播 piece-placed 事件
    })
    
    return true
  }

  // 请求悔棋
  function requestUndo() {
    socket.value?.emit('undo-request', (response) => {
      if (!response.success) {
        error.value = response.error
      }
    })
  }

  // 同意悔棋
  function acceptUndo() {
    socket.value?.emit('undo-accept', (response) => {
      if (!response.success) {
        error.value = response.error
      }
    })
  }

  // 拒绝悔棋
  function rejectUndo() {
    waitingForUndo.value = false
  }

  function saveOnlineHistory() {
    if (!gameOver.value || winner.value === null) return
    
    const myPlayer = player.value
    const playerWon = winner.value === myPlayer
    const playerColor = myPlayer === 1 ? '黑棋' : '白棋'
    
    const record = {
      gameMode: 'online',
      playerColor: playerColor,
      result: playerWon ? '胜利' : '失败',
      winner: winner.value === 1 ? '黑棋' : '白棋',
      totalMoves: board.value.moveHistory.length,
      totalTime: 0,
      roomId: roomId.value
    }
    
    saveToServer(record)
  }

  // 认输
  function resign() {
    socket.value?.emit('resign', (response) => {
      if (response.success) {
        gameOver.value = true
        winner.value = player.value === 1 ? 2 : 1
      }
    })
  }

  // 请求重新开始
  function requestRestart() {
    socket.value?.emit('restart-request', (response) => {
      if (!response.success) {
        error.value = response.error
      }
    })
  }

  // 同意重新开始
  function acceptRestart() {
    socket.value?.emit('restart-accept', (response) => {
      if (response.success) {
        board.value.reset(15)
        gameOver.value = false
        winner.value = null
        updateTurn(1)
      }
    })
  }

  // 拒绝重新开始
  function rejectRestart() {
    waitingForRestart.value = false
  }

  // 获取棋盘数据
  function getBoard() {
    return board.value
  }

  // 计算属性
  const currentPlayer = computed(() => board.value.currentPlayer)
  const cells = computed(() => board.value.cells)
  const boardSize = computed(() => board.value.size)
  const lastMove = computed(() => board.value.lastMove)
  const moveHistory = computed(() => board.value.moveHistory)

  return {
    // 状态
    socket,
    connected,
    roomId,
    player,
    opponentConnected,
    gameStarted,
    isMyTurn,
    gameOver,
    winner,
    waitingForUndo,
    waitingForRestart,
    error,
    
    // 计算属性
    currentPlayer,
    cells,
    boardSize,
    lastMove,
    moveHistory,
    
    // 方法
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
    getBoard,
  }
}

export default useOnlineGame
