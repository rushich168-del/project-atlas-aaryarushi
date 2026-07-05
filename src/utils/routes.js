const historyPath = '/dashboard/history'
const historyScrollStorageKey = 'project-atlas:history:scroll-y'

function getScrollTop() {
  return window.document.scrollingElement?.scrollTop ?? window.scrollY ?? 0
}

function saveHistoryScrollPosition() {
  try {
    window.sessionStorage.setItem(historyScrollStorageKey, String(getScrollTop()))
  } catch {
    // Best-effort UI state; ignore restricted storage contexts.
  }
}

function getSavedHistoryScrollPosition() {
  try {
    const savedScrollY = Number(window.sessionStorage.getItem(historyScrollStorageKey))
    return Number.isFinite(savedScrollY) && savedScrollY > 0 ? savedScrollY : null
  } catch {
    return null
  }
}

export function navigateTo(path) {
  if (window.location.pathname === historyPath) {
    saveHistoryScrollPosition()
  }

  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))

  if (path === historyPath) {
    restoreScrollForPath(path)
  } else {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }
}

export function getCurrentPath() {
  return window.location.pathname
}

export function restoreScrollForPath(path) {
  if (path !== historyPath) {
    return false
  }

  const savedScrollY = getSavedHistoryScrollPosition()

  if (savedScrollY === null) {
    return false
  }

  const startedAt = Date.now()

  function restore() {
    const maxScrollY = Math.max(0, window.document.documentElement.scrollHeight - window.innerHeight)
    const targetScrollY = Math.min(savedScrollY, maxScrollY)

    window.scrollTo({ top: targetScrollY, behavior: 'auto' })

    if (maxScrollY < savedScrollY && Date.now() - startedAt < 2000) {
      window.setTimeout(restore, 50)
    }
  }

  window.requestAnimationFrame(() => {
    window.requestAnimationFrame(restore)
  })

  return true
}
