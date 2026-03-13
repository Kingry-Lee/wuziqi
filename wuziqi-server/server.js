const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

const rooms = new Map();

const gameHistory = []
const HISTORY_FILE = './game_history.json'
const fs = require('fs')

function loadHistory() {
  try {
    if (fs.existsSync(HISTORY_FILE)) {
      const data = fs.readFileSync(HISTORY_FILE, 'utf8')
      const parsed = JSON.parse(data)
      if (Array.isArray(parsed)) {
        parsed.forEach(record => gameHistory.push(record))
      }
    }
  } catch (e) {
    console.log('No history file found')
  }
}

function saveHistory() {
  try {
    fs.writeFileSync(HISTORY_FILE, JSON.stringify(gameHistory.slice(-1000), null, 2))
  } catch (e) {
    console.error('Failed to save history:', e)
  }
}

loadHistory()

// 生成房间ID
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  // 创建房间
  socket.on('create-room', (callback) => {
    const roomId = generateRoomId();
    const room = {
      id: roomId,
      host: socket.id,
      guest: null,
      gameState: null,
      currentPlayer: 1,
      boardSize: 15,
      createdAt: Date.now()
    };
    
    rooms.set(roomId, room);
    socket.join(roomId);
    socket.roomId = roomId;
    socket.player = 1; // 房主是黑棋
    
    console.log('Room created:', roomId);
    
    callback({ 
      success: true, 
      roomId, 
      player: 1,
      boardSize: room.boardSize
    });
  });

  // 加入房间
  socket.on('join-room', (roomId, callback) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      callback({ success: false, error: '房间不存在' });
      return;
    }
    
    if (room.guest) {
      callback({ success: false, error: '房间已满' });
      return;
    }
    
    room.guest = socket.id;
    socket.join(roomId);
    socket.roomId = roomId;
    socket.player = 2; // 访客是白棋
    
    // 通知房主有玩家加入
    io.to(room.host).emit('player-joined', { player: 2 });
    
    // 通知双方游戏可以开始
    io.to(roomId).emit('game-start', {
      boardSize: room.boardSize,
      currentPlayer: room.currentPlayer
    });
    
    console.log('Player joined room:', roomId);
    
    callback({ 
      success: true, 
      roomId, 
      player: 2,
      boardSize: room.boardSize,
      host: room.host
    });
  });

  // 落子
  socket.on('place-piece', (data, callback) => {
    const { row, col, player } = data;
    const roomId = socket.roomId;
    
    if (!roomId) {
      callback?.({ success: false, error: '未在房间中' });
      return;
    }
    
    const room = rooms.get(roomId);
    if (!room) {
      callback?.({ success: false, error: '房间不存在' });
      return;
    }
    
    // 验证是否是当前玩家
    if (player !== room.currentPlayer) {
      callback?.({ success: false, error: '不是你的回合' });
      return;
    }
    
    // 记录落子
    if (!room.gameState) {
      room.gameState = {
        cells: Array(room.boardSize).fill(null).map(() => Array(room.boardSize).fill(0)),
        moveHistory: [],
        winner: null,
        gameOver: false
      };
    }
    
    // 检查位置是否为空
    if (room.gameState.cells[row][col] !== 0) {
      callback?.({ success: false, error: '位置已有棋子' });
      return;
    }
    
    // 落子
    room.gameState.cells[row][col] = player;
    room.gameState.moveHistory.push({ row, col, player });
    room.gameState.lastMove = { row, col };
    
    // 检查胜利
    if (checkWin(room.gameState.cells, row, col, player, room.boardSize)) {
      room.gameState.gameOver = true;
      room.gameState.winner = player;
      io.to(roomId).emit('game-over', { winner: player });
    } else {
      // 切换玩家
      room.currentPlayer = room.currentPlayer === 1 ? 2 : 1;
      io.to(roomId).emit('piece-placed', { 
        row, 
        col, 
        player,
        currentPlayer: room.currentPlayer
      });
    }
    
    callback?.({ success: true });
  });

  // 悔棋
  socket.on('undo-request', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    
    // 通知对方
    socket.to(roomId).emit('undo-requested');
    callback?.({ success: true });
  });

  // 同意悔棋
  socket.on('undo-accept', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room || !room.gameState) return;
    
    // 撤销最后一步
    if (room.gameState.moveHistory.length > 0) {
      const lastMove = room.gameState.moveHistory.pop();
      room.gameState.cells[lastMove.row][lastMove.col] = 0;
      room.currentPlayer = lastMove.player;
      room.gameState.lastMove = room.gameState.moveHistory.length > 0 
        ? room.gameState.moveHistory[room.gameState.moveHistory.length - 1] 
        : null;
      
      io.to(roomId).emit('undo-completed', {
        currentPlayer: room.currentPlayer,
        lastMove: room.gameState.lastMove
      });
    }
    
    callback?.({ success: true });
  });

  // 认输
  socket.on('resign', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    const winner = socket.player === 1 ? 2 : 1;
    room.gameState = {
      ...room.gameState,
      gameOver: true,
      winner
    };
    
    io.to(roomId).emit('game-over', { winner, resigned: true });
    callback?.({ success: true });
  });

  // 重新开始
  socket.on('restart-request', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    socket.to(roomId).emit('restart-requested');
    callback?.({ success: true });
  });

  socket.on('restart-accept', (callback) => {
    const roomId = socket.roomId;
    if (!roomId) return;
    
    const room = rooms.get(roomId);
    if (!room) return;
    
    // 重置游戏状态
    room.gameState = null;
    room.currentPlayer = 1;
    
    io.to(roomId).emit('game-restarted', {
      boardSize: room.boardSize,
      currentPlayer: 1
    });
    
    callback?.({ success: true });
  });

  // 断开连接
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    const roomId = socket.roomId;
    if (roomId) {
      const room = rooms.get(roomId);
      if (room) {
        // 通知房间内其他人
        socket.to(roomId).emit('player-left', { player: socket.player });
        
        // 清理房间
        if (room.host === socket.id || room.guest === socket.id) {
          rooms.delete(roomId);
          console.log('Room deleted:', roomId);
        }
      }
    }
  });
});

// 检查胜利
function checkWin(cells, row, col, player, boardSize) {
  const directions = [[0, 1], [1, 0], [1, 1], [1, -1]];
  
  for (const [dx, dy] of directions) {
    let count = 1;
    
    // 正方向
    let r = row + dx;
    let c = col + dy;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && cells[r][c] === player) {
      count++;
      r += dx;
      c += dy;
    }
    
    // 反方向
    r = row - dx;
    c = col - dy;
    while (r >= 0 && r < boardSize && c >= 0 && c < boardSize && cells[r][c] === player) {
      count++;
      r -= dx;
      c -= dy;
    }
    
    if (count >= 5) return true;
  }
  
  return false;
}

app.get('/health', (req, res) => {
  res.json({ status: 'ok', rooms: rooms.size });
});

app.get('/api/history', (req, res) => {
  const limit = parseInt(req.query.limit) || 50
  const offset = parseInt(req.query.offset) || 0
  const sorted = [...gameHistory].sort((a, b) => b.date - a.date)
  const paginated = sorted.slice(offset, offset + limit)
  res.json({ 
    success: true, 
    total: gameHistory.length,
    data: paginated 
  })
});

app.post('/api/history', (req, res) => {
  const { gameMode, playerColor, result, winner, totalMoves, totalTime, roomId } = req.body
  
  const record = {
    id: Date.now(),
    date: new Date().toISOString(),
    gameMode: gameMode || 'ai',
    playerColor: playerColor || '黑棋',
    result: result || '未知',
    winner: winner || '',
    totalMoves: totalMoves || 0,
    totalTime: totalTime || 0,
    roomId: roomId || null,
    ip: req.ip || req.connection?.remoteAddress || 'unknown'
  }
  
  gameHistory.push(record)
  saveHistory()
  
  res.json({ success: true, id: record.id })
})

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
