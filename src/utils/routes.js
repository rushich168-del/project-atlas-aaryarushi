export function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

export function getCurrentPath() {
  return window.location.pathname
}

// Compatibility no-op: HistoryPage imports and calls this, but the real History
// scroll restoration remains parked. This intentionally does nothing and returns
// false so the build resolves the import without changing navigation behavior.
export function restoreScrollForPath(path) {
  return false
}
