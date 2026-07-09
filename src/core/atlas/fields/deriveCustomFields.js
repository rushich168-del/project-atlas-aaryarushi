// Project Atlas v4.1 — custom placeholder support.
//
// A product's config ships a fixed list of "known" template fields (the starter /
// documented placeholders). Users may legitimately add their OWN valid placeholders
// to a Word template — e.g. {{place}} with a matching Excel column `place`. The
// engine (mergeRow / validateFieldMapping / auto-map) is generic over whatever
// `fieldDefinitions` it receives, so the smallest correct fix is to hand it an
// EFFECTIVE field list = the product's known fields + one derived field per valid,
// detected-but-unknown placeholder.
//
// These derived fields are always OPTIONAL, so they never block generation; an
// unmapped custom placeholder just renders blank (and can surface a soft warning).
// This does NOT relax invalid-format detection: only placeholders already classified
// valid by detectDocxPlaceholders (letters/numbers/underscores, leading letter) ever
// reach here — invalid tokens live in a separate `invalidPlaceholders` list.

function normalizeFieldId(value) {
  return String(value || '').trim().toLowerCase()
}

function placeholderInnerKey(placeholder) {
  return normalizeFieldId(String(placeholder || '').replace(/^\{\{\s*/, '').replace(/\s*\}\}$/, ''))
}

// Return extra field definitions for valid detected placeholders that are not
// already covered by the product's known fields (by field id or placeholder text).
export function deriveCustomFields({ fieldDefinitions = [], detectedPlaceholders = [] }) {
  const knownKeys = new Set()
  fieldDefinitions.forEach((field) => {
    knownKeys.add(normalizeFieldId(field.id))
    if (field.placeholder) {
      knownKeys.add(placeholderInnerKey(field.placeholder))
    }
  })

  const seen = new Set()
  const customFields = []

  detectedPlaceholders.forEach((placeholder) => {
    const key = normalizeFieldId(placeholder.key)
    if (!key || knownKeys.has(key) || seen.has(key)) {
      return
    }
    seen.add(key)
    customFields.push({
      id: key,
      label: key,
      // Preserve the exact tag text (original case) so generation replaces the real
      // {{Tag}} in the template rather than a lower-cased guess.
      placeholder: placeholder.raw || `{{${key}}}`,
      required: false,
      type: 'text',
      custom: true,
    })
  })

  return customFields
}

// Convenience: known fields followed by any derived custom fields.
export function withCustomFields({ fieldDefinitions = [], detectedPlaceholders = [] }) {
  return [...fieldDefinitions, ...deriveCustomFields({ fieldDefinitions, detectedPlaceholders })]
}
