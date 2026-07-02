export function error(message, meta = {}) {
  return { severity: 'error', message, ...meta }
}

export function warning(message, meta = {}) {
  return { severity: 'warning', message, ...meta }
}

export function info(message, meta = {}) {
  return { severity: 'info', message, ...meta }
}
