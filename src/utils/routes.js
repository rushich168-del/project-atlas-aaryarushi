const historyPath = '/dashboard/history'
const historyScrollStorageKey = 'projectAtlas.history.scrollTop'

// The whole document is the History scroll container: the dashboard layout uses
// `min-h-screen` and grows with its content, so the window/document scrolls —
// there is no inner overflow-y-auto pane. Read and write scroll state through
// the scrolling element accordingly.
function getScrollTop() {
  return window.document.scrollingElement?.scrollTop ?? window.scrollY ?? 0
}

function setScrollTop(top) {
  // `html { scroll-behavior: smooth }` is set globally (styles.css). A scrollTo
  // with behavior 'auto' follows that CSS and animates, which loses the target
  // while the page height is still settling after a route change. Assigning
  // scrollTop directly jumps instantly and ignores scroll-behavior.
  const scroller = window.document.scrollingElement || window.document.documentElement

  if (scroller) {
    scroller.scrollTop = top
  } else {
    window.scrollTo(0, top)
  }
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

function clearSavedHistoryScrollPosition() {
  try {
    window.sessionStorage.removeItem(historyScrollStorageKey)
  } catch {
    // Ignore restricted storage contexts.
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

// Restore the saved History scroll position. History data loads asynchronously,
// so the document is short right after the route mounts and grows over several
// frames. Keep re-applying the target (instantly) until the page is tall enough
// AND the scroll actually lands there, then consume the saved value so in-page
// reloads (deletes, focus refreshes) don't yank the user back to it.
export function restoreScrollForPath(path) {
  if (path !== historyPath) {
    return false
  }

  const savedScrollY = getSavedHistoryScrollPosition()

  if (savedScrollY === null) {
    return false
  }

  const startedAt = Date.now()

  function attempt() {
    // The user may have navigated away again while data was still loading; don't
    // fight the scroll position of whatever page is now showing.
    if (window.location.pathname !== historyPath) {
      return
    }

    const maxScrollY = Math.max(0, window.document.documentElement.scrollHeight - window.innerHeight)
    const targetScrollY = Math.min(savedScrollY, maxScrollY)

    setScrollTop(targetScrollY)

    const pageTallEnough = maxScrollY >= savedScrollY
    const reachedTarget = Math.abs(getScrollTop() - savedScrollY) <= 2
    const timedOut = Date.now() - startedAt > 3000

    if ((pageTallEnough && reachedTarget) || timedOut) {
      // Landed (or gave up): consume the value so it only applies to this arrival.
      clearSavedHistoryScrollPosition()
      return
    }

    window.requestAnimationFrame(attempt)
  }

  window.requestAnimationFrame(attempt)
  return true
}
