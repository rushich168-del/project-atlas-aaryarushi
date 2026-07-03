export function prepareEmailPayloadPreview({ recipient, subject, message } = {}) {
  return {
    recipient: recipient || '',
    subject: subject || '',
    message: message || '',
  }
}

export function validateEmailRecipient(recipient = '') {
  const normalized = String(recipient || '').trim()
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalized)
}

export function buildEmailSubject(template = '', row = {}) {
  return String(template || '').replace(/{{\s*([^}]+?)\s*}}/g, (_, key) => {
    const normalizedKey = String(key || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const directValue = row[key] ?? row[normalizedKey] ?? row[normalizedKey.replace(/\s+/g, '')]
    return directValue == null ? '' : String(directValue)
  })
}

export function buildEmailMessage(template = '', row = {}) {
  return String(template || '').replace(/{{\s*([^}]+?)\s*}}/g, (_, key) => {
    const normalizedKey = String(key || '').trim().toLowerCase().replace(/\s+/g, ' ')
    const directValue = row[key] ?? row[normalizedKey] ?? row[normalizedKey.replace(/\s+/g, '')]
    return directValue == null ? '' : String(directValue)
  })
}
