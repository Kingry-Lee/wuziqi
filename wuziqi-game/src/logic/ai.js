import { Board } from './board'

/**
 * AI 模块 - 提供4个难度级别的AI对手
 */
export class AI {
  constructor(difficulty = 'normal') {
    this.difficulty = difficulty
    this.setDifficulty(difficulty)
  }

  /**
   * 设置难度
   */
  setDifficulty(difficulty) {
    this.difficulty = difficulty
    
    switch (difficulty) {
      case 'beginner':
        this.maxDepth = 1
        this.randomness = 0.8 // 80% 随机落子
        break
      case 'easy':
        this.maxDepth = 2
        this.randomness = 0.3
        break
      case 'normal':
        this.maxDepth = 3
        this.randomness = 0.1
        break
      case 'hard':
        this.maxDepth = 4
        this.randomness = 0
        break
      default:
        this.maxDepth = 3
        this.randomness = 0.1
    }
  }

  /**
   * 获取AI下一步棋
   */
  getNextMove(board, player = 2) {
    // 随机难度
    if (Math.random() < this.randomness) {
      return this.getRandomMove(board)
    }

    // 获取所有合法位置
    const moves = this.getValidMoves(board)
    
    if (moves.length === 0) return null
    
    if (moves.length === 1) return moves[0]

    // 根据难度使用不同的搜索深度
    let bestMove = null
    let bestScore = -Infinity

    // 优先考虑：进攻或防守
    for (const move of moves) {
      const score = this.evaluateMove(board, move, player, this.maxDepth)
      if (score > bestScore) {
        bestScore = score
        bestMove = move
      }
    }

    return bestMove
  }

  /**
   * 获取随机落子
   */
  getRandomMove(board) {
    const moves = this.getValidMoves(board)
    if (moves.length === 0) return null
    return moves[Math.floor(Math.random() * moves.length)]
  }

  /**
   * 获取所有合法落子位置（只考虑已有棋子周围的位置）
   */
  getValidMoves(board, expandRadius = 2) {
    const moves = new Set()
    const occupied = board.getOccupiedPositions()

    if (occupied.length === 0) {
      // 第一步棋，选择中心位置
      const center = Math.floor(board.size / 2)
      return [{ row: center, col: center }]
    }

    // 收集所有已有棋子周围的位置
    for (const pos of occupied) {
      for (let dr = -expandRadius; dr <= expandRadius; dr++) {
        for (let dc = -expandRadius; dc <= expandRadius; dc++) {
          const row = pos.row + dr
          const col = pos.col + dc
          if (board.isEmpty(row, col)) {
            moves.add(`${row},${col}`)
          }
        }
      }
    }

    // 转换为数组并添加分数评估
    const moveArray = Array.from(moves).map(key => {
      const [row, col] = key.split(',').map(Number)
      return { row, col }
    })

    // 按位置评估排序，优先考虑靠近已有棋子的位置
    return moveArray.sort((a, b) => {
      const scoreA = this.evaluatePosition(board, a.row, a.col)
      const scoreB = this.evaluatePosition(board, b.row, b.col)
      return scoreB - scoreA
    })
  }

  /**
   * 评估位置的价值
   */
  evaluatePosition(board, row, col) {
    let score = 0
    const directions = [[0, 1], [1, 0], [1, 1], [1, -1]]
    const player = board.currentPlayer
    const opponent = player === 1 ? 2 : 1

    for (const [dx, dy] of directions) {
      // 评估这个位置对双方的价值
      const playerScore = this.evaluateDirection(board, row, col, dx, dy, player)
      const opponentScore = this.evaluateDirection(board, row, col, dx, dy, opponent)

      // 攻击和防守的综合评估
      score += Math.max(playerScore, opponentScore * 0.9)
    }

    // 中心位置加分
    const center = Math.floor(board.size / 2)
    const distFromCenter = Math.abs(row - center) + Math.abs(col - center)
    score += (board.size - distFromCenter) * 0.1

    return score
  }

  /**
   * 评估某个方向的价值
   */
  evaluateDirection(board, row, col, dx, dy, player) {
    let score = 0
    let count = 1
    let openEnds = 0

    // 正方向
    let r = row + dx
    let c = col + dy
    let blocked = false
    while (board.isValidPosition(r, c)) {
      if (board.cells[r][c] === player) {
        count++
      } else if (board.cells[r][c] === 0) {
        openEnds++
        break
      } else {
        blocked = true
        break
      }
      r += dx
      c += dy
    }
    if (!board.isValidPosition(r, c) || board.cells[r][c] !== 0) {
      // 如果出界或被挡住，不加分
    }

    // 反方向
    r = row - dx
    c = col - dy
    while (board.isValidPosition(r, c)) {
      if (board.cells[r][c] === player) {
        count++
      } else if (board.cells[r][c] === 0) {
        openEnds++
        break
      } else {
        break
      }
      r -= dx
      c -= dy
    }

    // 根据连子数和两端开放情况打分
    if (count >= 5) score += 100000 // 必胜
    else if (count === 4) {
      if (openEnds === 2) score += 10000 // 活四
      else if (openEnds === 1) score += 1000 // 冲四
    } else if (count === 3) {
      if (openEnds === 2) score += 1000 // 活三
      else if (openEnds === 1) score += 100 // 眠三
    } else if (count === 2) {
      if (openEnds === 2) score += 100 // 活二
      else if (openEnds === 1) score += 10
    } else if (count === 1 && openEnds > 0) {
      score += 1
    }

    return score
  }

  /**
   * 评估落子位置（带搜索深度）
   */
  evaluateMove(board, move, player, depth) {
    // 尝试落子
    const tempBoard = board.clone()
    tempBoard.placePiece(move.row, move.col, player)

    // 如果能赢，直接返回最高分
    if (tempBoard.gameOver && tempBoard.winner === player) {
      return 1000000
    }

    // 评估位置本身的价值
    let score = this.evaluatePosition(board, move.row, move.col)

    // 如果深度大于1，进行递归评估
    if (depth > 1) {
      const opponent = player === 1 ? 2 : 1
      const opponentMoves = this.getValidMoves(tempBoard)
      
      // 评估对手的最佳回应
      let bestOpponentResponse = -Infinity
      for (const oppMove of opponentMoves.slice(0, 5)) { // 只考虑前5个最佳回应
        const oppScore = this.evaluateMove(tempBoard, oppMove, opponent, depth - 1)
        bestOpponentResponse = Math.max(bestOpponentResponse, oppScore)
      }

      score -= bestOpponentResponse * 0.8 // 考虑对手的回应
    }

    return score
  }

  /**
   * 评估整个棋盘局势（静态评估）
   */
  evaluateBoard(board, player) {
    let score = 0
    
    // 评估所有已落子位置
    const occupied = board.getOccupiedPositions()
    for (const pos of occupied) {
      const pieceScore = this.evaluatePosition(board, pos.row, pos.col)
      if (pos.player === player) {
        score += pieceScore
      } else {
        score -= pieceScore
      }
    }

    return score
  }
}

export default AI
