import {
  DownloadsStep,
  ExcelStep,
  GenerateStep,
  MappingStep,
  PreviewStep,
  TemplateStep,
} from './steps.jsx'
import { saveGenerationDraft } from './services/certificateDraftsService.js'
import {
  downloadCertificateTemplateArrayBuffer,
  generateCertificateDocx,
  generateCertificateDocxForRow,
} from './services/certificateGenerationService.js'
import { uploadGeneratedCertificateDocx } from './services/certificateOutputsService.js'
import {
  BATCH_ROW_LIMIT,
  buildBatchStoragePath,
  completeGenerationJob,
  createGenerationJob,
  saveGenerationOutput,
  uploadBatchDocx,
} from './services/certificateBatchService.js'
import { mergeRow, validateFieldMapping } from '../../core/atlas/index.js'
import { getStorageError } from '../../utils/errorMessages.js'

const requiredFieldIds = ['name', 'course', 'date', 'certificate_id']

function hasRequiredMappings(state) {
  return getValidationResult(state).valid
}

function previewDataFromState(state) {
  return getMergeResult(state).values
}

function getMergeResult(state) {
  return getMergeResultForRow(state, state.previewRows[state.previewRowIndex] || {})
}

function getMergeResultForRow(state, row) {
  return mergeRow({
    fieldDefinitions: certificateWorkspaceConfig.templateFields,
    fieldMapping: state.fieldMapping,
    row,
    options: {
      locale: 'en-IN',
      emptyValue: '',
      trimText: true,
    },
  })
}

function getAllExcelRows(state) {
  return state.excelRows || []
}

function getBatchRows(state) {
  return getAllExcelRows(state)
}

function getDisplayName(mergeResult, rowIndex) {
  return mergeResult?.values?.name || mergeResult?.values?.certificate_id || `Row ${rowIndex + 1}`
}

function validateBatchRows(state) {
  const rows = getAllExcelRows(state)

  return rows.map((row, index) => {
    const mergeResult = getMergeResultForRow(state, row)
    const missingFields = [
      ...mergeResult.missingColumns,
      ...mergeResult.missingValues,
    ].map((item) => item.label)

    return {
      row,
      rowIndex: index,
      rowNumber: index + 1,
      mergeResult,
      displayName: getDisplayName(mergeResult, index),
      status: mergeResult.valid ? 'valid' : 'missing_required_field',
      missingFields: [...new Set(missingFields)],
      errorMessage: mergeResult.valid ? '' : mergeResult.errors.map((item) => item.message).join(' '),
    }
  })
}

function getValidationResult(state) {
  return validateFieldMapping({
    detectedPlaceholders: state.detectedPlaceholders,
    invalidPlaceholders: state.invalidPlaceholders,
    fieldDefinitions: certificateWorkspaceConfig.templateFields,
    detectedColumns: state.detectedColumns,
    fieldMapping: state.fieldMapping,
  })
}

export const certificateWorkspaceConfig = {
  id: 'certificate',
  productSlug: 'ar-cert-pro',
  eyebrow: 'AR-CERT-PRO SaaS Workspace',
  title: 'Certificate Workspace',
  description:
    'Generate one DOCX certificate at a time from a saved draft and the selected Excel preview row.',
  templateFields: [
    { id: 'name', label: 'Recipient name', placeholder: '{{name}}', required: true, type: 'text', defaultValue: '', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Course name', placeholder: '{{course}}', required: true, type: 'text', defaultValue: '', sample: 'Office Automation Foundations' },
    { id: 'date', label: 'Completion date', placeholder: '{{date}}', required: true, type: 'date', format: 'dd MMM yyyy', defaultValue: '', sample: 'July 2, 2026' },
    { id: 'certificate_id', label: 'Certificate ID', placeholder: '{{certificate_id}}', required: true, type: 'text', defaultValue: '', sample: 'CERT-001' },
    { id: 'trainer', label: 'Trainer name', placeholder: '{{trainer}}', required: false, type: 'text', defaultValue: '', sample: 'Automation Labs' },
  ],
  mockRow: {
    Name: 'Aarya Rushi',
    Course: 'Office Automation Foundations',
    Date: 'July 2, 2026',
    'Certificate ID': 'CERT-001',
    Trainer: 'Automation Labs',
  },
  createInitialState() {
    return {
      templateFile: null,
      templateRecord: null,
      excelFile: null,
      uploadRecord: null,
      detectedColumns: [],
      detectedPlaceholders: [],
      invalidPlaceholders: [],
      placeholderKeys: [],
      placeholderDuplicateCounts: {},
      placeholderDetectionError: '',
      previewRows: [],
      excelRows: [],
      previewRowIndex: 0,
      rowCount: 0,
      uploadingTemplate: false,
      uploadingExcel: false,
      templateUploadError: '',
      excelUploadError: '',
      fieldMapping: {
        name: '',
        course: '',
        date: '',
        certificate_id: '',
        trainer: '',
      },
      draftRecord: null,
      draftDirty: true,
      savingDraft: false,
      draftError: '',
      draftSavedAt: '',
      generating: false,
      generationError: '',
      generationProgress: 0,
      generationComplete: false,
      persistingOutput: false,
      outputError: '',
      generatedDocx: null,
      generatedDocumentRecord: null,
      batchGenerating: false,
      batchProgress: {
        active: false,
        currentRow: 0,
        completedCount: 0,
        successCount: 0,
        failureCount: 0,
        currentName: '',
      },
      batchValidation: null,
      batchJob: null,
      batchOutputs: [],
      batchError: '',
      batchComplete: false,
    }
  },
  canGenerate(state) {
    return Boolean(state.templateRecord && state.uploadRecord && hasRequiredMappings(state) && getMergeResult(state).valid && state.draftRecord && !state.draftDirty)
  },
  canSave(state) {
    return Boolean(state.templateRecord && state.uploadRecord && hasRequiredMappings(state) && getMergeResult(state).valid)
  },
  canGenerateBatch(state) {
    const allRows = getAllExcelRows(state)
    return Boolean(state.templateRecord && state.uploadRecord && hasRequiredMappings(state) && state.draftRecord && !state.draftDirty && allRows.length > 0 && allRows.length <= BATCH_ROW_LIMIT)
  },
  getBatchValidation: validateBatchRows,
  async saveWorkspace(state, workspace) {
    const productId = workspace.product?.organizationId ? workspace.product.id : null
    const previewData = previewDataFromState(state)
    const draftRecord = await saveGenerationDraft({
      draftId: state.draftRecord?.id,
      organizationId: workspace.organization?.id,
      productId,
      templateId: state.templateRecord?.id,
      uploadId: state.uploadRecord?.id,
      fieldMapping: state.fieldMapping,
      previewRowIndex: state.previewRowIndex,
      previewData,
      status: hasRequiredMappings(state) && getMergeResult(state).valid ? 'ready' : 'draft',
      userId: workspace.user?.id,
    })

    return {
      draftRecord,
      draftDirty: false,
      draftError: '',
    }
  },
  async generateDocument(state, workspace, tools = {}) {
    const mergeResult = getMergeResult(state)
    tools.updateState?.({ generationProgress: 35, persistingOutput: false })

    const result = await generateCertificateDocx({
      templateRecord: state.templateRecord,
      mergeResult,
    })

    if (!result.valid) {
      throw new Error(result.errors.map((item) => item.message).join(' ') || 'DOCX generation failed.')
    }

    if (state.generatedDocx?.downloadUrl) {
      URL.revokeObjectURL(state.generatedDocx.downloadUrl)
    }

    const localDocx = {
      blob: result.blob,
      fileName: result.fileName,
      mimeType: result.mimeType,
      downloadUrl: URL.createObjectURL(result.blob),
      warnings: result.warnings,
      generatedAt: new Date().toISOString(),
      stored: false,
    }

    tools.updateState?.({ generationProgress: 70, persistingOutput: true })

    try {
      const productId = workspace.product?.organizationId ? workspace.product.id : null
      const generatedDocumentRecord = await uploadGeneratedCertificateDocx({
        organizationId: workspace.organization?.id,
        productId,
        templateId: state.templateRecord?.id,
        uploadId: state.uploadRecord?.id,
        draftId: state.draftRecord?.id,
        previewRowIndex: state.previewRowIndex,
        mergeData: mergeResult.values,
        blob: result.blob,
        fileName: result.fileName,
        userId: workspace.user?.id,
      })

      return {
        persistingOutput: false,
        outputError: '',
        generatedDocx: {
          ...localDocx,
          stored: true,
        },
        generatedDocumentRecord,
      }
    } catch (error) {
      return {
        persistingOutput: false,
        outputError: getStorageError(error),
        generatedDocx: localDocx,
        generatedDocumentRecord: null,
      }
    }
  },
  async generateBatchDocument(state, workspace, tools = {}) {
    const rows = getAllExcelRows(state)
    const productId = workspace.product?.organizationId ? workspace.product.id : null
    const workspaceId = state.draftRecord?.id
    const organizationId = workspace.organization?.id
    const userId = workspace.user?.id

    if (rows.length > BATCH_ROW_LIMIT) {
      throw new Error('Batch generation v2.0 supports up to 100 rows. Please split larger Excel files.')
    }

    const validationRows = validateBatchRows(state)
    const validRows = validationRows.filter((row) => row.status === 'valid')
    const invalidRows = validationRows.filter((row) => row.status !== 'valid')

    tools.updateState?.({
      batchValidation: {
        totalRows: rows.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        rows: validationRows,
      },
      batchProgress: {
        active: true,
        currentRow: 0,
        completedCount: 0,
        successCount: 0,
        failureCount: invalidRows.length,
        currentName: 'Preparing batch',
      },
    })

    const job = await createGenerationJob({
      organizationId,
      productId,
      workspaceId,
      templateId: state.templateRecord?.id,
      uploadId: state.uploadRecord?.id,
      totalRows: rows.length,
      validRows: validRows.length,
      userId,
    })

    const outputs = []

    for (const invalidRow of invalidRows) {
      const output = await saveGenerationOutput({
        jobId: job.id,
        organizationId,
        productId,
        workspaceId,
        rowIndex: invalidRow.rowNumber,
        displayName: invalidRow.displayName,
        status: 'skipped',
        errorMessage: invalidRow.errorMessage,
      })
      outputs.push(output)
    }

    let successCount = 0
    let failureCount = invalidRows.length
    const templateArrayBuffer = validRows.length > 0
      ? await downloadCertificateTemplateArrayBuffer(state.templateRecord)
      : null

    for (const batchRow of validRows) {
      tools.updateState?.({
        batchProgress: {
          active: true,
          currentRow: batchRow.rowNumber,
          completedCount: successCount + failureCount,
          successCount,
          failureCount,
          currentName: batchRow.displayName,
        },
      })

      try {
        const generated = generateCertificateDocxForRow({
          templateArrayBuffer,
          templateRecord: state.templateRecord,
          mergeResult: batchRow.mergeResult,
        })

        if (!generated.valid) {
          throw new Error(generated.errors.map((item) => item.message).join(' ') || 'DOCX generation failed.')
        }

        const { fileName, storagePath } = buildBatchStoragePath({
          organizationId,
          workspaceId,
          jobId: job.id,
          rowNumber: batchRow.rowNumber,
          fileName: generated.fileName,
        })

        try {
          await uploadBatchDocx({ storagePath, blob: generated.blob })
        } catch (uploadError) {
          failureCount += 1
          const output = await saveGenerationOutput({
            jobId: job.id,
            organizationId,
            productId,
            workspaceId,
            rowIndex: batchRow.rowNumber,
            displayName: batchRow.displayName,
            fileName,
            status: 'upload_failed',
            errorMessage: uploadError,
          })
          outputs.push(output)
          continue
        }

        successCount += 1
        const output = await saveGenerationOutput({
          jobId: job.id,
          organizationId,
          productId,
          workspaceId,
          rowIndex: batchRow.rowNumber,
          displayName: batchRow.displayName,
          fileName,
          storagePath,
          status: 'generated',
        })
        outputs.push(output)
      } catch (rowError) {
        failureCount += 1
        const output = await saveGenerationOutput({
          jobId: job.id,
          organizationId,
          productId,
          workspaceId,
          rowIndex: batchRow.rowNumber,
          displayName: batchRow.displayName,
          status: 'failed',
          errorMessage: rowError,
        })
        outputs.push(output)
      }

      tools.updateState?.({
        batchProgress: {
          active: true,
          currentRow: batchRow.rowNumber,
          completedCount: successCount + failureCount,
          successCount,
          failureCount,
          currentName: batchRow.displayName,
        },
      })
    }

    const finalStatus = successCount === validRows.length && failureCount === 0
      ? 'completed'
      : successCount > 0
        ? 'completed_with_errors'
        : 'failed'
    const completedJob = await completeGenerationJob({
      jobId: job.id,
      successCount,
      failureCount,
      status: finalStatus,
      errorMessage: finalStatus === 'failed' ? 'No DOCX files were generated.' : '',
    })

    return {
      batchJob: completedJob,
      batchOutputs: outputs.sort((a, b) => a.row_index - b.row_index),
      batchComplete: true,
      batchError: '',
      batchProgress: {
        active: false,
        currentRow: rows.length,
        completedCount: successCount + failureCount,
        successCount,
        failureCount,
        currentName: '',
      },
      batchValidation: {
        totalRows: rows.length,
        validRows: validRows.length,
        invalidRows: invalidRows.length,
        rows: validationRows,
      },
    }
  },
  getGenerationStatus(state) {
    if (state.generating && !state.generatedDocx) {
      return state.persistingOutput || state.generationProgress >= 70 ? 'Saving output' : 'Generating DOCX'
    }

    if (state.generatedDocumentRecord) {
      return 'Stored DOCX ready'
    }

    if (state.generatedDocx && state.outputError) {
      return 'Local fallback ready'
    }

    if (state.generatedDocx) {
      return 'DOCX ready'
    }

    return 'Ready'
  },
  getReadinessItems(state) {
    return [
      {
        id: 'template',
        label: 'Template selected',
        description: 'DOCX certificate template is uploaded to Supabase Storage.',
        complete: Boolean(state.templateRecord),
      },
      {
        id: 'excel',
        label: 'Excel selected',
        description: 'Excel participant sheet is uploaded and headers are detected.',
        complete: Boolean(state.uploadRecord),
      },
      {
        id: 'mapping',
        label: 'Mapping',
        description: 'Required template fields are mapped to detected Excel columns.',
        complete: hasRequiredMappings(state),
      },
      {
        id: 'preview',
        label: 'Preview',
        description: 'A real Excel preview row is selected for HTML preview.',
        complete: state.previewRows.length > 0 && hasRequiredMappings(state) && getMergeResult(state).valid,
      },
      {
        id: 'draft',
        label: 'Draft Saved',
        description: 'Current mapping and preview data are saved to a generation draft.',
        complete: Boolean(state.draftRecord) && !state.draftDirty,
      },
      {
        id: 'ready',
        label: 'Ready to Generate',
        description: 'A saved valid draft can generate one DOCX from the selected preview row.',
        complete: Boolean(state.draftRecord) && !state.draftDirty && hasRequiredMappings(state) && getMergeResult(state).valid,
      },
    ]
  },
  getPreviewData: previewDataFromState,
  getMergeResult,
  getValidationResult,
  getMissingRequiredFields(state) {
    return getValidationResult(state).missingMappings
  },
  steps: [
    {
      id: 'template',
      label: 'Upload Template',
      component: TemplateStep,
      isComplete: (state) => Boolean(state.templateRecord),
    },
    {
      id: 'excel',
      label: 'Upload Excel',
      component: ExcelStep,
      isComplete: (state) => Boolean(state.uploadRecord),
    },
    {
      id: 'mapping',
      label: 'Review Mapping',
      component: MappingStep,
      isComplete: hasRequiredMappings,
    },
    {
      id: 'preview',
      label: 'Preview Row',
      component: PreviewStep,
      isComplete: hasRequiredMappings,
    },
    {
      id: 'generate',
      label: 'Generate DOCX',
      component: GenerateStep,
      isComplete: (state) => state.generationComplete,
    },
    {
      id: 'downloads',
      label: 'Result',
      component: DownloadsStep,
      isComplete: (state) => state.generationComplete,
    },
  ],
}
