/**
 * 棋盘类 - 管理五子棋棋盘状态
 */
export class Board {
  constructor(size = 15) {
    this.size = size
    this.cells = this.createEmptyBoard(size)
    this.moveHistory = []
    this.currentPlayer = 1 // 1: 黑棋, 2: 白棋
    this.gameOver = false
    this.winner = null
    this.lastMove = null // { row, col }
  }

  /**
   * 创建空棋盘
   */
  createEmptyBoard(size) {
    return Array(size).fill(null).map(() => Array(size).fill(0))
  }

  /**
   * 复位棋盘
   */
  reset(size = this.size) {
    this.size = size
    this.cells = this.createEmptyBoard(size)
    this.moveHistory = []
    this.currentPlayer = 1
    this.gameOver = false
    this.winner = null
    this.lastMove = null
  }

  /**
   * 复制棋盘
   */
  clone() {
    const newBoard = new Board(this.size)
    newBoard.cells = this.cells.map(row => [...row])
    newBoard.moveHistory = [...this.moveHistory]
    newBoard.currentPlayer = this.currentPlayer
    newBoard.gameOver = this.gameOver
    newBoard.winner = this.winner
    newBoard.lastMove = this.lastMove ? { ...this.lastMove } : null
    return newBoard
  }

  /**
   * 检查位置是否在棋盘内
   */
  isValidPosition(row, col) {
    return row >= 0 && row < this.size && col >= 0 && col < this.size
  }

  /**
   * 检查位置是否为空
   */
  isEmpty(row, col) {
    return this.isValidPosition(row, col) && this.cells[row][col] === 0
  }

  /**
   * 落子
   */
  placePiece(row, col, player = this.currentPlayer) {
    if (!this.isValidPosition(row, col) || this.cells[row][col] !== 0 || this.gameOver) {
      return false
    }

    this.cells[row][col] = player
    this.moveHistory.push({ row, col, player })
    this.lastMove = { row, col }

    // 检查胜利
    if (this.checkWin(row, col, player)) {
      this.gameOver = true
      this.winner = player
    }

    // 切换玩家
    this.currentPlayer = this.currentPlayer === 1 ? 2 : 1

    return true
  }

  /**
   * 撤销上一步棋
   */
  undo() {
    if (this.moveHistory.length === 0) return false

    const lastMove = this.moveHistory.pop()
    this.cells[lastMove.row][lastMove.col] = 0
    this.currentPlayer = lastMove.player
    this.gameOver = false
    this.winner = null

    if (this.moveHistory.length > 0) {
      this.lastMove = this.moveHistory[this.moveHistory.length - 1]
    } else {
      this.lastMove = null
    }

    return true
  }

  /**
   * 检查是否获胜
   */
  checkWin(row, col, player) {
    const directions = [
      [0, 1],   // 水平
      [1, 0],   // 垂直
      [1, 1],   // 对角线 \
      [1, -1]   // 对角线 /
    ]

    for (const [dx, dy] of directions) {
      let count = 1

      // 正方向
      let r = row + dx
      let c = col + dy
      while (this.isValidPosition(r, c) && this.cells[r][c] === player) {
        count++
        r += dx
        c += dy
      }

      // 反方向
      r = row - dx
      c = col - dy
      while (this.isValidPosition(r, c) && this.cells[r][c] === player) {
        count++
        r -= dx
        c -= dy
      }

      if (count >= 5) {
        return true
      }
    }

    return false
  }

  /**
   * 获取棋盘上所有已落子的位置
   */
  getOccupiedPositions() {
    const positions = []
    for (let row = 0; row < this.size; row++) {
      for (let col = 0; col < this.size; col++) {
        if (this.cells[row][col] !== 0) {
          positions.push({ row, col, player: this.cells[row][col] })
        }
      }
    }
    return positions
  }

  /**
   * 检查棋盘是否已满
   */
  isFull() {
    return this.moveHistory.length >= this.size * this.size
  }

  /**
   * 导出棋盘状态（用于存档）
   */
  exportState() {
    return {
      size: this.size,
      cells: this.cells.map(row => [...row]),
      moveHistory: [...this.moveHistory],
      currentPlayer: this.currentPlayer,
      gameOver: this.gameOver,
      winner: this.winner,
      lastMove: this.lastMove ? { ...this.lastMove } : null
    }
  }

  /**
   * 导入棋盘状态（用于读档）
   */
  importState(state) {
    this.size = state.size
    this.cells = state.cells.map(row => [...row])
    this.moveHistory = [...state.moveHistory]
    this.currentPlayer = state.currentPlayer
    this.gameOver = state.gameOver
    this.winner = state.winner
    this.lastMove = state.lastMove ? { ...state.lastMove } : null
  }
}

export default Board
