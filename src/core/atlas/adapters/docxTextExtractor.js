import JSZip from 'jszip'

const DOCX_XML_PATTERN = /^word\/(document|header\d*|footer\d*)\.xml$/

function decodeXmlEntities(value) {
  return String(value || '')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
}

function xmlToText(xml) {
  return decodeXmlEntities(
    String(xml || '')
      .replace(/<\/w:t>\s*<w:t[^>]*>/g, '')
      .replace(/<[^>]+>/g, ' '),
  )
}

function getSourceName(path) {
  if (path.includes('/header')) {
    return 'header'
  }

  if (path.includes('/footer')) {
    return 'footer'
  }

  return 'document'
}

export async function extractDocxTextParts(file) {
  const zip = await JSZip.loadAsync(file)
  const entries = Object.values(zip.files).filter((entry) => DOCX_XML_PATTERN.test(entry.name))

  const parts = await Promise.all(
    entries.map(async (entry) => ({
      source: getSourceName(entry.name),
      path: entry.name,
      text: xmlToText(await entry.async('text')),
    })),
  )

  return parts
}
