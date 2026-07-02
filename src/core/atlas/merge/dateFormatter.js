export function formatDate(value, format = 'dd MMM yyyy', locale = 'en-IN') {
  const date = value instanceof Date ? value : new Date(value)

  if (Number.isNaN(date.getTime())) {
    return null
  }

  if (format !== 'dd MMM yyyy') {
    return new Intl.DateTimeFormat(locale).format(date)
  }

  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date)
}
