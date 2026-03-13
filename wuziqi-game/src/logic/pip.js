export function getPipHtml(theme, initialCells = [], initialLastMove = null) {
  const boardColor = theme?.colors?.board || '#deb887'
  const lineColor = theme?.colors?.boardLine || '#8b4513'
  const blackPiece = theme?.colors?.blackPiece || '#1a1a1a'
  const whitePiece = theme?.colors?.whitePiece || '#f5f5f5'
  const cellsJson = JSON.stringify(initialCells)
  const lastMoveJson = JSON.stringify(initialLastMove)
  
  return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>五子棋</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    html, body { 
      width: 100%; 
      height: 100%; 
      overflow: hidden;
      background: #1a1a2e;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  </style>
</head>
<body>
  <canvas id="board"></canvas>
  <script>
    console.log('[PiP] Script starting...');
    window.onerror = function(msg, url, line) {
      console.error('[PiP Error]', msg, 'at line', line);
    };
    
    const canvas = document.getElementById('board');
    console.log('[PiP] Canvas element:', canvas);
    const ctx = canvas.getContext('2d');
    let cells = ${cellsJson};
    let lastMove = ${lastMoveJson};
    const boardColor = '${boardColor}';
    const lineColor = '${lineColor}';
    const blackPieceColor = '${blackPiece}';
    const whitePieceColor = '${whitePiece}';
    
    console.log('[PiP] Initial cells:', cells);
    console.log('[PiP] Initial lastMove:', lastMove);
    
    function resize() {
      const dpr = window.devicePixelRatio || 1;
      const displaySize = Math.min(window.innerWidth, window.innerHeight, 400);
      canvas.width = displaySize * dpr;
      canvas.height = displaySize * dpr;
      canvas.style.width = displaySize + 'px';
      canvas.style.height = displaySize + 'px';
      ctx.scale(dpr, dpr);
      console.log('[PiP] Canvas resized to:', displaySize * dpr, 'x', displaySize * dpr);
      draw();
    }
    
    function draw() {
      const w = parseInt(canvas.style.width) || 400;
      const h = parseInt(canvas.style.height) || 400;
      const size = 15;
      const padding = 15;
      const gridSize = Math.min(w, h) * 0.9 / (size - 1);
      const offsetX = (w - (size - 1) * gridSize) / 2;
      const offsetY = (h - (size - 1) * gridSize) / 2;
      
      ctx.fillStyle = boardColor;
      ctx.fillRect(0, 0, w, h);
      
      ctx.strokeStyle = lineColor;
      ctx.lineWidth = 1;
      
      for (let i = 0; i < size; i++) {
        ctx.beginPath();
        ctx.moveTo(offsetX, offsetY + i * gridSize);
        ctx.lineTo(offsetX + (size - 1) * gridSize, offsetY + i * gridSize);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(offsetX + i * gridSize, offsetY);
        ctx.lineTo(offsetX + i * gridSize, offsetY + (size - 1) * gridSize);
        ctx.stroke();
      }
      
      const starPoints = [[3,3], [3,7], [3,11], [7,3], [7,7], [7,11], [11,3], [11,7], [11,11]];
      ctx.fillStyle = lineColor;
      for (const [r, c] of starPoints) {
        ctx.beginPath();
        ctx.arc(offsetX + r * gridSize, offsetY + c * gridSize, 3, 0, Math.PI * 2);
        ctx.fill();
      }
      
      if (cells && cells.length > 0) {
        for (let row = 0; row < size; row++) {
          for (let col = 0; col < size; col++) {
            if (cells[row] && cells[row][col] !== 0) {
              const x = offsetX + col * gridSize;
              const y = offsetY + row * gridSize;
              const r = gridSize * 0.4;
              
              ctx.beginPath();
              ctx.arc(x, y, r, 0, Math.PI * 2);
              ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
              ctx.shadowBlur = 3;
              ctx.shadowOffsetX = 2;
              ctx.shadowOffsetY = 2;
              
              if (cells[row][col] === 1) {
                const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
                grad.addColorStop(0, '#666');
                grad.addColorStop(1, blackPieceColor);
                ctx.fillStyle = grad;
              } else {
                const grad = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
                grad.addColorStop(0, '#fff');
                grad.addColorStop(1, whitePieceColor);
                ctx.fillStyle = grad;
              }
              ctx.fill();
              
              ctx.shadowColor = 'transparent';
              ctx.shadowBlur = 0;
              ctx.shadowOffsetX = 0;
              ctx.shadowOffsetY = 0;
              
              if (lastMove && lastMove.row === row && lastMove.col === col) {
                ctx.beginPath();
                ctx.arc(x, y, r * 0.25, 0, Math.PI * 2);
                ctx.fillStyle = cells[row][col] === 1 ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.5)';
                ctx.fill();
              }
            }
          }
        }
      }
    }
    
    canvas.addEventListener('click', function(e) {
      const rect = canvas.getBoundingClientRect();
      const x = (e.clientX - rect.left) * (canvas.width / rect.width);
      const y = (e.clientY - rect.top) * (canvas.height / rect.height);
      
      const w = canvas.width;
      const h = canvas.height;
      const size = 15;
      const gridSize = Math.min(w, h) * 0.9 / (size - 1);
      const offsetX = (w - (size - 1) * gridSize) / 2;
      const offsetY = (h - (size - 1) * gridSize) / 2;
      
      const col = Math.round((x - offsetX) / gridSize);
      const row = Math.round((y - offsetY) / gridSize);
      
      if (row >= 0 && row < size && col >= 0 && col < size) {
        console.log('[PiP] Click at row:', row, 'col:', col);
        try {
          if (window.opener) {
            window.opener.postMessage({ type: 'pip-click', row, col }, '*');
          }
        } catch(err) {
          console.error('[PiP] postMessage error:', err);
        }
      }
    });
    
    window.addEventListener('message', function(e) {
      if (e.data.type === 'pip-update') {
        cells = e.data.cells || [];
        lastMove = e.data.lastMove || null;
        draw();
      }
    });
    
    window.addEventListener('resize', resize);
    resize();
  <` + `/script>
</body>
</html>`
}
