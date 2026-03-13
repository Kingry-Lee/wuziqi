const API_BASE = 'http://156.238.250.31:3001'
const LOCAL_HISTORY_KEY = 'wuziqi_history'

function getLocalHistory() {
  try {
    const data = localStorage.getItem(LOCAL_HISTORY_KEY)
    return data ? JSON.parse(data) : []
  } catch {
    return []
  }
}

function setLocalHistory(history) {
  try {
    localStorage.setItem(LOCAL_HISTORY_KEY, JSON.stringify(history))
  } catch {}
}

export async function fetchHistory() {
  try {
    const res = await fetch(`${API_BASE}/api/history?limit=100`)
    const data = await res.json()
    if (data.success) {
      return data.data
    }
    return getLocalHistory()
  } catch (e) {
    console.log('Using local history fallback')
    return getLocalHistory()
  }
}

export async function saveToServer(record) {
  const localHistory = getLocalHistory()
  localHistory.unshift(record)
  if (localHistory.length > 100) localHistory.pop()
  setLocalHistory(localHistory)
  
  try {
    await fetch(`${API_BASE}/api/history`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(record)
    })
  } catch (e) {
    console.log('Saved to local storage')
  }
}

export default { fetchHistory, saveToServer }
