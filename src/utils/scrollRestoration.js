// App-wide scroll restoration.
//
// Architecture notes (why this is a singleton driven by route events, not a
// per-component React hook):
//
//   * Every authenticated page renders through the shared DashboardLayout and the
//     real scroller is the window/document — the layout grows with its content
//     (`min-h-screen`) and no inner overflow-y-auto pane wraps routed content. A
//     future page that owns a genuinely-scrollable pane can opt in by tagging it
//     `data-scroll-restore="..."`; this module uses that element only when it is
//     actually scrollable, otherwise it falls back to the document scroller.
//
//   * Saving on React unmount is unreliable: useEffect cleanup runs after React
//     has already swapped in the next page, so reading scroll at that point
//     yields the NEW page's position (usually 0) and clobbers the outgoing
//     route's saved value. Instead we save on the `popstate` event, which fires
//     while the outgoing DOM is still mounted and the scroll position is still
//     valid, and we track the current route key ourselves so the save is written
//     under the page we are leaving.
//
// Route key = pathname. Stored as sessionStorage `projectAtlas.scrollRestore:<path>`.

const STORAGE_PREFIX = 'projectAtlas.scrollRestore:'
const RESTORE_TIMEOUT_MS = 5000

let installed = false
let currentKey = null
let saveFrame = 0
let restoreToken = 0

function keyForPath(pathname) {
  return pathname || '/'
}

function getDocumentScroller() {
  return window.document.scrollingElement || window.document.documentElement
}

function maxScrollTop(element) {
  return Math.max(0, element.scrollHeight - element.clientHeight)
}

// Resolve the element that actually scrolls for the current page. Prefer a
// tagged, genuinely-scrollable container; otherwise the whole document scrolls.
// Resolved lazily on every read/write because scrollability changes as async
// content mounts.
function getActiveScroller() {
  const tagged = window.document.querySelector('[data-scroll-restore]')

  if (tagged && maxScrollTop(tagged) > 1) {
    return tagged
  }

  return getDocumentScroller()
}

function readSaved(key) {
  try {
    const value = Number(window.sessionStorage.getItem(STORAGE_PREFIX + key))
    return Number.isFinite(value) && value >= 0 ? value : null
  } catch {
    return null
  }
}

function writeSaved(key, top) {
  try {
    window.sessionStorage.setItem(STORAGE_PREFIX + key, String(top))
  } catch {
    // Best-effort UI state; ignore restricted storage contexts.
  }
}

// Persist the current route's scroll position. Skipped when there is nothing to
// scroll (page short / mid-load), so a transient collapse-to-top during route
// teardown or data loading never overwrites a real saved value with 0.
function saveCurrent() {
  if (!currentKey) {
    return
  }

  const scroller = getActiveScroller()

  if (maxScrollTop(scroller) <= 1) {
    return
  }

  writeSaved(currentKey, scroller.scrollTop || 0)
}

// Restore a route's saved position, retrying across frames because History /
// Workspace data renders after the route mounts and grows the page.
function scheduleRestore(key) {
  const token = ++restoreToken
  const target = readSaved(key)
  const startedAt = Date.now()
  let lastMax = -1

  function attempt() {
    // Superseded by a newer navigation, or the route changed again mid-retry.
    if (token !== restoreToken || currentKey !== key) {
      return
    }

    const scroller = getActiveScroller()
    const max = maxScrollTop(scroller)
    const desired = target === null ? 0 : Math.min(target, max)

    // Assign scrollTop directly: instant, and it ignores the global
    // `html { scroll-behavior: smooth }` that would otherwise animate.
    scroller.scrollTop = desired

    const reached = Math.abs(scroller.scrollTop - desired) <= 2
    const contentPresentButShorter = max > 0 && max === lastMax
    const tallEnough = target === null || max >= target
    const timedOut = Date.now() - startedAt > RESTORE_TIMEOUT_MS
    lastMax = max

    // Done when we've landed and either the page is tall enough for the target,
    // or content has loaded but is genuinely shorter than when saved. The
    // `max > 0` guard prevents stopping early during the mid-load window when the
    // page is transiently empty (height stably 0).
    if ((reached && (tallEnough || contentPresentButShorter)) || timedOut) {
      return
    }

    window.requestAnimationFrame(attempt)
  }

  window.requestAnimationFrame(attempt)
}

function handleScroll() {
  if (saveFrame) {
    return
  }

  saveFrame = window.requestAnimationFrame(() => {
    saveFrame = 0
    saveCurrent()
  })
}

function handleVisibilityChange() {
  if (window.document.visibilityState === 'hidden') {
    saveCurrent()
  }
}

function handlePopState() {
  // The outgoing DOM is still mounted here (React re-renders after this handler),
  // so this reads the correct leaving-route scroll. Save it under the OLD key.
  saveCurrent()

  // Switch to the new route and restore once React has rendered it.
  currentKey = keyForPath(window.location.pathname)
  scheduleRestore(currentKey)
}

// Idempotent. Safe to call from every DashboardLayout mount; listeners install
// once. Independent of React lifecycle so it survives remounts and covers both
// in-app navigation and native browser back/forward (both emit popstate).
export function installScrollRestoration() {
  if (installed || typeof window === 'undefined') {
    return
  }

  installed = true

  try {
    if ('scrollRestoration' in window.history) {
      window.history.scrollRestoration = 'manual'
    }
  } catch {
    // Ignore environments that block history access.
  }

  currentKey = keyForPath(window.location.pathname)

  // Capture phase so scroll from the document AND any internal scroll container
  // is observed (scroll events don't bubble but do have a capture phase).
  window.addEventListener('scroll', handleScroll, { passive: true, capture: true })
  window.addEventListener('popstate', handlePopState)
  window.addEventListener('pagehide', saveCurrent)
  window.document.addEventListener('visibilitychange', handleVisibilityChange)

  // Restore the initial route (direct load / refresh with a saved position).
  scheduleRestore(currentKey)
}
