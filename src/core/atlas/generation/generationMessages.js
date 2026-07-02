export function generationError(message, meta = {}) {
  return { severity: 'error', message, ...meta }
}

export function generationWarning(message, meta = {}) {
  return { severity: 'warning', message, ...meta }
}
