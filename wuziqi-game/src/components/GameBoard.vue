<template>
  <div class="game-board" ref="boardContainer" @mouseenter="$emit('mouseenter')" @mouseleave="$emit('mouseleave')">
    <canvas ref="boardCanvas" @click="handleClick" @mousemove="handleMouseMove" @mouseleave="handleMouseLeave"></canvas>
    <!-- 棋子层 -->
    <div class="pieces-layer">
      <div 
        v-for="(pos, index) in piecePositions" 
        :key="'piece'+index"
        class="piece"
        :class="[pos.player === 1 ? 'black' : 'white', { 'last-piece': isLastMove(pos) }]"
        :style="getPieceStyle(pos)"
      >
        <div v-if="isLastMove(pos)" class="last-move-indicator"></div>
      </div>
      <!-- 悬停提示 -->
      <div 
        v-if="hoverPos && !boardData.gameOver && !boardData.isMyTurn"
        class="hover-piece"
        :class="boardData.currentPlayer === 1 ? 'black' : 'white'"
        :style="getPieceStyle(hoverPos)"
      ></div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch } from 'vue'
import { useGame } from '../composables/useGame'

const props = defineProps({
  mode: {
    type: String,
    default: 'ai'
  },
  onlineGame: {
    type: Object,
    default: null
  },
  zenMode: {
    type: Boolean,
    default: false
  }
})

defineEmits(['mouseenter', 'mouseleave'])

const { cells, boardSize, currentPlayer, gameOver, lastMove, isAIThinking, placePiece } = useGame()

const boardContainer = ref(null)
const boardCanvas = ref(null)
const hoverPos = ref(null)

let ctx = null

// 获取所有棋子位置（使用 boardData）
const piecePositions = computed(() => {
  const positions = []
  const cellsData = boardData.value.cells
  const size = boardData.value.boardSize
  
  if (!cellsData || !Array.isArray(cellsData)) return positions
  
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (cellsData[row] && cellsData[row][col] !== 0) {
        positions.push({ row, col, player: cellsData[row][col] })
      }
    }
  }
  return positions
})

// 根据模式获取棋盘数据
const boardData = computed(() => {
  // 在线模式
  if (props.mode === 'online' && props.onlineGame) {
    return {
      cells: props.onlineGame.cells.value || [],
      boardSize: props.onlineGame.boardSize.value || 15,
      currentPlayer: props.onlineGame.currentPlayer.value || 1,
      gameOver: props.onlineGame.gameOver.value || false,
      lastMove: props.onlineGame.lastMove.value || null,
      isMyTurn: props.onlineGame.isMyTurn.value || false
    }
  }
  // 本地/AI 模式
  return {
    cells: cells.value,
    boardSize: boardSize.value,
    currentPlayer: currentPlayer.value,
    gameOver: gameOver.value,
    lastMove: lastMove.value,
    isMyTurn: true
  }
})

function isLastMove(pos) {
  return boardData.value.lastMove && boardData.value.lastMove.row === pos.row && boardData.value.lastMove.col === pos.col
}

function getPieceStyle(pos) {
  const size = boardData.value.boardSize || 15
  const container = boardContainer.value
  
  if (!container) {
    const paddingPercent = 5
    const gridPercent = (100 - 2 * paddingPercent) / (size - 1)
    const leftPercent = paddingPercent + pos.col * gridPercent
    const topPercent = paddingPercent + pos.row * gridPercent
    return {
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
    }
  }
  
  // 使用容器的实际尺寸
  const rect = container.getBoundingClientRect()
  const width = rect.width
  const height = rect.height
  
  if (width === 0 || height === 0) {
    const paddingPercent = 5
    const gridPercent = (100 - 2 * paddingPercent) / (size - 1)
    const leftPercent = paddingPercent + pos.col * gridPercent
    const topPercent = paddingPercent + pos.row * gridPercent
    return {
      left: `${leftPercent}%`,
      top: `${topPercent}%`,
    }
  }
  
  const padding = 20
  const gridSize = (Math.min(width, height) - padding * 2) / (size - 1)
  
  const x = padding + pos.col * gridSize
  const y = padding + pos.row * gridSize
  
  const leftPercent = (x / width) * 100
  const topPercent = (y / height) * 100
  
  return {
    left: `${leftPercent}%`,
    top: `${topPercent}%`,
  }
}

function drawBoard() {
  // 强制获取 context
  if (boardCanvas.value) {
    ctx = boardCanvas.value.getContext('2d')
  }
  if (!ctx || !boardCanvas.value) return
  
  const canvas = boardCanvas.value
  const container = boardContainer.value
  
  // 使用容器尺寸，如果为0则使用默认值
  let width = 400
  let height = 400
  
  if (container) {
    const rect = container.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      width = rect.width
      height = rect.height
    }
  }
  
  canvas.width = width
  canvas.height = height
  
  // 使用默认大小 15
  const size = 15
  const padding = 20
  const gridSize = (Math.min(width, height) - padding * 2) / (size - 1)
  
  // 使用 CSS 变量获取颜色
  const boardColor = getComputedStyle(document.documentElement).getPropertyValue('--color-board').trim() || '#deb887'
  const lineColor = getComputedStyle(document.documentElement).getPropertyValue('--color-board-line').trim() || '#8b4513'
  
  // 清空画布 - 木纹色背景
  ctx.fillStyle = boardColor
  ctx.fillRect(0, 0, width, height)
  
  // 画网格线 - 使用主题颜色
  ctx.strokeStyle = lineColor
  ctx.lineWidth = 1
  
  for (let i = 0; i < size; i++) {
    const pos = padding + i * gridSize
    
    // 横线
    ctx.beginPath()
    ctx.moveTo(padding, pos)
    ctx.lineTo(padding + (size - 1) * gridSize, pos)
    ctx.stroke()
    
    // 竖线
    ctx.beginPath()
    ctx.moveTo(pos, padding)
    ctx.lineTo(pos, padding + (size - 1) * gridSize)
    ctx.stroke()
  }
  
  // 画星位
  const starPoints = [
    { row: 3, col: 3 },
    { row: 3, col: 11 },
    { row: 11, col: 3 },
    { row: 11, col: 11 },
    { row: 7, col: 7 }
  ]
  
  ctx.fillStyle = lineColor
  for (const star of starPoints) {
    const x = padding + star.col * gridSize
    const y = padding + star.row * gridSize
    ctx.beginPath()
    ctx.arc(x, y, 4, 0, Math.PI * 2)
    ctx.fill()
  }
}

function handleClick(e) {
  if (!boardCanvas.value) return
  
  // 获取 canvas 相对于视口的位置
  const canvas = boardCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  // 计算点击在 canvas 内的坐标
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  
  // 在线模式检查
  if (props.mode === 'online' && props.onlineGame) {
    const game = props.onlineGame
    
    // 游戏未开始或已结束，不能落子
    if (!game.gameStarted.value) return
    if (game.gameOver.value) return
    if (!game.isMyTurn.value) return
    
    // 使用固定的棋盘尺寸计算
    const size = 15
    const padding = 20
    const cellSize = (canvas.width - padding * 2) / (size - 1)
    
    // 计算最近的交叉点
    const col = Math.round((x - padding) / cellSize)
    const row = Math.round((y - padding) / cellSize)
    
    // cells 是计算属性，需要 .value 访问
    const gameCells = game.cells.value
    if (row >= 0 && row < size && col >= 0 && col < size) {
      if (gameCells && gameCells[row] && gameCells[row][col] === 0) {
        game.placePiece(row, col)
      }
    }
    return
  }
  
  // 本地/AI 模式
  if (gameOver.value || isAIThinking.value) return
  
  const size = boardSize.value
  const padding = 20
  const cellSize = (canvas.width - padding * 2) / (size - 1)
  
  const col = Math.round((x - padding) / cellSize)
  const row = Math.round((y - padding) / cellSize)
  
  if (row >= 0 && row < size && col >= 0 && col < size) {
    if (cells.value[row][col] === 0) {
      placePiece(row, col)
    }
  }
}

function handleMouseMove(e) {
  if (!boardCanvas.value) return
  
  const canvas = boardCanvas.value
  const rect = canvas.getBoundingClientRect()
  
  // 计算鼠标在 canvas 内的坐标
  const scaleX = canvas.width / rect.width
  const scaleY = canvas.height / rect.height
  const x = (e.clientX - rect.left) * scaleX
  const y = (e.clientY - rect.top) * scaleY
  
  // 在线模式
  if (props.mode === 'online' && props.onlineGame) {
    const game = props.onlineGame
    if (!game.gameStarted.value || game.gameOver.value || !game.isMyTurn.value) {
      hoverPos.value = null
      return
    }
    
    const size = 15
    const padding = 20
    const cellSize = (canvas.width - padding * 2) / (size - 1)
    
    const col = Math.round((x - padding) / cellSize)
    const row = Math.round((y - padding) / cellSize)
    
    // cells 是计算属性，需要 .value 访问
    const gameCells = game.cells.value
    if (row >= 0 && row < size && col >= 0 && col < size) {
      if (gameCells && gameCells[row] && gameCells[row][col] === 0) {
        hoverPos.value = { row, col }
      } else {
        hoverPos.value = null
      }
    } else {
      hoverPos.value = null
    }
    return
  }
  
  // 本地/AI 模式
  if (boardData.value.gameOver || isAIThinking.value) {
    hoverPos.value = null
    return
  }
  
  const size = boardData.value.boardSize
  const padding = 20
  const cellSize = (canvas.width - padding * 2) / (size - 1)
  
  const col = Math.round((x - padding) / cellSize)
  const row = Math.round((y - padding) / cellSize)
  
  if (row >= 0 && row < size && col >= 0 && col < size) {
    if (boardData.value.cells[row] && boardData.value.cells[row][col] === 0) {
      hoverPos.value = { row, col }
    } else {
      hoverPos.value = null
    }
  } else {
    hoverPos.value = null
  }
}

function handleMouseLeave() {
  hoverPos.value = null
}

function handleResize() {
  drawBoard()
}

// 使用 ResizeObserver 监听容器大小变化
let resizeObserver = null

// 监听棋盘数据变化
watch(() => boardData.value.boardSize, () => {
  setTimeout(drawBoard, 100)
})

watch(() => boardData.value.cells, () => {
  // 棋子位置通过Vue渲染，不需要重画
}, { deep: true })

// 监听模式变化，确保重绘
watch(() => props.mode, (newMode) => {
  // 强制重新获取 context 并重绘
  setTimeout(() => {
    ctx = null
    drawBoard()
  }, 100)
})

watch(() => props.onlineGame?.gameStarted, () => {
  setTimeout(drawBoard, 100)
})

// 监听 onlineGame 对象本身的变化
watch(() => props.onlineGame, (newVal) => {
  if (newVal) {
    setTimeout(() => {
      ctx = null
      drawBoard()
    }, 100)
  }
}, { deep: true })

onMounted(() => {
  // 等待 DOM 渲染完成后初始化 canvas
  setTimeout(() => {
    if (boardCanvas.value) {
      ctx = boardCanvas.value.getContext('2d')
      drawBoard()
      
      // 使用 ResizeObserver 监听容器大小变化
      if (boardContainer.value) {
        resizeObserver = new ResizeObserver(() => {
          drawBoard()
        })
        resizeObserver.observe(boardContainer.value)
      }
    }
  }, 50)
})

onUnmounted(() => {
  if (resizeObserver) {
    resizeObserver.disconnect()
  }
  window.removeEventListener('resize', handleResize)
})
</script>

<style scoped>
.game-board {
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: var(--border-radius-panel);
  box-shadow: 
    0 4px 20px rgba(0, 0, 0, 0.3),
    inset 0 0 0 3px var(--color-board-line);
  overflow: hidden;
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.pieces-layer {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

.piece {
  position: absolute;
  width: 5.2%;
  height: 5.2%;
  border-radius: var(--border-radius-piece);
  transform: translate(-50%, -50%);
  box-shadow: 
    2px 2px 4px rgba(0, 0, 0, 0.4),
    -1px -1px 2px rgba(255, 255, 255, 0.2);
  pointer-events: none;
  transition: transform 0.1s ease;
}

.piece.black {
  background: radial-gradient(circle at 30% 30%, #444, var(--color-black-piece));
}

.piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, var(--color-white-piece));
}

.piece.last-piece {
  transform: translate(-50%, -50%) scale(1.15);
}

.last-move-indicator {
  position: absolute;
  top: 50%;
  left: 50%;
  width: 30%;
  height: 30%;
  border-radius: 50%;
  transform: translate(-50%, -50%);
}

.piece.black .last-move-indicator {
  background: var(--color-white-piece);
}

.piece.white .last-move-indicator {
  background: var(--color-black-piece);
}

.hover-piece {
  position: absolute;
  width: 5.2%;
  height: 5.2%;
  border-radius: var(--border-radius-piece);
  transform: translate(-50%, -50%);
  opacity: 0.5;
  pointer-events: none;
}

.hover-piece.black {
  background: radial-gradient(circle at 30% 30%, #444, var(--color-black-piece));
}

.hover-piece.white {
  background: radial-gradient(circle at 30% 30%, #fff, var(--color-white-piece));
}
</style>
