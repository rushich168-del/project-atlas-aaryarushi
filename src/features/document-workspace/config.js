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

function getDisplayName(mergeResult, rowIndex, options) {
  return mergeResult?.values?.[options.primaryFieldId || 'name'] || mergeResult?.values?.[options.idFieldId || 'certificate_id'] || `Row ${rowIndex + 1}`
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
        displayName: getDisplayName(mergeResult, index, options),
        status: mergeResult.valid ? 'valid' : 'missing_required_field',
        missingFields: [...new Set(missingFields)],
        errorMessage: mergeResult.valid ? '' : mergeResult.errors.map((item) => item.message).join(' '),
      }
    })
  }

  const config = {
    id: options.id,
    productSlug: options.productSlug,
    productName: options.productName,
    suite: options.suite,
    templateLabel: options.templateLabel,
    excelLabel: options.excelLabel,
    outputLabel: options.outputLabel,
    placeholderExamples: options.placeholderExamples || [],
    supportedOutput: options.supportedOutput || 'DOCX',
    workspaceMode: options.workspaceMode || 'shared-docx',
    eyebrow: options.eyebrow,
    title: options.title,
    description: options.description,
    placeholderHelp: options.placeholderHelp,
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
    { id: 'studentname', label: 'StudentName', placeholder: '{{StudentName}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'rollno', label: 'RollNo', placeholder: '{{RollNo}}', required: true, type: 'text', sample: 'ROLL-001' },
    { id: 'maths', label: 'Maths', placeholder: '{{Maths}}', required: true, type: 'text', sample: '92' },
    { id: 'physics', label: 'Physics', placeholder: '{{Physics}}', required: true, type: 'text', sample: '88' },
    { id: 'chemistry', label: 'Chemistry', placeholder: '{{Chemistry}}', required: true, type: 'text', sample: '90' },
    { id: 'total', label: 'Total', placeholder: '{{Total}}', required: true, type: 'text', sample: '270' },
    { id: 'grade', label: 'Grade', placeholder: '{{Grade}}', required: true, type: 'text', sample: 'A+' },
  ],
  report: [
    { id: 'studentname', label: 'StudentName', placeholder: '{{StudentName}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'rollno', label: 'RollNo', placeholder: '{{RollNo}}', required: true, type: 'text', sample: 'ROLL-001' },
    { id: 'class', label: 'Class', placeholder: '{{Class}}', required: true, type: 'text', sample: 'Class 9' },
    { id: 'section', label: 'Section', placeholder: '{{Section}}', required: true, type: 'text', sample: 'A' },
    { id: 'attendance', label: 'Attendance', placeholder: '{{Attendance}}', required: true, type: 'text', sample: '92%' },
    { id: 'performance', label: 'Performance', placeholder: '{{Performance}}', required: true, type: 'text', sample: 'Strong progress' },
    { id: 'teacherremarks', label: 'TeacherRemarks', placeholder: '{{TeacherRemarks}}', required: true, type: 'text', sample: 'Keep practicing' },
    { id: 'result', label: 'Result', placeholder: '{{Result}}', required: true, type: 'text', sample: 'Pass' },
  ],
  worksheet: [
    { id: 'worksheettitle', label: 'WorksheetTitle', placeholder: '{{WorksheetTitle}}', required: true, type: 'text', sample: 'Fractions Practice' },
    { id: 'class', label: 'Class', placeholder: '{{Class}}', required: true, type: 'text', sample: 'Class 6' },
    { id: 'subject', label: 'Subject', placeholder: '{{Subject}}', required: true, type: 'text', sample: 'Mathematics' },
    { id: 'topic', label: 'Topic', placeholder: '{{Topic}}', required: true, type: 'text', sample: 'Fractions' },
    { id: 'question1', label: 'Question1', placeholder: '{{Question1}}', required: true, type: 'text', sample: 'Solve 1/2 + 1/4' },
    { id: 'question2', label: 'Question2', placeholder: '{{Question2}}', required: true, type: 'text', sample: 'Convert 3/4 to decimal' },
    { id: 'question3', label: 'Question3', placeholder: '{{Question3}}', required: true, type: 'text', sample: 'Compare 2/3 and 3/5' },
    { id: 'instructions', label: 'Instructions', placeholder: '{{Instructions}}', required: true, type: 'text', sample: 'Answer all questions' },
  ],
  question: [
    { id: 'examname', label: 'ExamName', placeholder: '{{ExamName}}', required: true, type: 'text', sample: 'Science Practice Test' },
    { id: 'class', label: 'Class', placeholder: '{{Class}}', required: true, type: 'text', sample: 'Class 8' },
    { id: 'subject', label: 'Subject', placeholder: '{{Subject}}', required: true, type: 'text', sample: 'Science' },
    { id: 'chapter', label: 'Chapter', placeholder: '{{Chapter}}', required: true, type: 'text', sample: 'Light' },
    { id: 'questionno', label: 'QuestionNo', placeholder: '{{QuestionNo}}', required: true, type: 'text', sample: 'Q1' },
    { id: 'questiontext', label: 'QuestionText', placeholder: '{{QuestionText}}', required: true, type: 'text', sample: 'Define reflection.' },
    { id: 'marks', label: 'Marks', placeholder: '{{Marks}}', required: true, type: 'text', sample: '2' },
    { id: 'timeallowed', label: 'TimeAllowed', placeholder: '{{TimeAllowed}}', required: true, type: 'text', sample: '45 minutes' },
  ],
  idcard: [
    { id: 'name', label: 'Full name', placeholder: '{{name}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'course', label: 'Class / department', placeholder: '{{course}}', required: true, type: 'text', sample: 'Class 7' },
    { id: 'date', label: 'Valid until', placeholder: '{{date}}', required: true, type: 'date', sample: 'March 31, 2027' },
    { id: 'certificate_id', label: 'ID number', placeholder: '{{certificate_id}}', required: true, type: 'text', sample: 'ID-001' },
    { id: 'trainer', label: 'Photo reference', placeholder: '{{trainer}}', required: false, type: 'text', sample: 'photo-001.jpg' },
  ],
  invoice: [
    { id: 'invoiceno', label: 'InvoiceNo', placeholder: '{{InvoiceNo}}', required: true, type: 'text', sample: 'INV-001' },
    { id: 'invoicedate', label: 'InvoiceDate', placeholder: '{{InvoiceDate}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'customername', label: 'CustomerName', placeholder: '{{CustomerName}}', required: true, type: 'text', sample: 'AaryaRushi Client' },
    { id: 'customeraddress', label: 'CustomerAddress', placeholder: '{{CustomerAddress}}', required: false, type: 'text', sample: 'Hyderabad' },
    { id: 'itemname', label: 'ItemName', placeholder: '{{ItemName}}', required: true, type: 'text', sample: 'Automation setup' },
    { id: 'quantity', label: 'Quantity', placeholder: '{{Quantity}}', required: true, type: 'text', sample: '1' },
    { id: 'rate', label: 'Rate', placeholder: '{{Rate}}', required: true, type: 'text', sample: '5000' },
    { id: 'amount', label: 'Amount', placeholder: '{{Amount}}', required: true, type: 'text', sample: '5000' },
    { id: 'totalamount', label: 'TotalAmount', placeholder: '{{TotalAmount}}', required: true, type: 'text', sample: '5000' },
  ],
  feeReceipt: [
    { id: 'receiptno', label: 'ReceiptNo', placeholder: '{{ReceiptNo}}', required: true, type: 'text', sample: 'RCPT-001' },
    { id: 'receiptdate', label: 'ReceiptDate', placeholder: '{{ReceiptDate}}', required: true, type: 'date', sample: 'July 5, 2026' },
    { id: 'studentname', label: 'StudentName', placeholder: '{{StudentName}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'rollno', label: 'RollNo', placeholder: '{{RollNo}}', required: true, type: 'text', sample: 'ROLL-001' },
    { id: 'class', label: 'Class', placeholder: '{{Class}}', required: true, type: 'text', sample: 'Class 9' },
    { id: 'feetype', label: 'FeeType', placeholder: '{{FeeType}}', required: true, type: 'text', sample: 'Tuition' },
    { id: 'amountpaid', label: 'AmountPaid', placeholder: '{{AmountPaid}}', required: true, type: 'text', sample: '2500' },
    { id: 'paymentmode', label: 'PaymentMode', placeholder: '{{PaymentMode}}', required: true, type: 'text', sample: 'UPI' },
    { id: 'balance', label: 'Balance', placeholder: '{{Balance}}', required: true, type: 'text', sample: '0' },
  ],
}

function previewSentence(label) {
  return (values) => `${label}: ${values.course || 'Details'} / ${values.date || 'Date'}`
}

export const sharedDocumentWorkspaceConfigs = {
  'ar-marksheet-pro': createSharedDocumentWorkspaceConfig({
    id: 'marksheet',
    productSlug: 'ar-marksheet-pro',
    productName: 'AR-MARKSHEET-PRO',
    suite: 'Education Suite',
    templateLabel: 'Marksheet template',
    excelLabel: 'Student marks Excel',
    outputLabel: 'Marksheets',
    placeholderExamples: ['{{StudentName}}', '{{RollNo}}', '{{Maths}}', '{{Physics}}', '{{Chemistry}}', '{{Total}}', '{{Grade}}'],
    shortName: 'Marksheet',
    primaryFieldId: 'studentname',
    idFieldId: 'rollno',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Marksheet DOCX Workspace',
    description: 'Generate marksheet DOCX documents from a marksheet template and student marks Excel data.',
    placeholderHelp: 'Example: {{StudentName}} matches StudentName, {{RollNo}} matches RollNo, and {{Maths}} matches Maths in the Student marks Excel.',
    templateFields: sharedFields.marksheet,
    copy: {
      templateTitle: 'Upload marksheet template',
      templateDescription: 'Choose a DOCX marksheet template using engine placeholders such as {{StudentName}}, {{RollNo}}, {{Maths}}, {{Physics}}, {{Chemistry}}, {{Total}}, and {{Grade}}.',
      excelTitle: 'Upload student marks Excel',
      excelDescription: 'Choose the spreadsheet with student marks rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one marksheet row',
      previewDescription: 'Review one student marks row before generating DOCX files.',
      previewCardEyebrow: 'Marksheet preview',
      previewDocumentTitle: 'Marksheet',
      previewSentence: (values) => `Marks: ${values.total || 'Total'} / Grade: ${values.grade || 'Grade'}`,
      previewNameField: 'studentname',
      previewIdField: 'rollno',
      previewIdFallback: 'ROLL-NO',
    },
  }),
  'ar-report-pro': createSharedDocumentWorkspaceConfig({
    id: 'report',
    productSlug: 'ar-report-pro',
    productName: 'AR-REPORT-PRO',
    suite: 'Education Suite',
    templateLabel: 'Student report template',
    excelLabel: 'Student performance Excel',
    outputLabel: 'Reports',
    placeholderExamples: ['{{StudentName}}', '{{RollNo}}', '{{Class}}', '{{Section}}', '{{Attendance}}', '{{Performance}}', '{{TeacherRemarks}}', '{{Result}}'],
    shortName: 'Report',
    primaryFieldId: 'studentname',
    idFieldId: 'rollno',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Report DOCX Workspace',
    description: 'Generate student report DOCX documents from a student report template and student performance Excel data.',
    placeholderHelp: 'Example: {{StudentName}} matches StudentName, {{Attendance}} matches Attendance, and {{TeacherRemarks}} matches TeacherRemarks in the Student performance Excel.',
    templateFields: sharedFields.report,
    copy: {
      templateTitle: 'Upload student report template',
      templateDescription: 'Choose a DOCX student report template using engine placeholders such as {{StudentName}}, {{RollNo}}, {{Class}}, {{Section}}, {{Attendance}}, {{Performance}}, {{TeacherRemarks}}, and {{Result}}.',
      excelTitle: 'Upload student performance Excel',
      excelDescription: 'Choose the spreadsheet with student performance rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one report row',
      previewDescription: 'Review one student performance row before generating DOCX reports.',
      previewCardEyebrow: 'Report preview',
      previewDocumentTitle: 'Student Report',
      previewSentence: (values) => `Performance: ${values.performance || 'Performance'} / Result: ${values.result || 'Result'}`,
      previewNameField: 'studentname',
      previewIdField: 'rollno',
      previewIdFallback: 'ROLL-NO',
      optionalField: 'teacherremarks',
      optionalFieldLabel: 'Teacher remarks',
    },
  }),
  'ar-worksheet-pro': createSharedDocumentWorkspaceConfig({
    id: 'worksheet',
    productSlug: 'ar-worksheet-pro',
    productName: 'AR-WORKSHEET-PRO',
    suite: 'Education Suite',
    templateLabel: 'Worksheet template',
    excelLabel: 'Worksheet content Excel',
    outputLabel: 'Worksheets',
    placeholderExamples: ['{{WorksheetTitle}}', '{{Class}}', '{{Subject}}', '{{Topic}}', '{{Question1}}', '{{Question2}}', '{{Question3}}', '{{Instructions}}'],
    shortName: 'Worksheet',
    primaryFieldId: 'worksheettitle',
    idFieldId: 'topic',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Worksheet DOCX Workspace',
    description: 'Generate worksheet DOCX documents from a worksheet template and worksheet content Excel data.',
    placeholderHelp: 'Example: {{WorksheetTitle}} matches WorksheetTitle, {{Topic}} matches Topic, and {{Question1}} matches Question1 in the Worksheet content Excel.',
    templateFields: sharedFields.worksheet,
    copy: {
      templateTitle: 'Upload worksheet template',
      templateDescription: 'Choose a DOCX worksheet template using engine placeholders such as {{WorksheetTitle}}, {{Class}}, {{Subject}}, {{Topic}}, {{Question1}}, {{Question2}}, {{Question3}}, and {{Instructions}}.',
      excelTitle: 'Upload worksheet content Excel',
      excelDescription: 'Choose the spreadsheet with worksheet content rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one worksheet row',
      previewDescription: 'Review one worksheet content row before generating DOCX worksheets.',
      previewCardEyebrow: 'Worksheet preview',
      previewDocumentTitle: 'Worksheet',
      previewSentence: (values) => `Subject: ${values.subject || 'Subject'} / Topic: ${values.topic || 'Topic'}`,
      previewNameField: 'worksheettitle',
      previewIdField: 'topic',
      previewIdFallback: 'TOPIC',
      optionalField: 'instructions',
      optionalFieldLabel: 'Instructions',
    },
  }),
  'ar-question-pro': createSharedDocumentWorkspaceConfig({
    id: 'question-paper',
    productSlug: 'ar-question-pro',
    productName: 'AR-QUESTION-PRO',
    suite: 'Education Suite',
    templateLabel: 'Question paper template',
    excelLabel: 'Question bank Excel',
    outputLabel: 'Question papers',
    placeholderExamples: ['{{ExamName}}', '{{Class}}', '{{Subject}}', '{{Chapter}}', '{{QuestionNo}}', '{{QuestionText}}', '{{Marks}}', '{{TimeAllowed}}'],
    shortName: 'Question paper',
    primaryFieldId: 'examname',
    idFieldId: 'questionno',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Question Paper DOCX Workspace',
    description: 'Generate question paper DOCX documents from a question paper template and question bank Excel data.',
    placeholderHelp: 'Example: {{ExamName}} matches ExamName, {{QuestionText}} matches QuestionText, and {{Marks}} matches Marks in the Question bank Excel.',
    templateFields: sharedFields.question,
    copy: {
      templateTitle: 'Upload question paper template',
      templateDescription: 'Choose a DOCX question paper template using engine placeholders such as {{ExamName}}, {{Class}}, {{Subject}}, {{Chapter}}, {{QuestionNo}}, {{QuestionText}}, {{Marks}}, and {{TimeAllowed}}.',
      excelTitle: 'Upload question bank Excel',
      excelDescription: 'Choose the spreadsheet with question bank rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one question row',
      previewDescription: 'Review one question bank row before generating DOCX question papers.',
      previewCardEyebrow: 'Question paper preview',
      previewDocumentTitle: 'Question Paper',
      previewSentence: (values) => `Question: ${values.questionno || 'QuestionNo'} / Marks: ${values.marks || 'Marks'}`,
      previewNameField: 'examname',
      previewIdField: 'questionno',
      previewIdFallback: 'QUESTION-NO',
      optionalField: 'timeallowed',
      optionalFieldLabel: 'Time allowed',
    },
  }),
  'ar-invoice-pro': createSharedDocumentWorkspaceConfig({
    id: 'invoice',
    productSlug: 'ar-invoice-pro',
    productName: 'AR-INVOICE-PRO',
    suite: 'Office / Business Suite',
    templateLabel: 'Invoice template',
    excelLabel: 'Customer and item Excel',
    outputLabel: 'Invoices',
    placeholderExamples: ['{{InvoiceNo}}', '{{InvoiceDate}}', '{{CustomerName}}', '{{CustomerAddress}}', '{{ItemName}}', '{{Quantity}}', '{{Rate}}', '{{Amount}}', '{{TotalAmount}}'],
    shortName: 'Invoice',
    primaryFieldId: 'customername',
    idFieldId: 'invoiceno',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Invoice DOCX Workspace',
    description: 'Generate invoice DOCX documents from an invoice template and customer/item Excel data.',
    placeholderHelp: 'Example: {{CustomerName}} matches CustomerName, {{ItemName}} matches ItemName, and {{TotalAmount}} matches TotalAmount in the Customer and item Excel.',
    templateFields: sharedFields.invoice,
    copy: {
      templateTitle: 'Upload invoice template',
      templateDescription: 'Choose a DOCX invoice template using engine placeholders such as {{InvoiceNo}}, {{InvoiceDate}}, {{CustomerName}}, {{CustomerAddress}}, {{ItemName}}, {{Quantity}}, {{Rate}}, {{Amount}}, and {{TotalAmount}}.',
      excelTitle: 'Upload customer and item Excel',
      excelDescription: 'Choose the spreadsheet with customer and item rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one invoice row',
      previewDescription: 'Review one customer/item row before generating DOCX invoices.',
      previewCardEyebrow: 'Invoice preview',
      previewDocumentTitle: 'Invoice',
      previewSentence: (values) => `Item: ${values.itemname || 'Item'} / Total: ${values.totalamount || 'TotalAmount'}`,
      previewNameField: 'customername',
      previewIdField: 'invoiceno',
      previewIdFallback: 'INVOICE-NO',
      optionalField: 'customeraddress',
      optionalFieldLabel: 'Customer address',
    },
  }),
  'ar-fee-receipt-pro': createSharedDocumentWorkspaceConfig({
    id: 'fee-receipt',
    productSlug: 'ar-fee-receipt-pro',
    productName: 'AR-FEE-RECEIPT-PRO',
    suite: 'Office / Business Suite',
    templateLabel: 'Fee receipt template',
    excelLabel: 'Student/payment Excel',
    outputLabel: 'Fee receipts',
    placeholderExamples: ['{{ReceiptNo}}', '{{ReceiptDate}}', '{{StudentName}}', '{{RollNo}}', '{{Class}}', '{{FeeType}}', '{{AmountPaid}}', '{{PaymentMode}}', '{{Balance}}'],
    shortName: 'Fee receipt',
    primaryFieldId: 'studentname',
    idFieldId: 'receiptno',
    eyebrow: 'Shared DOCX Workspace',
    title: 'Fee Receipt DOCX Workspace',
    description: 'Generate fee receipt DOCX documents from a fee receipt template and student/payment Excel data.',
    placeholderHelp: 'Example: {{StudentName}} matches StudentName, {{AmountPaid}} matches AmountPaid, and {{PaymentMode}} matches PaymentMode in the Student/payment Excel.',
    templateFields: sharedFields.feeReceipt,
    copy: {
      templateTitle: 'Upload fee receipt template',
      templateDescription: 'Choose a DOCX fee receipt template using engine placeholders such as {{ReceiptNo}}, {{ReceiptDate}}, {{StudentName}}, {{RollNo}}, {{Class}}, {{FeeType}}, {{AmountPaid}}, {{PaymentMode}}, and {{Balance}}.',
      excelTitle: 'Upload student/payment Excel',
      excelDescription: 'Choose the spreadsheet with student/payment rows. Column headers are detected in the browser.',
      previewTitle: 'Preview one fee receipt row',
      previewDescription: 'Review one student/payment row before generating DOCX fee receipts.',
      previewCardEyebrow: 'Fee receipt preview',
      previewDocumentTitle: 'Fee Receipt',
      previewSentence: (values) => `Fee type: ${values.feetype || 'FeeType'} / Amount paid: ${values.amountpaid || 'AmountPaid'}`,
      previewNameField: 'studentname',
      previewIdField: 'receiptno',
      previewIdFallback: 'RECEIPT-NO',
      optionalField: 'paymentmode',
      optionalFieldLabel: 'Payment mode',
    },
  }),
}
