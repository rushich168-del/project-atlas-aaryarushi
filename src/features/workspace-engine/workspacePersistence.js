// Safe, per-product workspace state persistence (Project Atlas v2.81).
//
// Scope and safety:
//   * sessionStorage only — per-tab, survives in-tab navigation / back-forward /
//     refresh, cleared when the tab closes. Keyed by product slug so different
//     products never collide.
//   * We persist ONLY serializable UI state and lightweight metadata:
//     the active step, upload display metadata ({name,size}), the Supabase
//     template/upload/draft RECORDS (which already carry storage paths, not file
//     bytes), the detected columns/placeholders, the parsed preview/excel rows
//     (small structured text the engine already keeps in memory), the field
//     mapping, and draft status.
//   * We NEVER persist raw DOCX/XLSX file bytes, base64 blobs, object URLs, or
//     anything secret. Generation re-reads the template from its existing
//     Supabase storage record and works from the parsed rows — so restoring these
//     fields rehydrates the workspace without ever storing a file body.
//   * Non-serializable / transient fields (generatedDocx blob + objectURL,
//     in-flight flags, batch progress) are intentionally excluded so a restore is
//     honest: the user re-runs generation, we never pretend an output blob exists.

const PREFIX = 'projectAtlas.workspaceState:'

// Whitelist. Anything not listed here is dropped from the snapshot.
export const PERSISTED_KEYS = [
  'templateFile',
  'templateRecord',
  'excelFile',
  'uploadRecord',
  'detectedColumns',
  'detectedPlaceholders',
  'invalidPlaceholders',
  'placeholderKeys',
  'placeholderDuplicateCounts',
  'placeholderDetectionError',
  'previewRows',
  'excelRows',
  'previewRowIndex',
  'rowCount',
  'fieldMapping',
  'draftRecord',
  'draftDirty',
  'draftSavedAt',
]

function keyFor(slug) {
  return PREFIX + String(slug || 'unknown')
}

export function loadPersistedWorkspace(slug) {
  if (!slug) {
    return null
  }

  try {
    const raw = window.sessionStorage.getItem(keyFor(slug))

    if (!raw) {
      return null
    }

    const parsed = JSON.parse(raw)
    return parsed && typeof parsed === 'object' ? parsed : null
  } catch {
    return null
  }
}

// Extract only the whitelisted, persistable subset of a full workspace state.
export function pickPersistableState(state) {
  const snapshot = {}

  for (const key of PERSISTED_KEYS) {
    if (state[key] !== undefined) {
      snapshot[key] = state[key]
    }
  }

  return snapshot
}

export function persistWorkspace(slug, state, activeStep) {
  if (!slug) {
    return
  }

  try {
    const snapshot = { ...pickPersistableState(state), activeStep }
    window.sessionStorage.setItem(keyFor(slug), JSON.stringify(snapshot))
  } catch {
    // Best-effort only. Quota-exceeded (unusually large row sets), serialization
    // issues, or restricted storage contexts must never break the live workspace.
  }
}

export function clearPersistedWorkspace(slug) {
  if (!slug) {
    return
  }

  try {
    window.sessionStorage.removeItem(keyFor(slug))
  } catch {
    // Ignore restricted storage contexts.
  }
}

// True when the restored snapshot carries meaningful, resumable work (an uploaded
// template/Excel record or a saved draft) — used to decide whether to surface the
// "workspace restored" banner and file chips.
export function hasResumableWork(persisted) {
  return Boolean(persisted && (persisted.templateRecord || persisted.uploadRecord || persisted.draftRecord))
}
