export function getFriendlyError(error, fallback = 'Something went wrong. Please try again.') {
  const message = String(error?.message || error || '').trim()

  if (!message) {
    return fallback
  }

  if (/supabase|environment|placeholder/i.test(message)) {
    return 'Project Atlas is not connected to Supabase yet. Check the deployment environment settings.'
  }

  if (/jwt|auth|session|row level security|permission|policy/i.test(message)) {
    return 'You do not have access to complete that action in this workspace.'
  }

  if (/network|failed to fetch|fetch/i.test(message)) {
    return 'Network connection failed. Check the connection and try again.'
  }

  return fallback
}

export function getUploadError(error, kind) {
  const technicalDetail = String(error?.message || '').trim()
  const target = kind === 'template' ? 'template' : 'Excel file'
  const fallback = kind === 'template'
    ? 'Template upload failed. Check that the file is a DOCX under 10 MB and try again.'
    : 'Excel parsing failed. Check that the file is an XLSX or XLS under 10 MB and try again.'

  return {
    message: getFriendlyError(error, fallback),
    technicalDetail,
  }
}

export function getStorageError(error) {
  return {
    message: getFriendlyError(error, 'The DOCX was generated locally, but could not be stored in History. You can still download the local file now.'),
    technicalDetail: String(error?.message || '').trim(),
  }
}

export function getDownloadError(error) {
  return {
    message: getFriendlyError(error, 'Download failed. Try again from History in a moment.'),
    technicalDetail: String(error?.message || '').trim(),
  }
}
