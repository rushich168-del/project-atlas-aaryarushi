export function mergeError(message, meta = {}) {
  return { severity: 'error', message, ...meta }
}

export function mergeWarning(message, meta = {}) {
  return { severity: 'warning', message, ...meta }
}
