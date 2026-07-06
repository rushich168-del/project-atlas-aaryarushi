// Project Atlas v2.84 — shared Excel upload/parse handler.
//
// This is the single source of truth for turning a selected .xlsx File into
// parsed workspace state (detected columns, preview/excel rows, upload record).
// Both the classic ExcelStep and the new builder-first "Use in workspace" action
// call this, so the existing mapping → preview → DOCX generation path is never
// duplicated. It imports only services + utils (no React, no engine), so it can be
// used from any layer without circular-import risk.

import {
  parseExcelColumns,
  uploadCertificateInput,
  validateExcelFile,
} from '../certificate/services/certificateFilesService.js'
import { getUploadError } from '../../utils/errorMessages.js'

// Upload + parse an Excel file and apply the result via actions.updateState.
// `actions.updateState` and `config`/`workspace` mirror what ExcelStep receives.
export async function uploadAndApplyExcel({ file, config, workspace, actions }) {
  actions.updateState({ uploadingExcel: true, excelUploadError: '' })

  try {
    validateExcelFile(file)
    const { detectedColumns, rowCount, previewRows, excelRows } = await parseExcelColumns(file)
    const uploadRecord = await uploadCertificateInput({
      organizationId: workspace.organization?.id,
      productId: workspace.product?.organizationId ? workspace.product.id : null,
      productSlug: workspace.product?.slug || config.productSlug,
      file,
      detectedColumns,
      rowCount,
      userId: workspace.user?.id,
    })

    actions.updateState({
      excelFile: { name: file.name, size: uploadRecord.displaySize },
      uploadRecord,
      detectedColumns,
      previewRows,
      excelRows,
      previewRowIndex: 0,
      rowCount,
      fieldMapping: config.createEmptyFieldMapping
        ? config.createEmptyFieldMapping()
        : { name: '', course: '', date: '', certificate_id: '', trainer: '' },
      draftRecord: null,
      draftDirty: true,
      generationComplete: false,
      generatedDocx: null,
      generatedDocumentRecord: null,
      generationError: '',
      outputError: '',
      persistingOutput: false,
      batchValidation: null,
      batchJob: null,
      batchOutputs: [],
      batchError: '',
      batchComplete: false,
      uploadingExcel: false,
    })

    return { ok: true }
  } catch (error) {
    actions.updateState({ uploadingExcel: false, excelUploadError: getUploadError(error, 'excel') })
    return { ok: false, error }
  }
}
