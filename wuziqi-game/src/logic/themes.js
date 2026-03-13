export const themes = {
  default: {
    name: '默认',
    description: '紫蓝渐变',
    colors: {
      primary: '#667eea',
      secondary: '#764ba2',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      board: '#deb887',
      boardLine: '#8b4513',
      blackPiece: '#1a1a1a',
      whitePiece: '#f5f5f5',
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.8)',
      button: 'rgba(255,255,255,0.2)',
      buttonHover: 'rgba(255,255,255,0.35)',
      buttonActive: '#4caf50',
      panel: 'white',
      panelText: '#333333',
      border: 'rgba(255,255,255,0.5)',
      accent: '#4caf50',
      buttonText: '#333333',
    },
    borderRadius: {
      button: '20px',
      panel: '16px',
      piece: '50%',
    },
    fonts: {
      family: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif",
    },
  },
  pixel: {
    name: '像素',
    description: '复古像素风',
    colors: {
      primary: '#8b4513',
      secondary: '#2d1b0e',
      background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 100%)',
      board: '#3d2914',
      boardLine: '#f4a460',
      blackPiece: '#000000',
      whitePiece: '#ffffff',
      text: '#00ff00',
      textSecondary: '#00cc00',
      button: '#00cc00',
      buttonHover: '#00ff00',
      buttonActive: '#00ff00',
      panel: '#2d2d44',
      panelText: '#00ff00',
      border: '#00ff00',
      accent: '#ff6b6b',
      buttonText: '#1a1a2e',
    },
    borderRadius: {
      button: '0px',
      panel: '0px',
      piece: '50%',
    },
    fonts: {
      family: "'Press Start 2P', 'Courier New', monospace",
    },
    boxShadow: '4px 4px 0px #00ff00',
  },
  neon: {
    name: '霓虹',
    description: '赛博朋克',
    colors: {
      primary: '#ff00ff',
      secondary: '#00ffff',
      background: 'linear-gradient(135deg, #0f0c29 0%, #302b63 50%, #24243e 100%)',
      board: '#1a1a2e',
      boardLine: '#ff00ff',
      blackPiece: '#ff00ff',
      whitePiece: '#00ffff',
      text: '#ffffff',
      textSecondary: '#cccccc',
      button: 'rgba(255,0,255,0.3)',
      buttonHover: 'rgba(255,0,255,0.5)',
      buttonActive: '#00ffff',
      panel: 'rgba(26,26,46,0.95)',
      panelText: '#ffffff',
      border: '#ff00ff',
      accent: '#00ffff',
      buttonText: '#ffffff',
    },
    borderRadius: {
      button: '8px',
      panel: '16px',
      piece: '50%',
    },
    fonts: {
      family: "'Orbitron', 'Courier New', monospace",
    },
    boxShadow: '0 0 10px #ff00ff, 0 0 20px #ff00ff',
    glow: true,
  },
  minimal: {
    name: '简约',
    description: '纯净黑白',
    colors: {
      primary: '#333333',
      secondary: '#666666',
      background: '#f5f5f5',
      board: '#ffffff',
      boardLine: '#cccccc',
      blackPiece: '#000000',
      whitePiece: '#ffffff',
      text: '#333333',
      textSecondary: '#666666',
      button: '#e0e0e0',
      buttonHover: '#d0d0d0',
      buttonActive: '#333333',
      panel: '#ffffff',
      panelText: '#333333',
      border: '#cccccc',
      accent: '#333333',
      buttonText: '#333333',
    },
    borderRadius: {
      button: '4px',
      panel: '8px',
      piece: '50%',
    },
    fonts: {
      family: "'Helvetica Neue', Helvetica, Arial, sans-serif",
    },
  },
  warm: {
    name: '暖阳',
    description: '温暖夕阳',
    colors: {
      primary: '#ff7e5f',
      secondary: '#feb47b',
      background: 'linear-gradient(135deg, #ff7e5f 0%, #feb47b 100%)',
      board: '#fff5e6',
      boardLine: '#d4a574',
      blackPiece: '#4a3728',
      whitePiece: '#fffaf0',
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.9)',
      button: 'rgba(255,255,255,0.35)',
      buttonHover: 'rgba(255,255,255,0.5)',
      buttonActive: '#ff7e5f',
      panel: '#ffffff',
      panelText: '#5d4e37',
      border: 'rgba(255,255,255,0.6)',
      accent: '#ff7e5f',
      buttonText: '#5d4e37',
    },
    borderRadius: {
      button: '24px',
      panel: '20px',
      piece: '50%',
    },
    fonts: {
      family: "'Georgia', 'Times New Roman', serif",
    },
  },
  ocean: {
    name: '海洋',
    description: '清新海风',
    colors: {
      primary: '#2196f3',
      secondary: '#00bcd4',
      background: 'linear-gradient(135deg, #1e3c72 0%, #2a5298 100%)',
      board: '#e3f2fd',
      boardLine: '#90caf9',
      blackPiece: '#1565c0',
      whitePiece: '#ffffff',
      text: '#ffffff',
      textSecondary: 'rgba(255,255,255,0.8)',
      button: 'rgba(255,255,255,0.3)',
      buttonHover: 'rgba(255,255,255,0.45)',
      buttonActive: '#2196f3',
      panel: 'rgba(255,255,255,0.95)',
      panelText: '#1565c0',
      border: 'rgba(255,255,255,0.5)',
      accent: '#00bcd4',
      buttonText: '#1565c0',
    },
    borderRadius: {
      button: '16px',
      panel: '12px',
      piece: '50%',
    },
    fonts: {
      family: "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif",
    },
  },
}

export const themeOptions = [
  { value: 'default', label: '默认', description: '紫蓝渐变' },
  { value: 'pixel', label: '像素', description: '复古像素风' },
  { value: 'neon', label: '霓虹', description: '赛博朋克' },
  { value: 'minimal', label: '简约', description: '纯净黑白' },
  { value: 'warm', label: '暖阳', description: '温暖夕阳' },
  { value: 'ocean', label: '海洋', description: '清新海风' },
]

export function getTheme(name) {
  return themes[name] || themes.default
}

export function applyTheme(theme) {
  const root = document.documentElement
  
  root.style.setProperty('--color-primary', theme.colors.primary)
  root.style.setProperty('--color-secondary', theme.colors.secondary)
  root.style.setProperty('--color-background', theme.colors.background)
  root.style.setProperty('--color-board', theme.colors.board)
  root.style.setProperty('--color-board-line', theme.colors.boardLine)
  root.style.setProperty('--color-black-piece', theme.colors.blackPiece)
  root.style.setProperty('--color-white-piece', theme.colors.whitePiece)
  root.style.setProperty('--color-text', theme.colors.text)
  root.style.setProperty('--color-text-secondary', theme.colors.textSecondary)
  root.style.setProperty('--color-button', theme.colors.button)
  root.style.setProperty('--color-button-hover', theme.colors.buttonHover)
  root.style.setProperty('--color-button-active', theme.colors.buttonActive)
  root.style.setProperty('--color-panel', theme.colors.panel)
  root.style.setProperty('--color-panel-text', theme.colors.panelText)
  root.style.setProperty('--color-border', theme.colors.border)
  root.style.setProperty('--color-accent', theme.colors.accent)
  root.style.setProperty('--color-button-text', theme.colors.buttonText || '#ffffff')
  
  root.style.setProperty('--border-radius-button', theme.borderRadius.button)
  root.style.setProperty('--border-radius-panel', theme.borderRadius.panel)
  root.style.setProperty('--border-radius-piece', theme.borderRadius.piece)
  
  root.style.setProperty('--font-family', theme.fonts.family)
  
  if (theme.boxShadow) {
    root.style.setProperty('--box-shadow', theme.boxShadow)
  } else {
    root.style.setProperty('--box-shadow', 'none')
  }
  
  if (theme.glow) {
    document.body.classList.add('glow-effect')
  } else {
    document.body.classList.remove('glow-effect')
  }
}

export default { themes, themeOptions, getTheme, applyTheme }
