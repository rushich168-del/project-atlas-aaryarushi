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
import {
  ARITHMETIC_OPERATIONS,
  ARITHMETIC_OPERATION_IDS,
  DEFAULT_PASTED_INPUT_MODE,
  DEFAULT_QUESTION_SOURCE_MODE,
  PASTED_INPUT_MODE_OPTIONS,
  QUESTION_BLUEPRINT_MODES,
  QUESTION_DIFFICULTY_DISTRIBUTIONS,
  QUESTION_PAPER_PATTERNS,
  QUESTION_REFRESH_VARIANTS,
  QUESTION_SECTION_PATTERNS,
  QUESTION_SOURCE_MODE_OPTIONS,
  QUESTION_VARIANTS,
  WORKSHEET_DIFFICULTIES,
  WORKSHEET_GENERATED_COLUMNS,
  QUESTION_PAPER_GENERATED_COLUMNS,
} from './builder/builderPresets.js'
import {
  ANSWER_KEY_LOCATIONS,
  BOARD_EXAMPLES,
  EXAM_TYPES,
  PAPER_QUESTION_TYPES,
  SECTION_LAYOUTS,
  SECTION_NAMING_STYLES,
  SYLLABUS_SOURCES,
  WORKSHEET_ANSWER_SPACES,
  WORKSHEET_LAYOUT_STYLES,
  WORKSHEET_QUESTION_LAYOUTS,
} from './builder/educationPresets.js'
import { getQuestionBankScopes, PLACEHOLDER_ONLY_SCOPE_ID } from './question-bank/questionBankService.js'

const QUESTION_BANK_SCOPE_OPTIONS = [
  { value: PLACEHOLDER_ONLY_SCOPE_ID, label: 'Placeholder only / custom blueprint' },
  ...getQuestionBankScopes().map((scope) => ({ value: scope.id, label: scope.label })),
]

const QUESTION_VARIANT_OPTIONS = QUESTION_VARIANTS.map((variant) => ({ value: variant.id, label: variant.label }))
const QUESTION_REFRESH_VARIANT_OPTIONS = QUESTION_REFRESH_VARIANTS.map((variant) => ({ value: variant.id, label: variant.label }))
const QUESTION_BLUEPRINT_MODE_OPTIONS = QUESTION_BLUEPRINT_MODES.map((mode) => ({ value: mode.id, label: mode.label }))
const QUESTION_SECTION_PATTERN_OPTIONS = QUESTION_SECTION_PATTERNS.map((pattern) => ({ value: pattern.id, label: pattern.label }))

// Auto Builder configuration for the content-builder products (worksheet, question
// paper). Config-driven so the UI stays generic; the pure generators live in
// ./builder/*.js. Phase 1 is an Arithmetic worksheet group + a question-paper
// blueprint group. Adding classes/subjects/topics later means extending these.
const worksheetBuilderConfig = {
  type: 'worksheet',
  builderType: 'worksheet',
  defaultMode: 'build',
  title: 'Worksheet setup',
  description: 'Fill in the details, then download your worksheet. Questions and the answer key are made for you.',
  presetLabel: 'Question pattern',
  previewTitle: 'Worksheet preview',
  supportedPatterns: ARITHMETIC_OPERATION_IDS,
  generatedColumns: WORKSHEET_GENERATED_COLUMNS,
  generateLabel: 'Generate worksheet preview',
  note: 'Questions and the answer key are generated in your browser. Board and chapter are for your reference — full syllabus question banks come later.',
  presets: ARITHMETIC_OPERATIONS.map((operation) => ({
    id: operation.id,
    label: operation.label,
    values: { operation: operation.id, topic: operation.topic },
  })),
  presetMatch: (values, preset) => values.operation === preset.values.operation,
  fields: [
    { id: 'institution', label: 'School / College name', type: 'text', default: '', placeholder: 'e.g. Sunrise Public School', full: true },
    { id: 'title', label: 'Worksheet title', type: 'text', default: 'Addition Practice', full: true },
    { id: 'grade', label: 'Class / grade', type: 'text', default: 'Class 2' },
    { id: 'section', label: 'Section', type: 'text', default: '', placeholder: 'e.g. A' },
    { id: 'studentName', label: 'Student name', type: 'text', default: '', helper: 'Leave blank for a fill-in line.' },
    { id: 'rollNo', label: 'Roll No', type: 'text', default: '', helper: 'Leave blank for a fill-in line.' },
    { id: 'subject', label: 'Subject', type: 'text', default: 'Mathematics' },
    { id: 'date', label: 'Date', type: 'text', default: '', placeholder: 'e.g. 06/07/2026' },
    { id: 'syllabusSource', label: 'Syllabus source', type: 'select', default: 'builtin', options: SYLLABUS_SOURCES.map((source) => ({ value: source.id, label: source.label })) },
    { id: 'board', label: 'Board / syllabus', type: 'text', default: 'CBSE', placeholder: BOARD_EXAMPLES, helper: 'Board/syllabus is for your reference. Full syllabus question banks will come later.' },
    { id: 'chapter', label: 'Chapter', type: 'text', default: '' },
    { id: 'topic', label: 'Topic', type: 'text', default: 'Addition' },
    { id: 'subtopic', label: 'Learning goal', type: 'text', default: '', full: true },
    { id: 'syllabusNotes', label: 'Paste syllabus / chapter / topic notes', type: 'textarea', default: '', full: true, placeholder: 'Optional — for your reference only. The app stores and shows this; it does not read the syllabus yet.', showIf: { syllabusSource: 'custom' } },
    { id: 'operation', label: 'Question pattern', type: 'select', default: 'addition', options: ARITHMETIC_OPERATIONS.map((operation) => ({ value: operation.id, label: operation.label })) },
    { id: 'difficulty', label: 'Difficulty', type: 'select', default: 'easy', options: WORKSHEET_DIFFICULTIES.map((level) => ({ value: level.id, label: level.label })) },
    { id: 'count', label: 'Number of questions', type: 'number', default: 10, min: 1, max: 100 },
    { id: 'min', label: 'Number range (smallest)', type: 'number', default: 1, min: 0, max: 100000 },
    { id: 'max', label: 'Number range (largest)', type: 'number', default: 10, min: 0, max: 100000 },
    { id: 'layoutStyle', label: 'Layout style', type: 'select', default: 'exam', options: WORKSHEET_LAYOUT_STYLES.map((item) => ({ value: item.id, label: item.label })) },
    { id: 'questionLayout', label: 'Question layout', type: 'select', default: 'one', options: WORKSHEET_QUESTION_LAYOUTS.map((item) => ({ value: item.id, label: item.label })) },
    { id: 'answerSpace', label: 'Answer space', type: 'select', default: 'short', options: WORKSHEET_ANSWER_SPACES.map((item) => ({ value: item.id, label: item.label })) },
    { id: 'includeAnswerKey', label: 'Add answer key', type: 'toggle', default: true },
    { id: 'answerKeyLocation', label: 'Answer key location', type: 'select', default: 'end', options: ANSWER_KEY_LOCATIONS.map((item) => ({ value: item.id, label: item.label })), showIf: { includeAnswerKey: true } },
    { id: 'instructions', label: 'Instructions', type: 'text', default: 'Solve all the questions.', full: true },
  ],
}

const questionPaperBuilderConfig = {
  type: 'question',
  builderType: 'question-paper',
  defaultMode: 'build',
  title: 'Question paper setup',
  description: 'Fill in the paper details, then download your question paper. Sections, marks and totals are built for you.',
  presetLabel: 'Paper pattern',
  previewTitle: 'Question paper preview',
  generatedColumns: QUESTION_PAPER_GENERATED_COLUMNS,
  generateLabel: 'Generate paper preview',
  note: 'I already have questions: paste your section-wise paper and Project Atlas detects sections, marks and question types. I have notes / reference material: draft practice questions are created for teacher review. Advanced options (built-in starter bank, Quick Pattern, plain question list) stay available under Advanced.',
  presets: QUESTION_PAPER_PATTERNS.map((pattern) => ({
    id: pattern.id,
    label: pattern.label,
    values: {
      blueprintMode: 'pattern-preset',
      sectionPatternId: 'uniform',
      numSections: pattern.sections,
      questionsPerSection: pattern.questionsPerSection,
      marksPerQuestion: pattern.marksPerQuestion,
      questionType: pattern.questionType,
    },
  })),
  presetMatch: (values, preset) => Number(values.numSections) === preset.values.numSections
    && Number(values.questionsPerSection) === preset.values.questionsPerSection,
  fields: [
    { id: 'institution', label: 'School / College name', type: 'text', default: '', placeholder: 'e.g. Sunrise Public School', full: true },
    { id: 'title', label: 'Test / Paper title', type: 'text', default: 'Unit Test 1', full: true },
    { id: 'grade', label: 'Class / grade', type: 'text', default: 'Class 6' },
    { id: 'subject', label: 'Subject', type: 'text', default: 'Mathematics' },
    { id: 'date', label: 'Date', type: 'text', default: '', placeholder: 'e.g. 06/07/2026' },
    { id: 'syllabusSource', label: 'Syllabus source', type: 'select', default: 'builtin', options: SYLLABUS_SOURCES.map((source) => ({ value: source.id, label: source.label })), advanced: true },
    { id: 'board', label: 'Board / syllabus', type: 'text', default: 'CBSE', placeholder: BOARD_EXAMPLES, helper: 'Board/syllabus is for your reference. Full syllabus question banks will come later.', advanced: true },
    { id: 'chapterRange', label: 'Chapters', type: 'text', default: 'Arithmetic', advanced: true },
    { id: 'topicRange', label: 'Topics', type: 'text', default: 'Integers', advanced: true },
    { id: 'questionSourceMode', label: 'Question source', type: 'select', default: DEFAULT_QUESTION_SOURCE_MODE, options: QUESTION_SOURCE_MODE_OPTIONS, full: true, helper: 'I already have questions: paste your section-wise paper. I have notes / reference material: Project Atlas creates draft practice questions for teacher review. Use built-in starter bank: available where starter-bank content exists.' },
    { id: 'teacherPastedMaterial', label: 'Paste your section-wise question paper', type: 'textarea', default: '', full: true, placeholder: 'SECTION A | 1 MARK | MCQ\n\n1. Who introduced set theory?\n2. Which of the following is a set?\n\nSECTION B | 2 MARKS | SHORT ANSWER\n\n1. Define a set.', helper: 'Add a heading like "SECTION A | 1 MARK | MCQ" before each part. Project Atlas detects sections, marks and question types. Your question text is kept exactly as pasted.', showIf: { questionSourceMode: 'pasted-material' } },
    { id: 'pastedInputMode', label: 'Paste format', type: 'select', default: DEFAULT_PASTED_INPUT_MODE, options: PASTED_INPUT_MODE_OPTIONS, helper: 'Section-wise question paper detects SECTION headings, marks and types. Plain question list treats every line as one question.', showIf: { questionSourceMode: 'pasted-material' }, advanced: true },
    { id: 'referenceMaterial', label: 'Paste chapter notes / material', type: 'textarea', default: '', full: true, placeholder: 'Paste your notes, syllabus points, or chapter material — one point per line works best.', helper: 'Paste your own notes, syllabus points, or chapter material. Project Atlas creates draft practice questions for teacher review — not copied book questions.', showIf: { questionSourceMode: 'reference-topic' } },
    { id: 'referenceBook', label: 'Reference / book name (optional)', type: 'text', default: '', placeholder: 'e.g. Class 6 Mathematics reference', helper: 'Used only as a label. Draft practice questions are based on your material and topic — book questions are not copied or reproduced.', showIf: { questionSourceMode: 'reference-topic' }, advanced: true },
    { id: 'referenceChapter', label: 'Reference chapter / unit (optional)', type: 'text', default: '', placeholder: 'e.g. Integers', showIf: { questionSourceMode: 'reference-topic' }, advanced: true },
    { id: 'teacherInstructions', label: 'Extra instruction for draft questions', type: 'textarea', default: '', full: true, placeholder: 'Optional notes to guide your own review. Stored only in this form for your reference.', showIf: { questionSourceMode: 'reference-topic' }, advanced: true },
    { id: 'questionBankScopeId', label: 'Question bank content', type: 'select', default: PLACEHOLDER_ONLY_SCOPE_ID, options: QUESTION_BANK_SCOPE_OPTIONS, helper: 'Only the listed Class 6 Mathematics starter bank has real questions. Placeholder-only keeps the existing blueprint flow.', full: true, showIf: { questionSourceMode: 'starter-bank' }, advanced: true },
    { id: 'questionVariant', label: 'Question Set', type: 'select', default: 'set-a', options: QUESTION_VARIANT_OPTIONS, helper: 'Set A, B, and C use deterministic selection from the same available bank. No hidden randomness.', showIf: { questionSourceMode: 'starter-bank' }, advanced: true },
    { id: 'refreshVariant', label: 'Refresh Variant', type: 'select', default: 'refresh-1', options: QUESTION_REFRESH_VARIANT_OPTIONS, helper: 'Same settings and same refresh produce the same paper. Change refresh to rotate available questions.', showIf: { questionSourceMode: 'starter-bank' }, advanced: true },
    { id: 'blueprintMode', label: 'Paper Setup', type: 'select', default: 'teacher-blueprint', options: QUESTION_BLUEPRINT_MODE_OPTIONS, helper: 'Custom Section Setup lets you control each section. Advanced: Quick Pattern uses ready-made structures.' },
    { id: 'sectionPatternId', label: 'Quick pattern', type: 'select', default: 'uniform', options: QUESTION_SECTION_PATTERN_OPTIONS, helper: 'Simple keeps the current fields. Other patterns set section type, count, marks, and difficulty.', showIf: { blueprintMode: 'pattern-preset' }, advanced: true },
    { id: 'syllabusNotes', label: 'Paste prescribed syllabus / chapter list / topic scope', type: 'textarea', default: '', full: true, placeholder: 'Optional — guides your setup. The app stores and shows this; it does not generate real content yet.', showIf: { syllabusSource: 'custom' }, advanced: true },
    { id: 'examType', label: 'Exam type', type: 'select', default: 'unit-test', options: EXAM_TYPES.map((type) => ({ value: type.id, label: type.label })) },
    { id: 'duration', label: 'Duration', type: 'text', default: '1 hour' },
    { id: 'numSections', label: 'Number of sections', type: 'number', default: 2, min: 1, max: 10, advanced: true },
    { id: 'questionsPerSection', label: 'Questions per section', type: 'number', default: 5, min: 1, max: 50, advanced: true },
    { id: 'marksPerQuestion', label: 'Marks per question', type: 'number', default: 3, min: 1, max: 100, advanced: true },
    { id: 'questionType', label: 'Question type', type: 'select', default: 'Short answer', options: PAPER_QUESTION_TYPES.map((type) => ({ value: type, label: type })), helper: 'Used for placeholders and starter-bank metadata where available.', advanced: true },
    { id: 'difficultyDistribution', label: 'Difficulty mix', type: 'select', default: 'balanced', options: QUESTION_DIFFICULTY_DISTRIBUTIONS.map((item) => ({ value: item.id, label: item.label })), advanced: true },
    { id: 'sectionNamingStyle', label: 'Section naming style', type: 'select', default: 'section', options: SECTION_NAMING_STYLES.map((item) => ({ value: item.id, label: item.label })), advanced: true },
    { id: 'sectionLayout', label: 'Section layout', type: 'select', default: 'continuous', options: SECTION_LAYOUTS.map((item) => ({ value: item.id, label: item.label })), advanced: true },
    { id: 'showMarks', label: 'Show marks', type: 'toggle', default: true },
    { id: 'includeAnswerKey', label: 'Add answer key', type: 'toggle', default: false },
    { id: 'instructions', label: 'Instructions', type: 'text', default: 'Answer all questions.', full: true },
  ],
}

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
  const stepLabels = options.stepLabels || {}

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
    workspacePattern: options.workspacePattern || 'data-template',
    starterPack: options.starterPack || null,
    builder: options.builder || null,
    builderModeEnabled: options.builderModeEnabled || false,
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
        builderMode: options.builder?.defaultMode || 'upload',
        builderConfig: null,
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
          productSlug: workspace.product?.slug || options.productSlug,
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
            productSlug: workspace.product?.slug || options.productSlug,
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
      { id: 'template', label: stepLabels.template || 'Upload Template', component: TemplateStep, isComplete: (state) => Boolean(state.templateRecord) },
      { id: 'excel', label: stepLabels.excel || 'Upload Excel', component: ExcelStep, isComplete: (state) => Boolean(state.uploadRecord) },
      { id: 'mapping', label: stepLabels.mapping || 'Review Mapping', component: MappingStep, isComplete: hasRequiredMappings },
      { id: 'preview', label: stepLabels.preview || 'Preview Row', component: PreviewStep, isComplete: hasRequiredMappings },
      { id: 'generate', label: stepLabels.generate || 'Generate DOCX', component: GenerateStep, isComplete: (state) => state.generationComplete },
      { id: 'downloads', label: stepLabels.downloads || 'Result', component: DownloadsStep, isComplete: (state) => state.generationComplete },
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
    { id: 'fullname', label: 'FullName', placeholder: '{{FullName}}', required: true, type: 'text', sample: 'Aarya Rushi' },
    { id: 'idnumber', label: 'IDNumber', placeholder: '{{IDNumber}}', required: true, type: 'text', sample: 'ID-001' },
    { id: 'class', label: 'Class', placeholder: '{{Class}}', required: true, type: 'text', sample: 'Class 7' },
    { id: 'section', label: 'Section', placeholder: '{{Section}}', required: true, type: 'text', sample: 'A' },
    { id: 'role', label: 'Role', placeholder: '{{Role}}', required: true, type: 'text', sample: 'Student' },
    { id: 'academicyear', label: 'AcademicYear', placeholder: '{{AcademicYear}}', required: true, type: 'text', sample: '2026-27' },
    { id: 'bloodgroup', label: 'BloodGroup', placeholder: '{{BloodGroup}}', required: true, type: 'text', sample: 'O+' },
    { id: 'contactnumber', label: 'ContactNumber', placeholder: '{{ContactNumber}}', required: true, type: 'text', sample: '+91 90000 00000' },
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
    workspacePattern: 'data-template',
    eyebrow: 'AR-MARKSHEET-PRO Workspace',
    title: 'Marksheet DOCX Workspace',
    description: 'Generate marksheet DOCX documents from a marksheet template and student marks Excel data.',
    placeholderHelp: 'Example: {{StudentName}} matches StudentName, {{RollNo}} matches RollNo, and {{Maths}} matches Maths in the Student marks Excel.',
    templateFields: sharedFields.marksheet,
    copy: {
      templateTitle: 'Upload marksheet template',
      templateDescription: 'Choose a DOCX marksheet template using engine placeholders such as {{StudentName}}, {{RollNo}}, {{Maths}}, {{Physics}}, {{Chemistry}}, {{Total}}, and {{Grade}}.',
      templateEmptyText: 'No marksheet DOCX template uploaded yet.',
      excelEmptyText: 'No student marks Excel uploaded yet.',
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
    workspacePattern: 'data-template',
    eyebrow: 'AR-REPORT-PRO Workspace',
    title: 'Report DOCX Workspace',
    description: 'Generate student report DOCX documents from a student report template and student performance Excel data.',
    placeholderHelp: 'Example: {{StudentName}} matches StudentName, {{Attendance}} matches Attendance, and {{TeacherRemarks}} matches TeacherRemarks in the Student performance Excel.',
    templateFields: sharedFields.report,
    copy: {
      templateTitle: 'Upload student report template',
      templateDescription: 'Choose a DOCX student report template using engine placeholders such as {{StudentName}}, {{RollNo}}, {{Class}}, {{Section}}, {{Attendance}}, {{Performance}}, {{TeacherRemarks}}, and {{Result}}.',
      templateEmptyText: 'No student report DOCX template uploaded yet.',
      excelEmptyText: 'No student performance Excel uploaded yet.',
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
    workspacePattern: 'content-builder',
    eyebrow: 'WORKSHEET BUILDER',
    title: 'Worksheet Builder',
    description: 'Use a Word layout and an Excel content sheet. Project Atlas fills the worksheet automatically.',
    placeholderHelp: 'Upload a worksheet layout, add your content Excel, then generate — the worksheet is built for you.',
    stepLabels: {
      template: 'Upload worksheet layout',
      excel: 'Upload worksheet content',
      mapping: 'Match worksheet fields',
      preview: 'Preview worksheet',
      generate: 'Generate worksheet DOCX',
      downloads: 'Download worksheet',
    },
    starterPack: {
      title: 'Worksheet sample pack',
      description: 'Project Atlas fills the worksheet automatically from your Excel content. Download a ready-made layout and content sample to start in seconds — files are generated locally in your browser.',
      metadataLabel: 'Worksheet details',
      metadataFields: ['WorksheetTitle', 'Class', 'Subject', 'Topic'],
      contentLabel: 'Content fields',
      contentFields: ['Question1', 'Question2', 'Question3', 'Instructions'],
      callout: 'The worksheet is built automatically from your Excel content.',
    },
    builder: worksheetBuilderConfig,
    builderModeEnabled: true,
    templateFields: sharedFields.worksheet,
    copy: {
      templateTitle: 'Upload worksheet layout',
      templateDescription: 'Choose a Word layout that shapes the worksheet. Placeholders like {{WorksheetTitle}}, {{Topic}}, and {{Question1}} are filled automatically from your content.',
      templateEmptyText: 'No worksheet layout template uploaded yet.',
      excelEmptyText: 'No worksheet content Excel uploaded yet.',
      excelTitle: 'Upload worksheet content',
      excelDescription: 'Choose your worksheet content Excel (class, subject, topic, questions, instructions). Columns are detected automatically.',
      generateTitle: 'Generate worksheet DOCX',
      generateDescription: 'Generate one worksheet from the preview, or a batch from every valid content row.',
      previewTitle: 'Preview worksheet',
      previewDescription: 'Review one worksheet built from your content before generating.',
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
    workspacePattern: 'content-builder',
    eyebrow: 'QUESTION PAPER BUILDER',
    title: 'Question Paper Builder',
    description: 'Use a Word paper layout and an Excel question bank. Project Atlas builds the question paper automatically.',
    placeholderHelp: 'Upload a paper layout, add your question bank Excel, then generate — the question paper is built for you.',
    stepLabels: {
      template: 'Upload paper layout',
      excel: 'Upload question bank',
      mapping: 'Match question fields',
      preview: 'Preview question paper',
      generate: 'Generate question paper DOCX',
      downloads: 'Download question paper',
    },
    starterPack: {
      title: 'Question paper sample pack',
      description: 'Project Atlas builds the question paper automatically from your question bank. Download a ready-made paper layout and question bank sample to start in seconds — files are generated locally in your browser.',
      metadataLabel: 'Paper details',
      metadataFields: ['ExamName', 'Class', 'Subject', 'Chapter', 'TimeAllowed'],
      contentLabel: 'Question fields',
      contentFields: ['QuestionNo', 'QuestionText', 'Marks'],
      callout: 'The question paper is built automatically from your question bank.',
    },
    builder: questionPaperBuilderConfig,
    builderModeEnabled: true,
    templateFields: sharedFields.question,
    copy: {
      templateTitle: 'Upload paper layout',
      templateDescription: 'Choose a Word paper layout. Placeholders like {{ExamName}}, {{QuestionNo}}, and {{Marks}} are filled automatically from your question bank.',
      templateEmptyText: 'No question paper layout template uploaded yet.',
      excelEmptyText: 'No question bank Excel uploaded yet.',
      excelTitle: 'Upload question bank',
      excelDescription: 'Choose your question bank Excel (exam, class, subject, question, marks). Columns are detected automatically.',
      generateTitle: 'Generate question paper DOCX',
      generateDescription: 'Generate one question paper from the preview, or a batch from every valid question-bank row.',
      previewTitle: 'Preview question paper',
      previewDescription: 'Review one question paper built from your question bank before generating.',
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
  'ar-idcard-pro': createSharedDocumentWorkspaceConfig({
    id: 'idcard',
    productSlug: 'ar-idcard-pro',
    productName: 'AR-IDCARD-PRO',
    suite: 'Education Suite / HR / Admin Suite',
    templateLabel: 'ID card template',
    excelLabel: 'Student/staff details Excel',
    outputLabel: 'ID cards',
    placeholderExamples: ['{{FullName}}', '{{IDNumber}}', '{{Class}}', '{{Section}}', '{{Role}}', '{{AcademicYear}}', '{{BloodGroup}}', '{{ContactNumber}}'],
    shortName: 'ID card',
    primaryFieldId: 'fullname',
    idFieldId: 'idnumber',
    workspacePattern: 'data-template',
    eyebrow: 'AR-IDCARD-PRO Workspace',
    title: 'ID Card Text DOCX Workspace',
    description: 'Prepare text-based ID card DOCX documents from an ID card template and student/staff details Excel data.',
    placeholderHelp: 'Example: {{FullName}} matches FullName, {{IDNumber}} matches IDNumber, and {{Class}} matches Class in the Student/staff details Excel. Photo/image placement is not automated in this workspace yet.',
    templateFields: sharedFields.idcard,
    copy: {
      templateTitle: 'Upload ID card template',
      templateDescription: 'Choose a DOCX ID card template using text placeholders such as {{FullName}}, {{IDNumber}}, {{Class}}, {{Section}}, {{Role}}, {{AcademicYear}}, {{BloodGroup}}, and {{ContactNumber}}. For photo-based ID cards, keep a static/manual photo area in the template for now.',
      templateEmptyText: 'No ID card DOCX template uploaded yet.',
      excelEmptyText: 'No student/staff details Excel uploaded yet.',
      excelTitle: 'Upload student/staff details Excel',
      excelDescription: 'Choose the spreadsheet with student or staff text details. Column headers are detected in the browser.',
      previewTitle: 'Preview one ID card row',
      previewDescription: 'Review one student/staff detail row before generating text-based DOCX ID cards.',
      previewCardEyebrow: 'ID card preview',
      previewDocumentTitle: 'ID Card',
      previewSentence: (values) => `Role: ${values.role || 'Role'} / Year: ${values.academicyear || 'AcademicYear'}`,
      previewNameField: 'fullname',
      previewIdField: 'idnumber',
      previewIdFallback: 'ID-NUMBER',
      optionalField: 'contactnumber',
      optionalFieldLabel: 'Contact number',
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
    workspacePattern: 'data-template',
    eyebrow: 'AR-INVOICE-PRO Workspace',
    title: 'Invoice DOCX Workspace',
    description: 'Generate invoice DOCX documents from an invoice template and customer/item Excel data.',
    placeholderHelp: 'Example: {{CustomerName}} matches CustomerName, {{ItemName}} matches ItemName, and {{TotalAmount}} matches TotalAmount in the Customer and item Excel.',
    templateFields: sharedFields.invoice,
    copy: {
      templateTitle: 'Upload invoice template',
      templateDescription: 'Choose a DOCX invoice template using engine placeholders such as {{InvoiceNo}}, {{InvoiceDate}}, {{CustomerName}}, {{CustomerAddress}}, {{ItemName}}, {{Quantity}}, {{Rate}}, {{Amount}}, and {{TotalAmount}}.',
      templateEmptyText: 'No invoice DOCX template uploaded yet.',
      excelEmptyText: 'No customer and item Excel uploaded yet.',
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
    workspacePattern: 'data-template',
    eyebrow: 'AR-FEE-RECEIPT-PRO Workspace',
    title: 'Fee Receipt DOCX Workspace',
    description: 'Generate fee receipt DOCX documents from a fee receipt template and student/payment Excel data.',
    placeholderHelp: 'Example: {{StudentName}} matches StudentName, {{AmountPaid}} matches AmountPaid, and {{PaymentMode}} matches PaymentMode in the Student/payment Excel.',
    templateFields: sharedFields.feeReceipt,
    copy: {
      templateTitle: 'Upload fee receipt template',
      templateDescription: 'Choose a DOCX fee receipt template using engine placeholders such as {{ReceiptNo}}, {{ReceiptDate}}, {{StudentName}}, {{RollNo}}, {{Class}}, {{FeeType}}, {{AmountPaid}}, {{PaymentMode}}, and {{Balance}}.',
      templateEmptyText: 'No fee receipt DOCX template uploaded yet.',
      excelEmptyText: 'No student/payment Excel uploaded yet.',
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
