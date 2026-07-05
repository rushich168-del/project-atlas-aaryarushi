import {
  DownloadsStep,
  ExcelStep,
  GenerateStep,
  MappingStep,
  PreviewStep,
  TemplateStep,
} from '../certificate/steps.jsx'
import { saveGenerationDraft } from '../certificate/services/certificateDraftsService.js'
import {
  downloadCertificateTemplateArrayBuffer,
  generateCertificateDocx,
  generateCertificateDocxForRow,
} from '../certificate/services/certificateGenerationService.js'
import { uploadGeneratedCertificateDocx } from '../certificate/services/certificateOutputsService.js'
import {
  BATCH_ROW_LIMIT,
  buildBatchStoragePath,
  completeGenerationJob,
  createGenerationJob,
  saveGenerationOutput,
  uploadBatchDocx,
} from '../certificate/services/certificateBatchService.js'
import { mergeRow, validateFieldMapping } from '../../core/atlas/index.js'
import { getStorageError } from '../../utils/errorMessages.js'

function createEmptyFieldMapping(fields) {
  return fields.reduce((mapping, field) => {
    mapping[field.id] = ''
    return mapping
  }, {})
}

function getDisplayName(mergeResult, rowIndex) {
  return mergeResult?.values?.name || mergeResult?.values?.certificate_id || `Row ${rowIndex + 1}`
}

export function createSharedDocumentWorkspaceConfig(options) {
  const templateFields = options.templateFields
  const requiredFieldIds = templateFields.filter((field) => field.required).map((field) => field.id)
  const emptyMapping = () => createEmptyFieldMapping(templateFields)

  function getMergeResultForRow(state, row) {
    return mergeRow({
      fieldDefinitions: templateFields,
      fieldMapping: state.fieldMapping,
      row,
      options: {
        locale: 'en-IN',
        emptyValue: '',
        trimText: true,
      },
    })
  }

  function getMergeResult(state) {
    return getMergeResultForRow(state, state.previewRows[state.previewRowIndex] || {})
  }

  function getValidationResult(state) {
    return validateFieldMapping({
      detectedPlaceholders: state.detectedPlaceholders,
      invalidPlaceholders: state.invalidPlaceholders,
      fieldDefinitions: templateFields,
      detectedColumns: state.detectedColumns,
      fieldMapping: state.fieldMapping,
    })
  }

  function hasRequiredMappings(state) {
    const validation = getValidationResult(state)
    return validation.valid && requiredFieldIds.every((fieldId) => Boolean(state.fieldMapping[fieldId]))
  }

  function validateBatchRows(state) {
    return (state.excelRows || []).map((row, index) => {
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

  const config = {
    id: options.id,
    productSlug: options.productSlug,
    eyebrow: options.eyebrow,
    title: options.title,
    description: options.description,
    templateFields,
    copy: options.copy,
    createEmptyFieldMapping: emptyMapping,
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
        fieldMapping: emptyMapping(),
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
      const rows = state.excelRows || []
      return Boolean(state.templateRecord && state.uploadRecord && hasRequiredMappings(state) && state.draftRecord && !state.draftDirty && rows.length > 0 && rows.length <= BATCH_ROW_LIMIT)
    },
    getBatchValidation: validateBatchRows,
    async saveWorkspace(state, workspace) {
      const productId = workspace.product?.organizationId ? workspace.product.id : null
      const draftRecord = await saveGenerationDraft({
        draftId: state.draftRecord?.id,
        organizationId: workspace.organization?.id,
        productId,
        templateId: state.templateRecord?.id,
        uploadId: state.uploadRecord?.id,
        fieldMapping: state.fieldMapping,
        previewRowIndex: state.previewRowIndex,
        previewData: getMergeResult(state).values,
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
        documentLabel: options.id,
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
      const rows = state.excelRows || []
      const productId = workspace.product?.organizationId ? workspace.product.id : null
      const workspaceId = state.draftRecord?.id
      const organizationId = workspace.organization?.id
      const userId = workspace.user?.id
      const validationRows = validateBatchRows(state)
      const validRows = validationRows.filter((row) => row.status === 'valid')
      const invalidRows = validationRows.filter((row) => row.status !== 'valid')

      if (rows.length > BATCH_ROW_LIMIT) {
        throw new Error('Batch generation supports up to 100 rows. Please split larger Excel files.')
      }

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
        outputs.push(await saveGenerationOutput({
          jobId: job.id,
          organizationId,
          productId,
          workspaceId,
          rowIndex: invalidRow.rowNumber,
          displayName: invalidRow.displayName,
          status: 'skipped',
          errorMessage: invalidRow.errorMessage,
          rowData: invalidRow.row,
        }))
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
            documentLabel: options.id,
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
            outputs.push(await saveGenerationOutput({
              jobId: job.id,
              organizationId,
              productId,
              workspaceId,
              rowIndex: batchRow.rowNumber,
              displayName: batchRow.displayName,
              fileName,
              status: 'upload_failed',
              errorMessage: uploadError,
              rowData: batchRow.row,
            }))
            continue
          }

          successCount += 1
          outputs.push(await saveGenerationOutput({
            jobId: job.id,
            organizationId,
            productId,
            workspaceId,
            rowIndex: batchRow.rowNumber,
            displayName: batchRow.displayName,
            fileName,
            storagePath,
            status: 'generated',
            rowData: batchRow.row,
          }))
        } catch (rowError) {
          failureCount += 1
          outputs.push(await saveGenerationOutput({
            jobId: job.id,
            organizationId,
            productId,
            workspaceId,
            rowIndex: batchRow.rowNumber,
            displayName: batchRow.displayName,
            status: 'failed',
            errorMessage: rowError,
            rowData: batchRow.row,
          }))
        }
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
      if (state.generating && !state.generatedDocx) return state.persistingOutput || state.generationProgress >= 70 ? 'Saving output' : 'Generating DOCX'
      if (state.generatedDocumentRecord) return 'Stored DOCX ready'
      if (state.generatedDocx && state.outputError) return 'Local fallback ready'
      if (state.generatedDocx) return 'DOCX ready'
      return 'Ready'
    },
    getReadinessItems(state) {
      return [
        { id: 'template', label: 'Template selected', description: `${options.shortName} DOCX template is uploaded.`, complete: Boolean(state.templateRecord) },
        { id: 'excel', label: 'Excel selected', description: `${options.shortName} Excel data is uploaded and columns are detected.`, complete: Boolean(state.uploadRecord) },
        { id: 'mapping', label: 'Mapping', description: 'Required fields are mapped to detected Excel columns.', complete: hasRequiredMappings(state) },
        { id: 'preview', label: 'Preview', description: 'A preview row is selected for review.', complete: state.previewRows.length > 0 && hasRequiredMappings(state) && getMergeResult(state).valid },
        { id: 'draft', label: 'Draft Saved', description: 'Current mapping and preview data are saved to a generation draft.', complete: Boolean(state.draftRecord) && !state.draftDirty },
        { id: 'ready', label: 'Ready to Generate', description: 'A saved valid draft can generate DOCX output.', complete: Boolean(state.draftRecord) && !state.draftDirty && hasRequiredMappings(state) && getMergeResult(state).valid },
      ]
    },
    getPreviewData(state) {
      return getMergeResult(state).values
    },
    getMergeResult,
    getValidationResult,
    getMissingRequiredFields(state) {
      return getValidationResult(state).missingMappings
    },
    steps: [
      { id: 'template', label: 'Upload Template', component: TemplateStep, isComplete: (state) => Boolean(state.templateRecord) },
      { id: 'excel', label: 'Upload Excel', component: ExcelStep, isComplete: (state) => Boolean(state.uploadRecord) },
      { id: 'mapping', label: 'Review Mapping', component: MappingStep, isComplete: hasRequiredMappings },
      { id: 'preview', label: 'Preview Row', component: PreviewStep, isComplete: hasRequiredMappings },
      { id: 'generate', label: 'Generate DOCX', component: GenerateStep, isComplete: (state) => state.generationComplete },
      { id: 'downloads', label: 'Result', component: DownloadsStep, isComplete: (state) => state.generationComplete },
    ],
  }

  return config
}

const sharedFields = {
  marksheet: [
    { id: 'name', label: 'Student name', placeholder: '{{name}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Class / subject', placeholder: '{{course}}', required: true, type: 'text', sample: 'Class 10 Mathematics' },
    { id: 'date', label: 'Result date', placeholder: '{{date}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'certificate_id', label: 'Roll number', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'ROLL-001' },
    { id: 'trainer', label: 'Remarks', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'Excellent' },
  ],
  report: [
    { id: 'name', label: 'Student name', placeholder: '{{name}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Report area', placeholder: '{{course}}', required: true, type: 'text', sample: 'Term Progress' },
    { id: 'date', label: 'Report date', placeholder: '{{date}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'certificate_id', label: 'Student ID', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'STU-001' },
    { id: 'trainer', label: 'Teacher remarks', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'Improving steadily' },
  ],
  worksheet: [
    { id: 'name', label: 'Worksheet title', placeholder: '{{name}}', required: true, type: 'text', sample: 'Fractions Practice' },
    { id: 'course', label: 'Class / subject', placeholder: '{{course}}', required: true, type: 'text', sample: 'Class 6 Math' },
    { id: 'date', label: 'Issue date', placeholder: '{{date}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'certificate_id', label: 'Worksheet ID', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'WS-001' },
    { id: 'trainer', label: 'Instructions', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'Answer all questions' },
  ],
  question: [
    { id: 'name', label: 'Paper title', placeholder: '{{name}}', required: true, type: 'text', sample: 'Science Practice Set' },
    { id: 'course', label: 'Class / subject', placeholder: '{{course}}', required: true, type: 'text', sample: 'Class 8 Science' },
    { id: 'date', label: 'Exam date', placeholder: '{{date}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'certificate_id', label: 'Paper code', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'QP-001' },
    { id: 'trainer', label: 'Section / marks', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'Section A - 20 marks' },
  ],
  idcard: [
    { id: 'name', label: 'Full name', placeholder: '{{name}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Class / department', placeholder: '{{course}}', required: true, type: 'text', sample: 'Class 7' },
    { id: 'date', label: 'Valid until', placeholder: '{{date}}', required: true, type: 'date', sample: 'March 31, 2027' },
    { id: 'certificate_id', label: 'ID number', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'ID-001' },
    { id: 'trainer', label: 'Photo reference', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'photo-001.jpg' },
  ],
  invoice: [
    { id: 'name', label: 'Customer name', placeholder: '{{name}}', required: true, type: 'text', sample: 'AaryaRushi Client' },
    { id: 'course', label: 'Item / service', placeholder: '{{course}}', required: true, type: 'text', sample: 'Automation setup' },
    { id: 'date', label: 'Invoice date', placeholder: '{{date}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'certificate_id', label: 'Invoice number', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'INV-001' },
    { id: 'trainer', label: 'Notes', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'Due on receipt' },
  ],
  feeReceipt: [
    { id: 'name', label: 'Student name', placeholder: '{{name}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Class / course', placeholder: '{{course}}', required: true, type: 'text', sample: 'Class 9' },
    { id: 'date', label: 'Receipt date', placeholder: '{{date}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'certificate_id', label: 'Receipt number', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'RCPT-001' },
    { id: 'trainer', label: 'Authorized by', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'Accounts Office' },
  ],
}

function previewSentence(label) {
  return (values) => `${label}: ${values.course || 'Details'} / ${values.date || 'Date'}`
}

export const sharedDocumentWorkspaceConfigs = {
  'ar-marksheet-pro': createSharedDocumentWorkspaceConfig({
    id: 'marksheet',
    productSlug: 'ar-marksheet-pro',
    shortName: 'Marksheet',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Marksheet DOCX Workspace',
    description: 'Generate marksheet DOCX documents from a marksheet template and student marks Excel data.',
    templateFields: sharedFields.marksheet,
    copy: {
      templateTitle: 'Upload marksheet template',
      templateDescription: 'Choose a DOCX marksheet template using placeholders such as {{name}}, {{course}}, {{date}}, and {{certificate_id}}.',
      excelTitle: 'Upload student marks Excel',
      excelDescription: 'Choose the spreadsheet with student marks rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one marksheet row',
      previewDescription: 'Review one student marks row before generating DOCX files.',
      previewCardEyebrow: 'Marksheet preview',
      previewDocumentTitle: 'Marksheet',
      previewSentence: previewSentence('Class / subject'),
      previewIdFallback: 'ROLL-ID',
      optionalFieldLabel: 'Remarks',
    },
  }),
  'ar-report-pro': createSharedDocumentWorkspaceConfig({
    id: 'report',
    productSlug: 'ar-report-pro',
    shortName: 'Report',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Report DOCX Workspace',
    description: 'Generate student report DOCX documents from a report template and student performance Excel data.',
    templateFields: sharedFields.report,
    copy: {
      templateTitle: 'Upload report template',
      templateDescription: 'Choose a DOCX report template using placeholders for student name, report area, date, and student ID.',
      excelTitle: 'Upload student performance Excel',
      excelDescription: 'Choose the spreadsheet with student report rows.',
      previewTitle: 'Preview one report row',
      previewDescription: 'Review one student report row before generating DOCX files.',
      previewCardEyebrow: 'Report preview',
      previewDocumentTitle: 'Student Report',
      previewSentence: previewSentence('Report area'),
      previewIdFallback: 'STUDENT-ID',
      optionalFieldLabel: 'Teacher remarks',
    },
  }),
  'ar-worksheet-pro': createSharedDocumentWorkspaceConfig({
    id: 'worksheet',
    productSlug: 'ar-worksheet-pro',
    shortName: 'Worksheet',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Worksheet DOCX Workspace',
    description: 'Generate worksheet DOCX documents from a worksheet template and worksheet content Excel data.',
    templateFields: sharedFields.worksheet,
    copy: {
      templateTitle: 'Upload worksheet template',
      templateDescription: 'Choose a DOCX worksheet template using placeholders for title, class/subject, issue date, and worksheet ID.',
      excelTitle: 'Upload worksheet content Excel',
      excelDescription: 'Choose the spreadsheet with worksheet content rows.',
      previewTitle: 'Preview one worksheet row',
      previewDescription: 'Review one worksheet row before generating DOCX files.',
      previewCardEyebrow: 'Worksheet preview',
      previewDocumentTitle: 'Worksheet',
      previewSentence: previewSentence('Class / subject'),
      previewIdFallback: 'WORKSHEET-ID',
      optionalFieldLabel: 'Instructions',
    },
  }),
  'ar-question-pro': createSharedDocumentWorkspaceConfig({
    id: 'question',
    productSlug: 'ar-question-pro',
    shortName: 'Question paper',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Question Paper DOCX Workspace',
    description: 'Generate question paper DOCX documents from a question template and question bank Excel data.',
    templateFields: sharedFields.question,
    copy: {
      templateTitle: 'Upload question paper template',
      templateDescription: 'Choose a DOCX question paper template using placeholders for paper title, subject, date, and paper code.',
      excelTitle: 'Upload question bank Excel',
      excelDescription: 'Choose the spreadsheet with question paper rows.',
      previewTitle: 'Preview one question row',
      previewDescription: 'Review one question row before generating DOCX files.',
      previewCardEyebrow: 'Question paper preview',
      previewDocumentTitle: 'Question Paper',
      previewSentence: previewSentence('Class / subject'),
      previewIdFallback: 'PAPER-CODE',
      optionalFieldLabel: 'Section / marks',
    },
  }),
  'ar-idcard-pro': createSharedDocumentWorkspaceConfig({
    id: 'idcard',
    productSlug: 'ar-idcard-pro',
    shortName: 'ID card',
    eyebrow: 'Shared DOCX Workspace',
    title: 'ID Card DOCX Workspace',
    description: 'Generate ID card DOCX documents from an ID card template and student/staff details Excel data.',
    templateFields: sharedFields.idcard,
    copy: {
      templateTitle: 'Upload ID card template',
      templateDescription: 'Choose a DOCX ID card template using placeholders for name, class/department, validity, and ID number.',
      excelTitle: 'Upload student/staff details Excel',
      excelDescription: 'Choose the spreadsheet with student or staff detail rows.',
      previewTitle: 'Preview one ID card row',
      previewDescription: 'Review one ID card row before generating DOCX files.',
      previewCardEyebrow: 'ID card preview',
      previewDocumentTitle: 'ID Card',
      previewSentence: previewSentence('Class / department'),
      previewIdFallback: 'ID-NUMBER',
      optionalFieldLabel: 'Photo reference',
    },
  }),
  'ar-invoice-pro': createSharedDocumentWorkspaceConfig({
    id: 'invoice',
    productSlug: 'ar-invoice-pro',
    shortName: 'Invoice',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Invoice DOCX Workspace',
    description: 'Generate invoice DOCX documents from an invoice template and customer/item Excel data.',
    templateFields: sharedFields.invoice,
    copy: {
      templateTitle: 'Upload invoice template',
      templateDescription: 'Choose a DOCX invoice template using placeholders for customer, item/service, date, and invoice number.',
      excelTitle: 'Upload customer/item Excel',
      excelDescription: 'Choose the spreadsheet with invoice rows.',
      previewTitle: 'Preview one invoice row',
      previewDescription: 'Review one invoice row before generating DOCX files.',
      previewCardEyebrow: 'Invoice preview',
      previewDocumentTitle: 'Invoice',
      previewSentence: previewSentence('Item / service'),
      previewIdFallback: 'INVOICE-NUMBER',
      optionalFieldLabel: 'Notes',
    },
  }),
  'ar-fee-receipt-pro': createSharedDocumentWorkspaceConfig({
    id: 'fee-receipt',
    productSlug: 'ar-fee-receipt-pro',
    shortName: 'Fee receipt',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Fee Receipt DOCX Workspace',
    description: 'Generate fee receipt DOCX documents from a receipt template and fee/student Excel data.',
    templateFields: sharedFields.feeReceipt,
    copy: {
      templateTitle: 'Upload fee receipt template',
      templateDescription: 'Choose a DOCX receipt template using placeholders for student, course, date, and receipt number.',
      excelTitle: 'Upload fee/student Excel',
      excelDescription: 'Choose the spreadsheet with fee receipt rows.',
      previewTitle: 'Preview one receipt row',
      previewDescription: 'Review one fee receipt row before generating DOCX files.',
      previewCardEyebrow: 'Fee receipt preview',
      previewDocumentTitle: 'Fee Receipt',
      previewSentence: previewSentence('Class / course'),
      previewIdFallback: 'RECEIPT-NUMBER',
      optionalFieldLabel: 'Authorized by',
    },
  }),
}
