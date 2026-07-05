// Client-side navigation for the app's lightweight pushState router.
//
// Scroll restoration is handled centrally by scrollRestoration.js, which listens
// for the popstate event emitted below (and native browser back/forward). So
// navigateTo only has to change the URL and notify the router.

export function navigateTo(path) {
  window.history.pushState({}, '', path)
  window.dispatchEvent(new PopStateEvent('popstate'))
}

export function getCurrentPath() {
  return window.location.pathname
}
